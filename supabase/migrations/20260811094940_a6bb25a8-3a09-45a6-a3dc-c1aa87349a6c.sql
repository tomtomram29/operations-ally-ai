-- Helper: membership check (security definer, avoids recursive RLS)
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_type text,
  country text NOT NULL DEFAULT 'IT',
  currency text NOT NULL DEFAULT 'EUR',
  vat_number text,
  address text,
  city text,
  postal_code text,
  phone text,
  email text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = _company_id AND m.user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = _company_id AND m.user_id = auth.uid()
      AND m.role IN ('owner','admin')
  )
$$;

CREATE POLICY "Members can view their companies" ON public.companies FOR SELECT TO authenticated USING (public.is_company_member(id));
CREATE POLICY "Users can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE TO authenticated USING (public.is_company_admin(id)) WITH CHECK (public.is_company_admin(id));
CREATE POLICY "Owner can delete company" ON public.companies FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Members can view members" ON public.company_members FOR SELECT TO authenticated USING (public.is_company_member(company_id));
CREATE POLICY "Self or admin can insert member" ON public.company_members FOR INSERT TO authenticated WITH CHECK (
  public.is_company_admin(company_id)
  OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid()))
);
CREATE POLICY "Admins can update members" ON public.company_members FOR UPDATE TO authenticated USING (public.is_company_admin(company_id)) WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Admins can delete members" ON public.company_members FOR DELETE TO authenticated USING (public.is_company_admin(company_id));

-- Customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  address text,
  city text,
  country text DEFAULT 'IT',
  vat_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_company ON public.customers(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Employees
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  role text,
  department text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_company ON public.employees(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage employees" ON public.employees FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  description text,
  category text,
  purchase_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  current_stock integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  supplier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE UNIQUE INDEX idx_products_company_sku ON public.products(company_id, sku) WHERE sku IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage products" ON public.products FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Inventory movements
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  reason text NOT NULL DEFAULT 'adjustment',
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_mov_company ON public.inventory_movements(company_id);
CREATE INDEX idx_inv_mov_product ON public.inventory_movements(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage inventory movements" ON public.inventory_movements FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes text,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_total numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE UNIQUE INDEX idx_invoices_company_number ON public.invoices(company_id, invoice_number);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_rate numeric(5,2) NOT NULL DEFAULT 22 CHECK (tax_rate >= 0),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage invoice items" ON public.invoice_items FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Sales
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  total numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_company ON public.sales(company_id);
CREATE INDEX idx_sales_customer ON public.sales(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage sales" ON public.sales FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage sale items" ON public.sale_items FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_company ON public.tasks(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage tasks" ON public.tasks FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_company ON public.notifications(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_company_member(company_id)) WITH CHECK (public.is_company_member(company_id));

-- updated_at triggers
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_company_members_updated BEFORE UPDATE ON public.company_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoice totals recalculation from items
CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv uuid;
  s numeric(14,2);
  t numeric(14,2);
BEGIN
  inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(quantity * unit_price), 0),
         COALESCE(SUM(quantity * unit_price * tax_rate / 100), 0)
    INTO s, t
  FROM public.invoice_items WHERE invoice_id = inv;
  UPDATE public.invoices SET subtotal = s, tax_total = t, total = s + t, updated_at = now() WHERE id = inv;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_invoice_items_totals
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();

-- Keep product stock in sync with inventory movements
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET current_stock = current_stock + NEW.quantity, updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_inventory_movement AFTER INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();