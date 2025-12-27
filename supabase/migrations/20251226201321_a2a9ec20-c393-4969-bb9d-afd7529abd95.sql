-- ====================================================
-- 1. ENUM TYPES
-- ====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'kasir');
CREATE TYPE public.service_type AS ENUM ('kiloan', 'satuan');
CREATE TYPE public.transaction_status AS ENUM ('diterima', 'diproses', 'qc', 'selesai', 'diambil');
CREATE TYPE public.payment_status AS ENUM ('belum_lunas', 'dp', 'lunas');
CREATE TYPE public.payment_method AS ENUM ('cash', 'qris', 'transfer');
CREATE TYPE public.cash_closing_status AS ENUM ('pending', 'approved');

-- ====================================================
-- 2. PROFILES TABLE
-- ====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 3. USER ROLES TABLE (SEPARATE FOR SECURITY)
-- ====================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'kasir',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 4. SECURITY DEFINER FUNCTIONS
-- ====================================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is kasir
CREATE OR REPLACE FUNCTION public.is_kasir()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'kasir')
$$;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ====================================================
-- 5. CUSTOMERS TABLE
-- ====================================================

CREATE TABLE public.customers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 6. SERVICES TABLE
-- ====================================================

CREATE TABLE public.services (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  type service_type NOT NULL DEFAULT 'kiloan',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 7. TRANSACTIONS TABLE
-- ====================================================

CREATE TABLE public.transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'diterima',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'belum_lunas',
  notes TEXT,
  estimated_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 8. TRANSACTION ITEMS TABLE
-- ====================================================

CREATE TABLE public.transaction_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transaction_id BIGINT REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  service_id BIGINT REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 9. PAYMENTS TABLE
-- ====================================================

CREATE TABLE public.payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transaction_id BIGINT REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  method payment_method NOT NULL DEFAULT 'cash',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 10. CASH CLOSINGS TABLE
-- ====================================================

CREATE TABLE public.cash_closings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cash_system NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  difference NUMERIC(12,2) NOT NULL DEFAULT 0,
  status cash_closing_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 11. EXPENSE CATEGORIES TABLE
-- ====================================================

CREATE TABLE public.expense_categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 12. EXPENSES TABLE
-- ====================================================

CREATE TABLE public.expenses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id BIGINT REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 13. TRANSACTION STATUS HISTORY (AUDIT)
-- ====================================================

CREATE TABLE public.transaction_status_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transaction_id BIGINT REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  old_status transaction_status,
  new_status transaction_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_status_history ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- 14. RLS POLICIES - PROFILES
-- ====================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ====================================================
-- 15. RLS POLICIES - USER ROLES
-- ====================================================

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- 16. RLS POLICIES - CUSTOMERS
-- ====================================================

CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ====================================================
-- 17. RLS POLICIES - SERVICES
-- ====================================================

CREATE POLICY "Authenticated users can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage services"
  ON public.services FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- 18. RLS POLICIES - TRANSACTIONS
-- ====================================================

CREATE POLICY "Admin can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Kasir can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can update all transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Kasir can update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can delete transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ====================================================
-- 19. RLS POLICIES - TRANSACTION ITEMS
-- ====================================================

CREATE POLICY "Admin can view all transaction items"
  ON public.transaction_items FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Kasir can view own transaction items"
  ON public.transaction_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can insert transaction items"
  ON public.transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Admin can manage transaction items"
  ON public.transaction_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- 20. RLS POLICIES - PAYMENTS
-- ====================================================

CREATE POLICY "Admin can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Kasir can view payments for own transactions"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can insert payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Admin can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- 21. RLS POLICIES - CASH CLOSINGS
-- ====================================================

CREATE POLICY "Admin can view all cash closings"
  ON public.cash_closings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Kasir can view own cash closings"
  ON public.cash_closings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Kasir can insert own cash closing"
  ON public.cash_closings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can update cash closings"
  ON public.cash_closings FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ====================================================
-- 22. RLS POLICIES - EXPENSE CATEGORIES (ADMIN ONLY)
-- ====================================================

CREATE POLICY "Admin can manage expense categories"
  ON public.expense_categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- 23. RLS POLICIES - EXPENSES (ADMIN ONLY)
-- ====================================================

CREATE POLICY "Admin can manage expenses"
  ON public.expenses FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================
-- 24. RLS POLICIES - TRANSACTION STATUS HISTORY
-- ====================================================

CREATE POLICY "Admin can view all status history"
  ON public.transaction_status_history FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Kasir can view own transaction history"
  ON public.transaction_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.id = transaction_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can insert status history"
  ON public.transaction_status_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- ====================================================
-- 25. TRIGGERS & FUNCTIONS
-- ====================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  
  -- Default role is kasir
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'kasir');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Validate transaction status transition
CREATE OR REPLACE FUNCTION public.validate_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_transitions TEXT[][] := ARRAY[
    ARRAY['diterima', 'diproses'],
    ARRAY['diproses', 'qc'],
    ARRAY['qc', 'selesai'],
    ARRAY['selesai', 'diambil']
  ];
  is_valid BOOLEAN := false;
  i INTEGER;
