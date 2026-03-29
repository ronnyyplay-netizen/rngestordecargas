import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  truck: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  driverId: string;
  isBoleto?: boolean;
}

export interface Revenue {
  id: string;
  description: string;
  amount: number;
  date: string;
  driverId: string;
}

export interface AppSettings {
  companyName: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = { companyName: "Galos Transportes", logoUrl: "" };

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("drivers").select("*").order("created_at");
    if (data) setDrivers(data.map(d => ({ id: d.id, name: d.name, phone: d.phone, truck: d.truck })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (d: Omit<Driver, "id">) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("drivers").insert({ owner_id: user.id, name: d.name, phone: d.phone, truck: d.truck });
    await fetch();
  };

  const update = async (d: Driver) => {
    await supabase.from("drivers").update({ name: d.name, phone: d.phone, truck: d.truck }).eq("id", d.id);
    await fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("drivers").delete().eq("id", id);
    await fetch();
  };

  return { drivers, loading, refetch: fetch, add, update, remove };
}

export function useExpenses(driverId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase.from("expenses").select("*").order("date", { ascending: false });
    if (driverId) q = q.eq("driver_id", driverId);
    const { data } = await q;
    if (data) setExpenses(data.map(e => ({
      id: e.id, description: e.description, amount: Number(e.amount),
      date: e.date, category: e.category, driverId: e.driver_id, isBoleto: e.is_boleto,
    })));
    setLoading(false);
  }, [driverId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (e: Omit<Expense, "id">) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("expenses").insert({
      owner_id: user.id, driver_id: e.driverId, description: e.description,
      amount: e.amount, date: e.date, category: e.category, is_boleto: e.isBoleto ?? false,
    });
    await fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    await fetch();
  };

  return { expenses, loading, add, remove, refetch: fetch };
}

export function useRevenues(driverId?: string) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase.from("revenues").select("*").order("date", { ascending: false });
    if (driverId) q = q.eq("driver_id", driverId);
    const { data } = await q;
    if (data) setRevenues(data.map(r => ({
      id: r.id, description: r.description, amount: Number(r.amount),
      date: r.date, driverId: r.driver_id,
    })));
    setLoading(false);
  }, [driverId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (r: Omit<Revenue, "id">) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("revenues").insert({
      owner_id: user.id, driver_id: r.driverId, description: r.description,
      amount: r.amount, date: r.date,
    });
    await fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("revenues").delete().eq("id", id);
    await fetch();
  };

  return { revenues, loading, add, remove, refetch: fetch };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
    if (data) setSettings({ companyName: data.company_name, logoUrl: data.logo_url });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (s: AppSettings) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from("app_settings").upsert({
      owner_id: user.id, company_name: s.companyName, logo_url: s.logoUrl,
    }, { onConflict: "owner_id" });
    setSettings(s);
  };

  return { settings, loading, save, refetch: fetch };
}
