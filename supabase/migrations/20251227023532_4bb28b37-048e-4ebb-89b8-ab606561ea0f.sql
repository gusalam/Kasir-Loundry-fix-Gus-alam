-- Create receipt settings table
CREATE TABLE public.receipt_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  business_name text NOT NULL DEFAULT 'POS Laundry',
  address text,
  phone text,
  footer_text text DEFAULT 'Terima kasih atas kepercayaan Anda!',
  show_logo boolean NOT NULL DEFAULT true,
  paper_size text NOT NULL DEFAULT '58mm',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.receipt_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage their own settings
CREATE POLICY "Users can view own settings"
ON public.receipt_settings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
ON public.receipt_settings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
ON public.receipt_settings
FOR UPDATE
USING (user_id = auth.uid());

-- Admin can view all settings
CREATE POLICY "Admin can view all settings"
ON public.receipt_settings
FOR SELECT
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_receipt_settings_updated_at
BEFORE UPDATE ON public.receipt_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipt_settings;