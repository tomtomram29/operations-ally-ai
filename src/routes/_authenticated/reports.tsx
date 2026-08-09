import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

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
  return (
    <AppShell>
      <PageHeader title="Reports" description="Analytics and AI-written business summaries." />
      <ModulePlaceholder
        icon={BarChart3}
        title="Reports module"
        summary="Scaffolded route ready for charting and exportable reporting."
        planned={[
          "Revenue and cost reports",
          "Custom date ranges",
          "Exports (PDF/CSV)",
          "AI weekly & monthly summaries",
        ]}
      />
    </AppShell>
  );
}
