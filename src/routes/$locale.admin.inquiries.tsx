import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$locale/admin/inquiries")({
  component: Stub,
});

function Stub() {
  const { t } = useTranslation();
  return <h1 className="text-2xl font-semibold">{t("admin.pages.inquiries")}</h1>;
}
