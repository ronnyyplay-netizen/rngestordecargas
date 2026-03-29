import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Invoice {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  notes: string;
  driver_id: string | null;
  created_at: string;
}

export function useInvoices(driverId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (driverId) q = q.eq("driver_id", driverId);
    const { data } = await q;
    if (data) setInvoices(data as Invoice[]);
    setLoading(false);
  }, [driverId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { invoices, loading, refetch: fetch };
}

export async function viewInvoice(filePath: string) {
  const { data } = await supabase.storage.from("invoices").createSignedUrl(filePath, 300);
  if (data?.signedUrl) {
    window.open(data.signedUrl, "_blank");
  }
}

export async function downloadInvoice(filePath: string, fileName: string) {
  const { data } = await supabase.storage.from("invoices").download(filePath);
  if (!data) return;
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