BEGIN
  -- Skip if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Admin can set any status
  IF public.is_admin() THEN
    -- Log the change
    INSERT INTO public.transaction_status_history (transaction_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    RETURN NEW;
  END IF;
  
  -- Validate transition for non-admin
  FOR i IN 1..array_length(valid_transitions, 1) LOOP
    IF valid_transitions[i][1] = OLD.status::TEXT AND valid_transitions[i][2] = NEW.status::TEXT THEN
      is_valid := true;
      EXIT;
    END IF;
  END LOOP;
  
  IF NOT is_valid THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  
  -- Log the change
  INSERT INTO public.transaction_status_history (transaction_id, old_status, new_status, changed_by)
  VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  
  -- Set completed_at when status is 'diambil'
  IF NEW.status = 'diambil' THEN
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_transaction_status
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today_count INTEGER;
  new_invoice TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_invoice := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  NEW.invoice_number := new_invoice;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invoice_before_insert
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();

-- Update payment status based on paid amount
CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_paid NUMERIC(12,2);
  trans_total NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE transaction_id = NEW.transaction_id;
  
  SELECT total_amount INTO trans_total
  FROM public.transactions
  WHERE id = NEW.transaction_id;
  
  UPDATE public.transactions
  SET 
    paid_amount = total_paid,
    payment_status = CASE
      WHEN total_paid >= trans_total THEN 'lunas'::payment_status
      WHEN total_paid > 0 THEN 'dp'::payment_status
      ELSE 'belum_lunas'::payment_status
    END
  WHERE id = NEW.transaction_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_transaction_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_payment_status();

-- Update customer total orders
CREATE OR REPLACE FUNCTION public.update_customer_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET total_orders = total_orders + 1
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_customer_order_count
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_orders();

-- ====================================================
-- 26. INDEXES FOR PERFORMANCE
-- ====================================================

CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transaction_items_transaction ON public.transaction_items(transaction_id);
CREATE INDEX idx_payments_transaction ON public.payments(transaction_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category_id);
CREATE INDEX idx_cash_closings_user ON public.cash_closings(user_id);
CREATE INDEX idx_cash_closings_date ON public.cash_closings(closing_date);

-- ====================================================
-- 27. SEED DATA - EXPENSE CATEGORIES
-- ====================================================

INSERT INTO public.expense_categories (name, description) VALUES
  ('Deterjen & Bahan', 'Pembelian deterjen, pewangi, dan bahan cuci'),
  ('Gaji Karyawan', 'Pembayaran gaji dan bonus karyawan'),
  ('Listrik & Air', 'Tagihan listrik dan air bulanan'),
  ('Maintenance Mesin', 'Perawatan dan perbaikan mesin laundry'),
  ('Sewa Tempat', 'Biaya sewa lokasi usaha'),
  ('Operasional Lainnya', 'Biaya operasional lainnya');

-- ====================================================
-- 28. SEED DATA - SERVICES
-- ====================================================

INSERT INTO public.services (name, type, price) VALUES
  ('Cuci Kering Lipat', 'kiloan', 7000),
  ('Cuci Setrika', 'kiloan', 10000),
  ('Setrika Saja', 'kiloan', 6000),
  ('Express Cuci Kering', 'kiloan', 12000),
  ('Express Cuci Setrika', 'kiloan', 15000),
  ('Bed Cover Single', 'satuan', 25000),
  ('Bed Cover Double', 'satuan', 35000),
  ('Selimut', 'satuan', 20000),
  ('Karpet Kecil', 'satuan', 30000),
  ('Karpet Besar', 'satuan', 50000),
  ('Jas/Blazer', 'satuan', 20000),
  ('Gaun/Dress', 'satuan', 25000);