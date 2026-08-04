// Loads the authoritative role matrix from public.role_permissions.
// The database is the single source of truth; this fn shapes it into the
// PermissionMatrix TypeScript type expected by hasPermission().
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import {
  ROLES,
  isRole,
  type PermissionKey,
  type PermissionMatrix,
  type Role,
} from "./permissions";

export const getPermissionMatrix = createServerFn({ method: "GET" }).handler(
  async (): Promise<PermissionMatrix> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("role_permissions")
      .select("role, permission_key, granted");
    if (error) throw error;

    const matrix = {} as PermissionMatrix;
    for (const row of data ?? []) {
      if (!isRole(row.role)) continue;
      const key = row.permission_key as PermissionKey;
      if (!matrix[key]) {
        matrix[key] = ROLES.reduce(
          (acc, r) => ({ ...acc, [r]: false }),
          {} as Record<Role, boolean>,
        );
      }
      matrix[key][row.role] = row.granted;
    }
    return matrix;
  },
);

export const permissionMatrixQueryOptions = queryOptions({
  queryKey: ["permission-matrix"] as const,
  queryFn: () => getPermissionMatrix(),
  staleTime: 10 * 60_000,
});
