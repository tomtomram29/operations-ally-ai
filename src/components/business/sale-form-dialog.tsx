import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage, toNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Sale = Tables<"sales">;
type SaleItem = Tables<"sale_items">;

type LineItem = {
  id: string;
  product_id: string | null;
  description: string;
  quantity: string;
  unit_price: string;
};

function emptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    product_id: null,
    description: "",
    quantity: "1",
    unit_price: "0",
  };
}

export function SaleFormDialog({
  trigger,
  sale,
}: {
  trigger: ReactNode;
  sale?: Sale & { sale_items?: SaleItem[] };
}) {
  const { t } = useI18n();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("none");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  const customersQuery = useQuery({
    queryKey: ["customers", companyId],
    enabled: Boolean(companyId) && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name, company_name")
        .eq("company_id", companyId as string);
      if (error) throw error;
      return data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["products", companyId],
    enabled: Boolean(companyId) && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, selling_price")
        .eq("company_id", companyId as string)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!open) return;
    if (sale) {
      setCustomerId(sale.customer_id ?? "none");
      setSaleDate(sale.sale_date);
      setNotes(sale.notes ?? "");
      const items = sale.sale_items ?? [];
      setLines(
        items.length > 0
          ? items.map((item) => ({
              id: item.id,
              product_id: item.product_id,
              description: item.description,
              quantity: String(item.quantity),
              unit_price: String(item.unit_price),
            }))
          : [emptyLine()],
      );
    } else {
      setCustomerId("none");
      setSaleDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setLines([emptyLine()]);
    }
  }, [open, sale]);

  const total = lines.reduce((sum, line) => sum + toNumber(line.quantity, 0) * toNumber(line.unit_price, 0), 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const validLines = lines.filter((line) => line.description.trim());
      if (validLines.length === 0) {
        throw new Error(t("trade.sales.error.lineRequired"));
      }
      const computedTotal = validLines.reduce(
        (sum, line) => sum + toNumber(line.quantity, 0) * toNumber(line.unit_price, 0),
        0,
      );

      let saleId = sale?.id;
      if (sale) {
        const { error } = await supabase
          .from("sales")
          .update({
            customer_id: customerId === "none" ? null : customerId,
            sale_date: saleDate,
            notes: notes.trim() || null,
            total: computedTotal,
          })
          .eq("id", sale.id);
        if (error) throw error;
        const { error: deleteError } = await supabase.from("sale_items").delete().eq("sale_id", sale.id);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("sales")
          .insert({
            company_id: companyId as string,
            customer_id: customerId === "none" ? null : customerId,
            sale_date: saleDate,
            notes: notes.trim() || null,
            total: computedTotal,
          })
          .select("id")
          .single();
        if (error) throw error;
        saleId = data.id;
      }

      const { error: itemsError } = await supabase.from("sale_items").insert(
        validLines.map((line) => ({
          company_id: companyId as string,
          sale_id: saleId as string,
          product_id: line.product_id,
          description: line.description.trim(),
          quantity: toNumber(line.quantity, 1),
          unit_price: toNumber(line.unit_price, 0),
        })),
      );
      if (itemsError) throw itemsError;

      const movements = validLines.filter((line) => line.product_id);
      if (movements.length > 0) {
        const { error: movementError } = await supabase.from("inventory_movements").insert(
          movements.map((line) => ({
            company_id: companyId as string,
            product_id: line.product_id as string,
            quantity: -Math.abs(toNumber(line.quantity, 0)),
            reason: "sale",
          })),
        );
        if (movementError) throw movementError;
      }
    },
    onSuccess: () => {
      toast.success(sale ? t("trade.sales.toast.updated") : t("trade.sales.toast.created"));
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("[sale.save]", error);
      toast.error(errorMessage(error, t("trade.sales.error.save")));
    },
  });

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function onSelectProduct(id: string, productId: string) {
    if (productId === "none") {
      updateLine(id, { product_id: null });
      return;
    }
    const product = (productsQuery.data ?? []).find((p) => p.id === productId);
    updateLine(id, {
      product_id: productId,
      description: product?.name ?? "",
      unit_price: product ? String(product.selling_price) : "0",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{sale ? t("trade.sales.form.editTitle") : t("trade.sales.form.newTitle")}</DialogTitle>
          <DialogDescription>{t("trade.sales.form.description")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("trade.sales.form.customer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("trade.sales.form.noCustomer")}</SelectItem>
                  {(customersQuery.data ?? []).map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {[customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
                        customer.company_name ||
                        t("trade.sales.form.unnamed")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-date">{t("trade.sales.form.date")}</Label>
              <Input id="sale-date" type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("trade.sales.form.lineItems")}</Label>
            <div className="space-y-2">
              {lines.map((line) => (
                <div key={line.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_80px_110px_auto]">
                  <Select value={line.product_id ?? "none"} onValueChange={(value) => onSelectProduct(line.id, value)}>
                    <SelectTrigger><SelectValue placeholder={t("trade.sales.form.product")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("trade.sales.form.freeText")}</SelectItem>
                      {(productsQuery.data ?? []).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}{product.sku ? ` (${product.sku})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t("trade.sales.form.description")}
                    value={line.description}
                    onChange={(event) => updateLine(line.id, { description: event.target.value })}
                  />
                  <Input
                    type="number" min="0" step="1" placeholder={t("trade.sales.form.qty")}
                    value={line.quantity}
                    onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                  />
                  <Input
                    type="number" min="0" step="0.01" placeholder={t("trade.sales.form.price")}
                    value={line.unit_price}
                    onChange={(event) => updateLine(line.id, { unit_price: event.target.value })}
                  />
                  <Button
                    type="button" variant="ghost" size="sm" className="text-destructive"
                    onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== line.id) : prev))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
              <Plus className="size-4" /> {t("trade.sales.form.addLine")}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sale-notes">{t("trade.sales.form.notes")}</Label>
            <Textarea id="sale-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className="flex justify-end text-sm font-semibold text-foreground">
            {t("trade.sales.form.total")}: {total.toFixed(2)}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("trade.sales.form.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? t("trade.sales.form.saving") : sale ? t("trade.sales.form.save") : t("trade.sales.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
