import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Inventory — Northstar OS";
const description =
  "Stock levels, movements and predictive reorder alerts before an item runs out.";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <AppShell>
      <PageHeader title="Inventory" description="Stock levels, movements and reorder alerts." />
      <ModulePlaceholder
        icon={Package}
        title="Inventory module"
        summary="Scaffolded route ready for stock tables and depletion forecasting."
        planned={[
          "Product catalog",
          "Stock movements",
          "Low-stock alerts",
          "Depletion forecasting",
        ]}
      />
    </AppShell>
  );
}
