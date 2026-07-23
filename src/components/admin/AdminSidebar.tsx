import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Building2,
  Inbox,
  Users,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermission } from "@/lib/auth/use-permission";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { PermissionKey } from "@/lib/auth/permissions";
import type { Locale } from "@/i18n/config";

interface NavItem {
  key: "dashboard" | "listings" | "inquiries" | "team" | "content" | "analytics" | "settings";
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: PermissionKey;
  flag?: string;
}

const ITEMS: NavItem[] = [
  { key: "dashboard", to: "/$locale/admin", icon: LayoutDashboard, permission: "inquiry.view.own" },
  { key: "listings", to: "/$locale/admin/listings", icon: Building2, permission: "listing.create" },
  { key: "inquiries", to: "/$locale/admin/inquiries", icon: Inbox, permission: "inquiry.view.own" },
  { key: "team", to: "/$locale/admin/team", icon: Users, permission: "user.manage", flag: "team" },
  { key: "content", to: "/$locale/admin/content", icon: FileText, permission: "content.edit", flag: "blog" },
  { key: "analytics", to: "/$locale/admin/analytics", icon: BarChart3, permission: "analytics.view.own" },
  { key: "settings", to: "/$locale/admin/settings", icon: Settings, permission: "settings.edit" },
];

function NavRow({ item, locale }: { item: NavItem; locale: Locale }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const allowed = usePermission(item.permission);
  const flagOn = useFeatureFlag(item.flag ?? "__always__");
  if (!allowed) return null;
  if (item.flag && !flagOn) return null;

  const resolved = item.to.replace("$locale", locale);
  const isActive =
    item.to === "/$locale/admin"
      ? pathname === resolved
      : pathname === resolved || pathname.startsWith(`${resolved}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={t(`admin.nav.${item.key}`)}>
        <Link to={item.to} params={{ locale }} className="flex items-center gap-2">
          <item.icon className="h-4 w-4" />
          <span>{t(`admin.nav.${item.key}`)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminSidebar() {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITEMS.map((item) => (
                <NavRow key={item.key} item={item} locale={locale} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
