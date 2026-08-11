import type { LucideIcon, ReactNode } from "lucide-react";
import type { ReactNode as RN } from "react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: RN;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border bg-card">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        {Icon ? (
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-strong">
            <Icon className="size-5.5" />
          </span>
        ) : null}
        <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
export type { ReactNode };
