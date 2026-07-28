## Phase 1, Step 1 — Listings data model (DB only) — revised

Database-only. One migration + supporting TypeScript in `/lib/validation/` and `/lib/auth/`.

### 1. Migration: tables

Create in `public`, each followed by `GRANT`, `ENABLE RLS`, then policies:

- `listings` — all spec columns, inline `check`s, `agent_id/created_by/updated_by → profiles(id) ON DELETE SET NULL`, `updated_at` via existing `tg_set_updated_at`.
- `listing_images`, `listing_documents`, `listing_tours` — as specced, `ON DELETE CASCADE`.

Base-table grants: `SELECT, INSERT, UPDATE, DELETE` to `authenticated`; `ALL` to `service_role`. **No `anon` grant on base tables** — public reads go through views (§4).

### 2. Indexes

`listings`: btree on `status`, `deal_type`, `property_type`, `address_city`, `price`, `published_at DESC`, `agent_id`; GIN on `features`. Btree on `listing_images(listing_id, sort_order)`, `listing_documents(listing_id)`, `listing_tours(listing_id, sort_order)`.

### 3. Functions and triggers

- `slugify(text)` — lowercase, translit `äöüß/áé…`, non-alphanum → `-`, collapse.
- `listings_generate_slug()` BEFORE INSERT — build `{property_type}-{city}-{rooms}-zimmer-{hex4}`, LOOP with unique-violation retry (max 5). Never re-generate on UPDATE.
- `validate_listing_energy(country, energy, property_type) → text[]`:
  - `property_type IN ('land','garage')` → `'{}'`.
  - `AT`: require `hwb` numeric, `eeb` numeric, `efficiency_class` ∈ (A++,A+,A,B,C,D,E,F,G).
  - `DE`: require `certificate_type` ∈ (Bedarfsausweis|Verbrauchsausweis), `final_energy` numeric, `energy_source` text, `efficiency_class` ∈ (A+..H), `year_built` int.
  - `CH,IS,US` → `'{}'` (extensible).
