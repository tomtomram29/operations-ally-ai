import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiTrend = "up" | "down" | "flat";

type KpiCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: KpiTrend;
  changeLabel?: string;
};

export function KpiCard({ icon: Icon, label, value, hint, trend = "flat", changeLabel }: KpiCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendClass =
    trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card className="border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
          <Icon className="size-4.5" />
        </span>
        {changeLabel ? (
          <span className={cn("flex items-center gap-1 text-xs font-medium", trendClass)}>
            <TrendIcon className="size-3.5" />
            {changeLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
