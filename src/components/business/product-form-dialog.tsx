import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Product = Tables<"products">;

const EMPTY = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  purchase_price: "0",
  selling_price: "0",
  minimum_stock: "0",
  initial_stock: "0",
  description: "",
};

export function ProductFormDialog({
  trigger,
  product,
}: {
  trigger: ReactNode;
  product?: Product;
}) {
  const { t } = useI18n();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku ?? "",
            category: product.category ?? "",
            supplier: product.supplier ?? "",
            purchase_price: String(product.purchase_price),
            selling_price: String(product.selling_price),
            minimum_stock: String(product.minimum_stock),
            initial_stock: "0",
            description: product.description ?? "",
          }
        : { ...EMPTY },
    );
  }, [open, product]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        category: form.category.trim() || null,
        supplier: form.supplier.trim() || null,
        purchase_price: toNumber(form.purchase_price, 0),
        selling_price: toNumber(form.selling_price, 0),
        minimum_stock: toNumber(form.minimum_stock, 0),
        description: form.description.trim() || null,
      };
      if (product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({ ...payload, company_id: companyId as string })
          .select("id")
          .single();
        if (error) throw error;
        const initialStock = toNumber(form.initial_stock, 0);
        if (initialStock !== 0) {
          const { error: movementError } = await supabase.from("inventory_movements").insert({
            company_id: companyId as string,
            product_id: data.id,
            quantity: initialStock,
            reason: "initial",
          });
          if (movementError) throw movementError;
        }
      }
    },
    onSuccess: () => {
      toast.success(product ? t("trade.inventory.form.toast.updated") : t("trade.inventory.form.toast.created"));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("[product.save]", error);
      toast.error(errorMessage(error, t("trade.inventory.form.toast.saveError")));
    },
  });

  function validate() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next["name"] = t("trade.inventory.form.error.nameRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function field(key: keyof typeof EMPTY, label: string, type = "text") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type={type}
          value={form[key]}
          onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
        />
        {errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? t("trade.inventory.form.editTitle") : t("trade.inventory.form.newTitle")}</DialogTitle>
          <DialogDescription>{t("trade.inventory.form.description")}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            if (validate()) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", t("trade.inventory.form.name"))}
            {field("sku", t("trade.inventory.form.sku"))}
            {field("category", t("trade.inventory.form.category"))}
            {field("supplier", t("trade.inventory.form.supplier"))}
            {field("purchase_price", t("trade.inventory.form.purchasePrice"), "number")}
            {field("selling_price", t("trade.inventory.form.sellingPrice"), "number")}
            {field("minimum_stock", t("trade.inventory.form.minimumStock"), "number")}
            {!product ? field("initial_stock", t("trade.inventory.form.initialStock"), "number") : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("trade.inventory.form.notes")}</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("trade.inventory.form.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? t("trade.inventory.form.saving") : product ? t("trade.inventory.form.save") : t("trade.inventory.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
