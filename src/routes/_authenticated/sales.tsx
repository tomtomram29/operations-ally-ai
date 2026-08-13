import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCompany } from "@/lib/company";
import { errorMessage, formatDate, formatMoney, toNumber } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { SaleFormDialog } from "@/components/business/sale-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = "Sales — Northstar OS";
const description = "Track sales orders, line items and revenue in one live workspace.";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { t } = useI18n();
  const { companyId, company } = useCompany();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const salesQuery = useQuery({
    queryKey: ["sales", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, customers(first_name, last_name, company_name), sale_items(*)")
        .eq("company_id", companyId as string)
        .order("sale_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("trade.sales.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["sales", companyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] });
    },
    onError: (error) => {
      console.error("[sales.delete]", error);
      toast.error(errorMessage(error, t("trade.sales.error.delete")));
    },
  });

  const sales = salesQuery.data ?? [];

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return sales.filter((sale) => {
      if (from && sale.sale_date < from) return false;
      if (to && sale.sale_date > to) return false;
      if (!needle) return true;
      const customer = sale.customers as { first_name: string | null; last_name: string | null; company_name: string | null } | null;
      const name = [customer?.first_name, customer?.last_name, customer?.company_name].filter(Boolean).join(" ");
      return `${name} ${sale.notes ?? ""}`.toLowerCase().includes(needle);
    });
  }, [sales, term, from, to]);

  const kpis = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthSales = sales.filter((sale) => sale.sale_date.startsWith(monthKey));
    const revenue = monthSales.reduce((sum, sale) => sum + toNumber(sale.total), 0);
    const count = monthSales.length;
    const average = count > 0 ? revenue / count : 0;
    return { revenue, count, average };
  }, [sales]);

  const currency = company?.currency ?? "EUR";
  const newButton = <SaleFormDialog trigger={<Button>{t("trade.sales.new")}</Button>} />;

  return (
    <AppShell>
      <PageHeader title={t("trade.sales.pageTitle")} description={t("trade.sales.pageDescription")} actions={newButton} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{t("trade.sales.kpi.revenue")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatMoney(kpis.revenue, currency)}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{t("trade.sales.kpi.count")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.count}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{t("trade.sales.kpi.average")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatMoney(kpis.average, currency)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("trade.sales.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="sm:w-44" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="sm:w-44" />
      </div>

      {salesQuery.isLoading ? (
        <LoadingRows />
      ) : salesQuery.error ? (
        <ErrorBlock message={errorMessage(salesQuery.error, t("trade.sales.error.load"))} />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t("trade.sales.empty.title")}
          description={t("trade.sales.empty.description")}
          action={newButton}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("trade.sales.emptySearch.title")} description={t("trade.sales.emptySearch.description")} />
      ) : (
        <Card className="overflow-hidden border-border p-0 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trade.sales.table.date")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("trade.sales.table.customer")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("trade.sales.table.items")}</TableHead>
                  <TableHead className="text-right">{t("trade.sales.table.total")}</TableHead>
                  <TableHead className="text-right">{t("trade.sales.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => {
                  const customer = sale.customers as { first_name: string | null; last_name: string | null; company_name: string | null } | null;
                  const name =
                    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
                    customer?.company_name ||
                    t("trade.sales.noCustomer");
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium text-foreground">{formatDate(sale.sale_date)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{(sale.sale_items ?? []).length}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatMoney(sale.total, currency)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <SaleFormDialog
                            sale={sale}
                            trigger={<Button variant="ghost" size="sm">{t("trade.sales.edit")}</Button>}
                          />
                          <ConfirmDelete
                            title={t("trade.sales.delete.title")}
                            description={t("trade.sales.delete.description")}
                            onConfirm={() => deleteMutation.mutate(sale.id)}
                            disabled={deleteMutation.isPending}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
