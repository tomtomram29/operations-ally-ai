import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "AI Assistant — Northstar OS";
const description =
  "Your company's executive assistant: ask questions about your data, generate documents and get recommendations.";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <PageHeader title={t("mod.assistant.title")} description={t("mod.assistant.desc")} />
      <ModulePlaceholder
        icon={Sparkles}
        title={t("mod.assistant.placeholderTitle")}
        summary={t("mod.assistant.summary")}
        planned={[
          t("mod.assistant.p1"),
          t("mod.assistant.p2"),
          t("mod.assistant.p3"),
          t("mod.assistant.p4"),
        ]}
      />
    </AppShell>
  );
}
