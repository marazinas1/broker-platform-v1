import { createFileRoute, notFound } from "@tanstack/react-router";

import { GeneralTab } from "@/components/admin/settings/GeneralTab";
import { BrandingTab } from "@/components/admin/settings/BrandingTab";
import { ContactTab } from "@/components/admin/settings/ContactTab";
import { LegalTab } from "@/components/admin/settings/LegalTab";
import { ModulesTab } from "@/components/admin/settings/ModulesTab";
import { AnalyticsTab } from "@/components/admin/settings/AnalyticsTab";

const TABS = ["general", "branding", "contact", "legal", "modules", "analytics"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/$locale/admin/settings/$tab")({
  beforeLoad: ({ params }) => {
    if (!(TABS as readonly string[]).includes(params.tab)) throw notFound();
  },
  component: TabPage,
});

function TabPage() {
  const { tab } = Route.useParams() as { tab: Tab };
  switch (tab) {
    case "general": return <GeneralTab />;
    case "branding": return <BrandingTab />;
    case "contact": return <ContactTab />;
    case "legal": return <LegalTab />;
    case "modules": return <ModulesTab />;
    case "analytics": return <AnalyticsTab />;
  }
}
