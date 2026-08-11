import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company";
import { errorMessage } from "@/lib/format";
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

type Customer = Tables<"customers">;

const EMPTY = {
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "IT",
  vat_number: "",
  notes: "",
};

export function CustomerFormDialog({
  trigger,
  customer,
}: {
  trigger: ReactNode;
  customer?: Customer;
}) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      customer
        ? {
            first_name: customer.first_name ?? "",
            last_name: customer.last_name ?? "",
            company_name: customer.company_name ?? "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            country: customer.country ?? "IT",
            vat_number: customer.vat_number ?? "",
            notes: customer.notes ?? "",
          }
        : { ...EMPTY },
    );
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        company_name: form.company_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        vat_number: form.vat_number.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (customer) {
        const { error } = await supabase.from("customers").update(payload).eq("id", customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...payload, company_id: companyId as string });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(customer ? "Customer updated" : "Customer created");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customer?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("[customer.save]", error);
      toast.error(errorMessage(error, "Could not save this customer."));
    },
  });

  function validate() {
    const next: Record<string, string> = {};
    if (!form.first_name.trim() && !form.last_name.trim() && !form.company_name.trim()) {
      next["first_name"] = "Enter a name or a company name.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next["email"] = "Enter a valid email address.";
    }
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
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>Customer records are stored in your company database.</DialogDescription>
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
            {field("first_name", "First name")}
            {field("last_name", "Last name")}
            {field("company_name", "Company name")}
            {field("vat_number", "Tax ID / VAT number")}
            {field("email", "Email", "email")}
            {field("phone", "Phone")}
            {field("address", "Address")}
            {field("city", "City")}
            {field("country", "Country")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? "Saving..." : customer ? "Save changes" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
