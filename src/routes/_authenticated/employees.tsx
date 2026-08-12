import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { IdCard } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";
import { useI18n } from "@/lib/i18n";

const title = "Employees — Northstar OS";
const description =
  "Manage your team: roles, permissions, time tracking and workload distribution.";

export const Route = createFileRoute("/_authenticated/employees")({
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
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.employees.title")} description={t("mod.employees.desc")} />
      <ModulePlaceholder
        icon={IdCard}
        title={t("mod.employees.placeholderTitle")}
        summary={t("mod.employees.summary")}
        planned={[
          t("mod.employees.p1"),
          t("mod.employees.p2"),
          t("mod.employees.p3"),
          t("mod.employees.p4"),
        ]}
      />
    </AppShell>
  );
}
