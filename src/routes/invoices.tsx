import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Invoices — Northstar OS";
const description =
  "Issue, send and chase invoices, with AI-generated documents and automatic payment reminders.";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  return (
    <AppShell>
      <PageHeader title="Invoices" description="Billing, payments and overdue follow-up." />
      <ModulePlaceholder
        icon={FileText}
        title="Invoices module"
        summary="Scaffolded route ready for invoice tables, document generation and dunning automation."
        planned={[
          "Invoice list and statuses",
          "Invoice builder",
          "Payment tracking",
          "AI-generated reminders",
        ]}
      />
    </AppShell>
  );
}
