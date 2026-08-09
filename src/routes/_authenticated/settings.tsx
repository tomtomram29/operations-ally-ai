import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "Settings — Northstar OS";
const description =
  "Company profile, team access, billing and integrations for your business operating system.";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <PageHeader title="Settings" description="Company profile, access and integrations." />
      <ModulePlaceholder
        icon={SettingsIcon}
        title="Settings module"
        summary="Scaffolded route ready for workspace configuration."
        planned={[
          "Company profile",
          "Users and roles",
          "Billing and plan",
          "Integrations and API keys",
        ]}
      />
    </AppShell>
  );
}
