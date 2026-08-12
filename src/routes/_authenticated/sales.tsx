import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Sales — Northstar OS";
const description =
  "Track pipeline, quotations and orders with AI analysis of what is winning and what is stalling.";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.sales.title")} description={t("mod.sales.desc")} />
      <ModulePlaceholder
        icon={TrendingUp}
        title={t("mod.sales.placeholderTitle")}
        summary={t("mod.sales.summary")}
        planned={[
          t("mod.sales.p1"),
          t("mod.sales.p2"),
          t("mod.sales.p3"),
          t("mod.sales.p4"),
        ]}
      />
    </AppShell>
  );
}
