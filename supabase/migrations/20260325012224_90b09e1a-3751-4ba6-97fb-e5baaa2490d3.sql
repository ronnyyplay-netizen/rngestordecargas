
-- Create invoices table for metadata
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own invoices"
  ON public.invoices
  FOR ALL
  TO public
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Create storage bucket for invoice files
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false);

-- RLS for storage: users can manage their own folder
CREATE POLICY "Users upload own invoices"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own invoices"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own invoices"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);
