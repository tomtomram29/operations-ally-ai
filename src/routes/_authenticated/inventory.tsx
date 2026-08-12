import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.inventory.title")} description={t("mod.inventory.desc")} />
      <ModulePlaceholder
        icon={Package}
        title={t("mod.inventory.placeholderTitle")}
        summary={t("mod.inventory.summary")}
        planned={[
          t("mod.inventory.p1"),
          t("mod.inventory.p2"),
          t("mod.inventory.p3"),
          t("mod.inventory.p4"),
        ]}
      />
    </AppShell>
  );
}
