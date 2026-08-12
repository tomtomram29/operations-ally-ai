import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type T = (key: string) => string;

function fill(text: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), text);
}

export type Alert = {
  id: string;
  type: "invoice" | "stock" | "task";
  title: string;
  body: string;
  to: string;
};

/** Alerts are derived live from company data (invoices, stock, tasks). */
export async function fetchAlerts(companyId: string, t: (key: string) => string): Promise<Alert[]> {
  const today = new Date().toISOString().slice(0, 10);

  const [invoices, products, tasks] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date, total, status")
      .eq("company_id", companyId)
      .in("status", ["sent", "overdue"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(10),
    supabase
      .from("products")
      .select("id, name, current_stock, minimum_stock")
      .eq("company_id", companyId)
      .limit(200),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("company_id", companyId)
      .eq("completed", false)
      .lt("due_date", today)
      .limit(10),
  ]);

  const alerts: Alert[] = [];

  for (const invoice of invoices.data ?? []) {
    alerts.push({
      id: `invoice-${invoice.id}`,
      type: "invoice",
      title: t("ops.alerts.invoiceOverdue").replace("{number}", invoice.invoice_number),
      body: t("ops.alerts.dueOn").replace("{date}", invoice.due_date ?? ""),
      to: "/invoices",
    });
  }

  for (const product of products.data ?? []) {
    if (product.current_stock <= product.minimum_stock) {
      alerts.push({
        id: `stock-${product.id}`,
        type: "stock",
        title:
          product.current_stock <= 0
            ? t("ops.alerts.outOfStock").replace("{name}", product.name)
            : t("ops.alerts.lowStock").replace("{name}", product.name),
        body: t("ops.alerts.stockRemaining")
          .replace("{count}", String(product.current_stock))
          .replace("{min}", String(product.minimum_stock)),
        to: "/inventory",
      });
    }
  }

  for (const task of tasks.data ?? []) {
    alerts.push({
      id: `task-${task.id}`,
      type: "task",
      title: t("ops.alerts.taskOverdue").replace("{title}", task.title),
      body: t("ops.alerts.dueOn").replace("{date}", task.due_date ?? ""),
      to: "/dashboard",
    });
  }

  return alerts;
}

export function useAlerts(companyId: string | null) {
  const { t } = useI18n();
  return useQuery({
    queryKey: ["alerts", companyId],
    queryFn: () => fetchAlerts(companyId as string, t),
    enabled: Boolean(companyId),
  });
}
