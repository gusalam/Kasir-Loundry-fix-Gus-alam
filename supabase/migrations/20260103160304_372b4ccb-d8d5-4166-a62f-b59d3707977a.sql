-- Drop existing trigger with correct name
DROP TRIGGER IF EXISTS generate_invoice_before_insert ON public.transactions;

-- Create improved invoice number generator with retry logic
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  today_count INTEGER;
  new_invoice TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    attempt := attempt + 1;
    
    -- Get the max invoice number for today
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(invoice_number FROM 'INV-[0-9]{8}-([0-9]+)$') AS INTEGER
        )
      ), 0
    ) + 1 INTO today_count
    FROM public.transactions
    WHERE invoice_number LIKE 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    new_invoice := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
    
    -- Check if this invoice already exists
    IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE invoice_number = new_invoice) THEN
      NEW.invoice_number := new_invoice;
      RETURN NEW;
    END IF;
    
    -- If we've exceeded max attempts, add random suffix
    IF attempt >= max_attempts THEN
      new_invoice := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
      NEW.invoice_number := new_invoice;
      RETURN NEW;
    END IF;
  END LOOP;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER generate_invoice_before_insert
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.generate_invoice_number();