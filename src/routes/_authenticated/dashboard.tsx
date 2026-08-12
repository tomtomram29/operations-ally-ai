import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { useI18n } from "@/lib/i18n";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Dashboard — Northstar OS";
const description =
  "The AI-powered operating system for small and medium businesses: KPIs, cash flow, invoices and an executive assistant in one place.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.dashboard.title")} description={t("mod.dashboard.desc")} />
      <ModulePlaceholder
        icon={LayoutDashboard}
        title={t("mod.dashboard.placeholderTitle")}
        summary={t("mod.dashboard.summary")}
        planned={[
          t("mod.dashboard.p1"),
          t("mod.dashboard.p2"),
          t("mod.dashboard.p3"),
          t("mod.dashboard.p4"),
          t("mod.dashboard.p5"),
          t("mod.dashboard.p6"),
        ]}
      />
    </AppShell>
  );
}
