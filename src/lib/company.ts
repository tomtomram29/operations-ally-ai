import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Company = Tables<"companies">;

export type CompanyContext = {
  company: Company | null;
  role: string | null;
};

export async function fetchCurrentCompany(): Promise<CompanyContext> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { company: null, role: null };

  const { data, error } = await supabase
    .from("company_members")
    .select("role, companies(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.companies) return { company: null, role: null };
  return { company: data.companies as Company, role: data.role };
}

export function useCompany() {
  const query = useQuery({
    queryKey: ["current-company"],
    queryFn: fetchCurrentCompany,
    staleTime: 60_000,
  });

  return {
    company: query.data?.company ?? null,
    companyId: query.data?.company?.id ?? null,
    role: query.data?.role ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
