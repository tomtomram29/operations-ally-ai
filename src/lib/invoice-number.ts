import { supabase } from "@/integrations/supabase/client";

/** Sequential invoice number scoped to the company and current year (e.g. 2026-0007). */
export async function nextInvoiceNumber(companyId: string) {
  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("company_id", companyId)
    .like("invoice_number", `${year}-%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  if (error) throw error;
  const last = data?.[0]?.invoice_number;
  const lastSeq = last ? Number(last.split("-")[1]) : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${year}-${String(next).padStart(4, "0")}`;
}
