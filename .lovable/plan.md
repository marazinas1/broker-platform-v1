
# User Management & Permission System (revised)

Foundation-only step: database schema, RLS, signup trigger, permission matrix, server loader, and client hook. No admin pages, no invitation UI.

## 1. Database migration

Single migration; three tables, helpers, triggers, RLS. Explicit GRANTs on every `public` table.

### 1.1 `public.profiles`

Columns per spec. `id uuid primary key references auth.users(id) on delete cascade`. `role` CHECK constrained to the five roles. `updated_at` via existing `public.tg_set_updated_at()` trigger.

Grants: `SELECT, INSERT, UPDATE, DELETE` → `authenticated`; `SELECT` → `anon` (public team via `show_on_website = true`); `ALL` → `service_role`.

### 1.2 `public.permissions`

Per-user overrides. `unique (profile_id, permission_key)`. Auth-only: `authenticated` + `service_role`; no `anon`.

### 1.3 `public.user_invitations`

Per spec. Auth-only: `authenticated` + `service_role`; no `anon`.

### 1.4 Security-definer helpers (avoid RLS recursion)

All `security definer`, `set search_path = public`, `stable`, `EXECUTE` to `authenticated`:

- `current_user_role() returns text` — reads `profiles.role` for `auth.uid()`.
- `current_user_is_active() returns boolean`.
- `has_role(_roles text[]) returns boolean` — role in `_roles` AND active.
- `count_active_owners() returns int` — used by last-owner guard trigger.

`security definer` bypasses RLS on inner reads → no recursion when used in `profiles` policies.

### 1.5 Signup trigger

`public.handle_new_user()` (`security definer`, `search_path = public`) `AFTER INSERT ON auth.users`:

1. Find unaccepted, unexpired `user_invitations` for `NEW.email`.
2. If found → use its `role`, set `accepted_at = now()`.
3. Else → `'viewer'`.
4. `INSERT INTO public.profiles (id, email, role) ...`.

### 1.6 Role / is_active integrity trigger — revised

`public.profiles_enforce_role_integrity()` `BEFORE UPDATE ON public.profiles`. Ordered rules; only trigger meaningfully when `NEW.role IS DISTINCT FROM OLD.role` or `NEW.is_active IS DISTINCT FROM OLD.is_active`.

Rules:

1. **Only owner may set role='owner'** — evaluated regardless of whose row is being updated. If `NEW.role = 'owner' AND OLD.role <> 'owner'` and `current_user_role() <> 'owner'` → raise.
2. **Only owner may clear role='owner'** — symmetric: if `OLD.role = 'owner' AND NEW.role <> 'owner'` and `current_user_role() <> 'owner'` → raise. (Prevents admin from demoting owners.)
3. **Non-owner self-modification blocked** — if `auth.uid() = OLD.id` AND `current_user_role() <> 'owner'` AND (role or is_active changed) → raise.
4. **Owner self-modification allowed with last-owner guard** — if `auth.uid() = OLD.id` AND `current_user_role() = 'owner'`: allow the change; last-owner guard (§1.7) enforces at least one active owner remains.

RLS policies still gate whether the UPDATE reaches the row at all; this trigger enforces the invariants that policies can't express cleanly.

### 1.7 Last-owner guard trigger

`public.profiles_protect_last_owner()`:

- `BEFORE UPDATE ON public.profiles`: if `OLD.role = 'owner' AND OLD.is_active = true` AND (`NEW.role <> 'owner'` OR `NEW.is_active = false`) AND `count_active_owners() <= 1` → raise `'Cannot demote or deactivate the last active owner'`.
- `BEFORE DELETE ON public.profiles`: if `OLD.role = 'owner' AND OLD.is_active = true AND count_active_owners() <= 1` → raise `'Cannot delete the last active owner'`.

Runs after the integrity trigger.

### 1.8 RLS policies

**profiles** (RLS on):
- `SELECT` to `anon, authenticated` USING `show_on_website = true`.
- `SELECT` to `authenticated` USING `true`.
- `UPDATE` to `authenticated` USING `id = auth.uid()` WITH CHECK `id = auth.uid()` — own row; triggers enforce role/is_active invariants.
- `UPDATE` to `authenticated` USING `has_role(ARRAY['owner','admin'])` WITH CHECK `has_role(ARRAY['owner','admin'])` — manage others; triggers restrict owner-role changes to owners only.
- `DELETE` to `authenticated` USING `has_role(ARRAY['owner','admin'])`; last-owner guard blocks the destructive case.
- No `INSERT` policy — profiles come from the signup trigger only.

**permissions**:
- `SELECT` USING `profile_id = auth.uid() OR has_role(ARRAY['owner','admin'])`.
- `INSERT/UPDATE/DELETE` USING/CHECK `has_role(ARRAY['owner','admin'])`.

**user_invitations**:
- `SELECT/INSERT/DELETE` USING/CHECK `has_role(ARRAY['owner','admin'])`. No `anon`.

