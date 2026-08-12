import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.settings.title")} description={t("mod.settings.desc")} />
      <ModulePlaceholder
        icon={SettingsIcon}
        title={t("mod.settings.placeholderTitle")}
        summary={t("mod.settings.summary")}
        planned={[
          t("mod.settings.p1"),
          t("mod.settings.p2"),
          t("mod.settings.p3"),
          t("mod.settings.p4"),
        ]}
      />
    </AppShell>
  );
}
