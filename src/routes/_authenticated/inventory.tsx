import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Package, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCompany } from "@/lib/company";
import { errorMessage, formatMoney } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { ErrorBlock, LoadingRows } from "@/components/common/loading-block";
import { ProductFormDialog } from "@/components/business/product-form-dialog";
import { ProductStockDialog } from "@/components/business/product-stock-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = "Inventory — Northstar OS";
const description = "Stock levels, movements and low-stock alerts for every product you sell.";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { t } = useI18n();
  const { companyId, company } = useCompany();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const productsQuery = useQuery({
    queryKey: ["products", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId as string)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("trade.inventory.toast.deleted"));
      queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", companyId] });
    },
    onError: (error) => {
      console.error("[products.delete]", error);
      toast.error(errorMessage(error, t("trade.inventory.error.delete")));
    },
  });

  const products = productsQuery.data ?? [];

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === "low" && product.current_stock > product.minimum_stock) return false;
      if (!needle) return true;
      return [product.name, product.sku, product.category, product.supplier]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [products, term, filter]);

  const kpis = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter((product) => product.current_stock <= product.minimum_stock).length;
    const stockValue = products.reduce((sum, product) => sum + product.current_stock * product.purchase_price, 0);
    return { totalProducts, lowStock, stockValue };
  }, [products]);

  const currency = company?.currency ?? "EUR";
  const newButton = <ProductFormDialog trigger={<Button><Plus className="size-4" /> {t("trade.inventory.new")}</Button>} />;

  return (
    <AppShell>
      <PageHeader title={t("trade.inventory.pageTitle")} description={t("trade.inventory.pageDescription")} actions={newButton} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{t("trade.inventory.kpi.total")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{t("trade.inventory.kpi.lowStock")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.lowStock}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">{t("trade.inventory.kpi.value")}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatMoney(kpis.stockValue, currency)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("trade.inventory.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("trade.inventory.filter.all")}</SelectItem>
            <SelectItem value="low">{t("trade.inventory.filter.low")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {productsQuery.isLoading ? (
        <LoadingRows />
      ) : productsQuery.error ? (
        <ErrorBlock message={errorMessage(productsQuery.error, t("trade.inventory.error.load"))} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("trade.inventory.empty.title")}
          description={t("trade.inventory.empty.description")}
          action={newButton}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("trade.inventory.emptySearch.title")} description={t("trade.inventory.emptySearch.description")} />
      ) : (
        <Card className="overflow-hidden border-border p-0 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trade.inventory.table.name")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("trade.inventory.table.category")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("trade.inventory.table.supplier")}</TableHead>
                  <TableHead className="text-right">{t("trade.inventory.table.stock")}</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">{t("trade.inventory.table.price")}</TableHead>
                  <TableHead className="text-right">{t("trade.inventory.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const low = product.current_stock <= product.minimum_stock;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <span className="font-medium text-foreground">{product.name}</span>
                        {product.sku ? <span className="block text-xs text-muted-foreground">{product.sku}</span> : null}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{product.category || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{product.supplier || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {low ? (
                            <Badge variant="secondary" className="border-0 bg-destructive/10 text-destructive">
                              <AlertTriangle className="mr-1 size-3" /> {t("trade.inventory.lowStockBadge")}
                            </Badge>
                          ) : null}
                          <span className="font-medium text-foreground">{product.current_stock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                        {formatMoney(product.selling_price, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ProductStockDialog
                            product={product}
                            trigger={<Button variant="ghost" size="sm">{t("trade.inventory.adjustStock")}</Button>}
                          />
                          <ProductFormDialog
                            product={product}
                            trigger={<Button variant="ghost" size="sm">{t("trade.inventory.edit")}</Button>}
                          />
                          <ConfirmDelete
                            title={t("trade.inventory.delete.title")}
                            description={t("trade.inventory.delete.description")}
                            onConfirm={() => deleteMutation.mutate(product.id)}
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
