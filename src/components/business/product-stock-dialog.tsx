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

type Product = Tables<"products">;

export function ProductStockDialog({ trigger, product }: { trigger: ReactNode; product: Product }) {
  const { t } = useI18n();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("adjustment");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setDirection("in");
    setQuantity("1");
    setReason("adjustment");
    setNote("");
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const qty = Math.abs(toNumber(quantity, 0));
      if (qty === 0) throw new Error(t("trade.inventory.stock.error.quantityRequired"));
      const { error } = await supabase.from("inventory_movements").insert({
        company_id: companyId as string,
        product_id: product.id,
        quantity: direction === "in" ? qty : -qty,
        reason,
        note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("trade.inventory.stock.toast.saved"));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("[product.stock]", error);
      toast.error(errorMessage(error, t("trade.inventory.stock.error.save")));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("trade.inventory.stock.title")}</DialogTitle>
          <DialogDescription>{t("trade.inventory.stock.description").replace("{name}", product.name)}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>{t("trade.inventory.stock.direction")}</Label>
            <Select value={direction} onValueChange={(value) => setDirection(value as "in" | "out")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">{t("trade.inventory.stock.in")}</SelectItem>
                <SelectItem value="out">{t("trade.inventory.stock.out")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">{t("trade.inventory.stock.quantity")}</Label>
            <Input id="quantity" type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("trade.inventory.stock.reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustment">{t("trade.inventory.stock.reason.adjustment")}</SelectItem>
                <SelectItem value="restock">{t("trade.inventory.stock.reason.restock")}</SelectItem>
                <SelectItem value="damage">{t("trade.inventory.stock.reason.damage")}</SelectItem>
                <SelectItem value="return">{t("trade.inventory.stock.reason.return")}</SelectItem>
                <SelectItem value="other">{t("trade.inventory.stock.reason.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">{t("trade.inventory.stock.note")}</Label>
            <Input id="note" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("trade.inventory.form.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("trade.inventory.stock.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