## 2. Permission matrix — `src/lib/auth/permissions.ts`

Typed `Role` and `PermissionKey` unions. `PERMISSION_MATRIX: Record<PermissionKey, Record<Role, boolean>>` transcribed exactly from the spec.

```ts
export function hasPermission(
  profile: { role: Role; is_active: boolean } | null | undefined,
  overrides: Array<{ permission_key: string; granted: boolean }>,
  key: PermissionKey,
): boolean {
  if (!profile || !profile.is_active) return false;
  const o = overrides.find(x => x.permission_key === key);
  if (o) return o.granted;
  return PERMISSION_MATRIX[key][profile.role] ?? false;
}
```

Pure, no I/O.

## 3. Server loader — `src/lib/auth/current-user.functions.ts`

`getCurrentUserWithPermissions` — `createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(...)`:
- Uses `context.supabase` (RLS as user).
- Loads `profiles` row for `context.userId` + all `permissions` rows for that profile.
- Returns `{ profile, overrides } | null`.

Exports `currentUserQueryOptions` (`queryKey: ['current-user']`, `staleTime: 60_000`).

## 4. Root loader — session-gated preload

Public routes must not issue an authenticated RPC for anonymous visitors.

- New `.server.ts` helper `hasSupabaseSessionCookie()` inspects the incoming request via `getRequest()` and returns true iff a Supabase auth cookie is present (matches `sb-*-auth-token` — the same pattern the auth cookies use). Server-only, no DB call.
- New `getCurrentUserIfSignedIn` server function (no auth middleware): calls the helper; if no cookie → returns `null` immediately; if cookie → dynamically imports and delegates to `getCurrentUserWithPermissions` (which runs the auth middleware). This keeps `requireSupabaseAuth` off the anonymous fast path entirely.
- `currentUserQueryOptions.queryFn` calls `getCurrentUserIfSignedIn`; on any thrown auth error → return `null` (defensive).
- `src/routes/__root.tsx` loader adds `ensureQueryData(currentUserQueryOptions)` in the existing `Promise.all`.

Note: the bearer token attached client-side by `attachSupabaseAuth` covers the authenticated case; the cookie check is strictly a server-side "is there any session at all" gate for SSR.

## 5. Client hook — `src/lib/auth/use-permission.ts`

```ts
export function usePermission(key: PermissionKey): boolean {
  const { data } = useSuspenseQuery(currentUserQueryOptions);
  return hasPermission(data?.profile, data?.overrides ?? [], key);
}
export function useCurrentUser() { /* returns { profile, overrides } | null */ }
```

File header comment: client checks hide UI only; server functions must independently verify.

## 6. Server-side check helper — `src/lib/auth/require-permission.server.ts`

`assertPermission(supabase, userId, key)` — loads profile + overrides via the RLS-scoped client, throws `Response('Forbidden', { status: 403 })` when `hasPermission` is false. Pattern for future protected mutations.

## 7. File layout

```
src/lib/auth/
  permissions.ts                # matrix + hasPermission (pure)
  current-user.functions.ts     # protected + session-gated server fns + queryOptions
  session-cookie.server.ts      # cookie presence check
  use-permission.ts             # client hooks
  require-permission.server.ts  # server-side assert
```

All ≤200 lines. No UI strings introduced.

## 8. Verification checklist

1. `hasPermission({role:'assistant',is_active:true}, [], 'listing.publish') === false`.
2. Non-owner signed-in user issuing `UPDATE profiles SET role='admin' WHERE id = auth.uid()` → integrity trigger raises.
3. `hasPermission({role:'owner',is_active:false}, [], 'settings.edit') === false`.
4. Insert `user_invitations(email='x@y.z', role='agent', …)`, sign that user up → `profiles.role='agent'`, invitation `accepted_at` set. Signup with no invitation → role `viewer`.
5. Regular signed-in user `SELECT * FROM profiles` succeeds (no recursion).
6. Non-admin `SELECT` on `permissions` returns only own rows; on `user_invitations` returns none.
7. **Last-owner guard**: with exactly one active owner, `UPDATE profiles SET role='admin' WHERE id = <that owner>` and `UPDATE ... SET is_active=false` and `DELETE FROM profiles WHERE id = <that owner>` all raise. With ≥2 active owners, the same owner may demote or deactivate self.
8. Admin attempting `UPDATE profiles SET role='owner' WHERE id = <other>` or `UPDATE ... SET role='admin' WHERE OLD.role='owner'` → integrity trigger raises.
9. Anonymous request to `/de` issues zero authenticated Supabase requests server-side (verify by inspecting the server-fn call chain: `getCurrentUserIfSignedIn` short-circuits when no `sb-*-auth-token` cookie is present).

## Out of scope

Invitation acceptance flow, admin management UI, and applying `assertPermission` to feature server functions (done per-feature later).
