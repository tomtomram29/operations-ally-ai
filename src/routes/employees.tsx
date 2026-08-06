import { createFileRoute } from "@tanstack/react-router";
import { IdCard } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Employees — Northstar OS";
const description =
  "Manage your team: roles, permissions, time tracking and workload distribution.";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  return (
    <AppShell>
      <PageHeader title="Employees" description="Team directory, roles and workload." />
      <ModulePlaceholder
        icon={IdCard}
        title="Employees module"
        summary="Scaffolded route ready for the team directory and role-based access."
        planned={[
          "Team directory",
          "Roles and permissions",
          "Time tracking",
          "Workload overview",
        ]}
      />
    </AppShell>
  );
}
