import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function effectiveStatus(status: string, dueDate: string | null) {
  if (status !== "paid" && status !== "cancelled" && dueDate && dueDate < new Date().toISOString().slice(0, 10)) {
    return "overdue";
  }
  return status;
}

const styles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary-soft text-primary-strong",
  paid: "bg-success-soft text-success",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const labelKeys: Record<string, string> = {
  draft: "crm.status.draft",
  sent: "crm.status.sent",
  paid: "crm.status.paid",
  overdue: "crm.status.overdue",
  cancelled: "crm.status.cancelled",
};

export function InvoiceStatusBadge({ status, dueDate }: { status: string; dueDate: string | null }) {
  const { t } = useI18n();
  const value = effectiveStatus(status, dueDate);
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", styles[value] ?? styles["draft"])}>
      {t(labelKeys[value] ?? labelKeys.draft ?? "")}
    </Badge>
  );
}