- `listings_validate_energy_on_publish()` BEFORE INSERT/UPDATE — when target status ∈ (`active`,`coming_soon`) and (INSERT or status changed):
  - Read `country` from `site_settings LIMIT 1`. **If NULL/no row → `RAISE EXCEPTION 'Site country is not configured; set site_settings.country before publishing listings'`** (correction #3).
  - Run validator; raise with the missing/invalid field names if non-empty.
- `listings_enforce_status_flow()` BEFORE UPDATE — allowed transitions per spec, else raise. Side-effects: → `active` sets `published_at = COALESCE(published_at, now())`; → `sold`/`rented` sets `sold_at = now()`; → `archived` sets `archived_at = now()`.
- `listings_enforce_publish_permission()` BEFORE INSERT/UPDATE — if target status ∈ (`active`,`coming_soon`) and (INSERT or status changed), require `listing.publish`; if target ∈ (`sold`,`rented`) and status changed, require `listing.status.change`. Raises readable errors (per approved trigger approach).
- `listings_set_actor()` BEFORE INSERT/UPDATE — set `created_by`/`updated_by` from `auth.uid()`.

### 4. Public views (correction #1)

Single explicit public surface. Base tables have **no anon read policy**.

- `CREATE VIEW listings_public WITH (security_invoker = true) AS SELECT <all cols except sold_price> FROM listings WHERE status IN ('active','coming_soon','reserved','sold','rented');`
- `CREATE VIEW listing_images_public WITH (security_invoker = true) AS SELECT i.* FROM listing_images i JOIN listings_public p ON p.id = i.listing_id;`
- `CREATE VIEW listing_documents_public WITH (security_invoker = true) AS SELECT d.* FROM listing_documents d JOIN listings_public p ON p.id = d.listing_id WHERE d.is_public = true;`
- `CREATE VIEW listing_tours_public WITH (security_invoker = true) AS SELECT t.* FROM listing_tours t JOIN listings_public p ON p.id = t.listing_id;`
- `GRANT SELECT` on all four views to `anon` and `authenticated`.
- Because views are `security_invoker`, they run under the caller's role and need a matching policy on the base table. Add a `TO anon` SELECT policy on each base table with the same predicate as the view (statuses list; `is_public = true` for documents) so the view actually returns rows for anonymous callers. This policy is only reachable via the view (base tables have no anon grant), keeping the public surface one-place-defined.

### 5. Role matrix — single source of truth in DB (correction #2)

Chosen approach: **runtime load + cache on both server and client.** No codegen file to keep in sync.

- Table `role_permissions(role text, permission_key text, granted boolean, primary key(role, permission_key))`. Grants `SELECT` to `anon, authenticated`; `ALL` to `service_role`. Enable RLS; policy: `TO anon, authenticated USING (true)` (matrix is not sensitive; hiding it would break the client hook and the seed test).
- Seed all 16 keys × 5 roles in the same migration (this is authoritative going forward; the TS constant is deleted).
- Helper `current_user_has_permission(_key text) → boolean` SECURITY DEFINER: inactive → false; else `permissions` override wins; else look up `role_permissions` for caller's role.
- TypeScript changes in `src/lib/auth/permissions.ts`:
  - Delete the hand-written `PERMISSION_MATRIX` constant.
  - Keep `Role`, `ROLES`, `PermissionKey` union, `PermissionOverride`, `PermissionProfile` types.
  - Add `type PermissionMatrix = Record<PermissionKey, Record<Role, boolean>>`.
  - `hasPermission(profile, overrides, key, matrix)` becomes **pure with matrix as an argument** (stays unit-testable, no I/O).
- New `src/lib/auth/permission-matrix.functions.ts`: `getPermissionMatrix` server fn that selects from `role_permissions` and returns the shaped matrix. `queryOptions` with generous `staleTime` (matrix rarely changes).
- Update `src/lib/auth/use-permission.ts` and the server assertions in `require-permission.server.ts` to load the matrix via that query / server fn and pass it to `hasPermission`. Server-side `assertPermission` can also call `current_user_has_permission(_key)` directly instead of re-implementing the check in TS — pick that path where possible (single round-trip, DB is the arbiter). The TS `hasPermission` remains for client-side UI hiding.
- The route `/$locale/admin` loader preloads `getPermissionMatrix` so the admin shell has it synchronously.

### 6. RLS policies

**listings** (no anon SELECT):
- `SELECT` authenticated: `current_user_has_permission('listing.edit.any')` OR (`current_user_has_permission('listing.edit.own')` AND (`agent_id = auth.uid()` OR `created_by = auth.uid()`)) OR the row is publicly visible (status list). This lets signed-in staff see drafts they own plus everything public without leaking others' drafts.
- `INSERT`: `current_user_has_permission('listing.create')`. Publish/status-change permission is enforced by the trigger (readable errors).
- `UPDATE` USING/WITH CHECK: `listing.edit.any` OR (`listing.edit.own` AND owner match).
- `DELETE`: `current_user_has_permission('listing.delete')`.

**listing_images / listing_documents / listing_tours** base tables:
- Anon SELECT policy scoped to public-view predicate (see §4). No anon grant on the table, so only reachable through the view.
- Authenticated SELECT: parent listing is readable by caller (mirrors listings SELECT).
- INSERT/UPDATE/DELETE: caller can UPDATE the parent (same predicate).

**Base `listings`** gets no anon SELECT policy or grant; `listings_public` is the only public read path.

### 7. TypeScript

- New `src/lib/validation/energy.ts` (under 200 lines): `EFFICIENCY_CLASS_AT`, `EFFICIENCY_CLASS_DE` tuples; `energySchemas: Record<Country, ZodSchema>` (AT/DE strict, CH/IS/US passthrough); `validateEnergy(country, energy, propertyType) → { missing: string[] }` matching DB output.
- `src/lib/validation/energy-cert.ts` becomes a thin re-export from `energy.ts`.
- `src/lib/auth/permissions.ts` — remove `PERMISSION_MATRIX`, refactor `hasPermission` to accept `matrix` argument.
- `src/lib/auth/permission-matrix.functions.ts` — new server fn + query options.
- `src/lib/auth/use-permission.ts` and `require-permission.server.ts` — update call sites to use the DB-loaded matrix or `current_user_has_permission` directly on the server.

### 8. Types

Regenerate automatically after migration. No manual edit to `types.ts`.

### 9. Verification (post-migration, before closing the step)

1. AT house draft, empty energy, → `active` → raises naming `hwb, eeb, efficiency_class`.
2. Land listing → `active` with empty energy → succeeds.
3. `site_settings` empty → publish attempt → raises "Site country is not configured".
4. Invalid status transition (`draft → sold`) → raises.
5. Two agent profiles: B cannot UPDATE A's row.
6. Assistant cannot publish (trigger error surfaces `listing.publish` requirement).
7. Anonymous `SELECT sold_price FROM listings_public` → column does not exist; `SELECT * FROM listings` as anon → permission denied.
8. `SELECT role, permission_key, granted FROM role_permissions ORDER BY 1,2` — captured; used as truth for the client hook.

### Out of scope this step

Admin listing UI, public listing pages, storage buckets, image upload, PDF expose, CI parity test (unnecessary — DB is now sole source of truth).

### Technical notes

- Views are `security_invoker = true` so RLS still applies as the caller — the split "no anon grant on base table; anon policy only reached via view" gives one explicit public surface.
- Triggers reading `site_settings` / `role_permissions` are `SECURITY DEFINER SET search_path = public`.
- `check` constraints only on immutable scalars; time-dependent rules live in triggers (per template rules).
- The `listings.agent_id` FK uses `ON DELETE SET NULL` so deleting a profile does not cascade-delete listings.
