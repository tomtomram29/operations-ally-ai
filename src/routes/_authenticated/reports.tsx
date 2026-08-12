import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";
import { useI18n } from "@/lib/i18n";

const title = "Reports — Northstar OS";
const description =
  "Financial and operational analytics, plus AI-written weekly and monthly business summaries.";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.reports.title")} description={t("mod.reports.desc")} />
      <ModulePlaceholder
        icon={BarChart3}
        title={t("mod.reports.placeholderTitle")}
        summary={t("mod.reports.summary")}
        planned={[
          t("mod.reports.p1"),
          t("mod.reports.p2"),
          t("mod.reports.p3"),
          t("mod.reports.p4"),
        ]}
      />
    </AppShell>
  );
}
