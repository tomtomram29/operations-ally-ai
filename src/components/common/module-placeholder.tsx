import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ModulePlaceholderProps = {
  icon: LucideIcon;
  title: string;
  summary: string;
  planned: string[];
};

/**
 * Scaffolded module surface. Each page keeps its own route, metadata and shell
 * position so features can be dropped in without restructuring the app.
 */
export function ModulePlaceholder({ icon: Icon, title, summary, planned }: ModulePlaceholderProps) {
  return (
    <Card className="border-border bg-card shadow-[var(--shadow-card)]">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:gap-8 md:p-8">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
          <Icon className="size-5.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{summary}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {planned.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground/80"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}