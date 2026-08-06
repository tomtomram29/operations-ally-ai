import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Customers — Northstar OS";
const description =
  "Unified CRM for SMBs: contacts, activity history, follow-ups and AI-suggested next actions.";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <AppShell>
      <PageHeader title="Customers" description="Every relationship, contact and follow-up in one CRM." />
      <ModulePlaceholder
        icon={Users}
        title="Customers module"
        summary="Route, layout and metadata are scaffolded. The data layer arrives when we connect the backend."
        planned={[
          "Customer list with search and filters",
          "Customer detail with activity timeline",
          "Inactive customer detection",
          "AI follow-up suggestions",
        ]}
      />
    </AppShell>
  );
}
