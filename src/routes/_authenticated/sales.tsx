import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";

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
  return (
    <AppShell>
      <PageHeader title="Sales" description="Pipeline, quotations and order performance." />
      <ModulePlaceholder
        icon={TrendingUp}
        title="Sales module"
        summary="Scaffolded route ready for the pipeline board and revenue analytics."
        planned={[
          "Pipeline board",
          "Quotations",
          "Orders",
          "Sales analytics with Recharts",
        ]}
      />
    </AppShell>
  );
}
