import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Alert = {
  id: string;
  type: "invoice" | "stock" | "task";
  title: string;
  body: string;
  to: string;
};

/** Alerts are derived live from company data (invoices, stock, tasks). */
export async function fetchAlerts(companyId: string): Promise<Alert[]> {
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
      title: `Invoice ${invoice.invoice_number} is overdue`,
      body: `Due ${invoice.due_date}`,
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
            ? `${product.name} — Out of stock`
            : `${product.name} — Low stock`,
        body: `${product.current_stock} remaining (min ${product.minimum_stock})`,
        to: "/inventory",
      });
    }
  }

  for (const task of tasks.data ?? []) {
    alerts.push({
      id: `task-${task.id}`,
      type: "task",
      title: `Task "${task.title}" is overdue`,
      body: `Due ${task.due_date}`,
      to: "/dashboard",
    });
  }

  return alerts;
}

export function useAlerts(companyId: string | null) {
  return useQuery({
    queryKey: ["alerts", companyId],
    queryFn: () => fetchAlerts(companyId as string),
    enabled: Boolean(companyId),
  });
}
