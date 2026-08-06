import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

const title = "AI Assistant — Northstar OS";
const description =
  "Your company's executive assistant: ask questions about your data, generate documents and get recommendations.";

export const Route = createFileRoute("/assistant")({
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
  return (
    <AppShell>
      <PageHeader title="AI Assistant" description="The executive assistant for your entire business." />
      <ModulePlaceholder
        icon={Sparkles}
        title="AI Assistant module"
        summary="Scaffolded route reserved for the chat interface. Conversation shape and history storage are decisions we make together before building it."
        planned={[
          "Streaming chat interface",
          "Company-data grounded answers",
          "Document and invoice generation",
          "Action recommendations",
        ]}
      />
    </AppShell>
  );
}
