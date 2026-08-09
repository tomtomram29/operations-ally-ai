import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

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
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Your business at a glance. The AI Executive Assistant briefing lands here in Step 3."
      />
      <ModulePlaceholder
        icon={LayoutDashboard}
        title="Dashboard module"
        summary="Architecture is in place: shell, navigation, design system and routing. The KPI grid, charts and AI briefing card come next."
        planned={[
          "AI Executive Assistant briefing card",
          "Revenue, expenses, profit and cash flow KPIs",
          "Open invoices and overdue alerts",
          "Performance charts (Recharts)",
          "Inventory alerts and tasks",
          "Quick actions and upcoming meetings",
        ]}
      />
    </AppShell>
  );
}
