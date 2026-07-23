import { useEffect } from "react";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/lib/auth/use-permission";
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/config";

import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  useEffect(() => {
    if (locale) getI18n(locale);
  }, [locale]);

  const displayName =
    user?.profile.full_name || user?.profile.email || t("admin.topbar.unknownUser");
  const roleLabel = user ? t(`admin.role.${user.profile.role}`) : "";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({
      to: "/$locale/auth/login",
      params: { locale },
      replace: true,
    });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                aria-label={t("admin.topbar.toggleSidebar")}
                className="text-foreground"
              />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <div className="truncate text-sm font-medium">{displayName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                aria-label={t("admin.topbar.signOut")}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {t("admin.topbar.signOut")}
                </span>
              </Button>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
