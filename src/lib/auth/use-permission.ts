// Client-side permission hooks.
// SECURITY: these hide UI only. Every server function that performs a
// privileged action MUST re-verify with assertPermission on the server.
import { useSuspenseQuery } from "@tanstack/react-query";

import { currentUserQueryOptions } from "./current-user.functions";
import type { CurrentUser } from "./current-user.functions";
import { hasPermission, type PermissionKey } from "./permissions";

export function useCurrentUser(): CurrentUser | null {
  const { data } = useSuspenseQuery(currentUserQueryOptions);
  return data ?? null;
}

export function usePermission(key: PermissionKey): boolean {
  const user = useCurrentUser();
  return hasPermission(user?.profile, user?.overrides ?? [], key);
}
