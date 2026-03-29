import { useState, useRef } from "react";
import { useSettings, useDrivers, useExpenses, useRevenues } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Upload, Download, FolderUp } from "lucide-react";
import { z } from "zod";

// Validation schemas for backup import
const driverSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).default(""),
  truck: z.string().trim().max(100).default(""),
});

const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().trim().min(1).max(500),
  amount: z.number().finite().min(0).max(999_999_999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  category: z.string().trim().min(1).max(100),
  driverId: z.string().uuid(),
  isBoleto: z.boolean().optional().default(false),
});

const revenueSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().trim().min(1).max(500),
  amount: z.number().finite().min(0).max(999_999_999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  driverId: z.string().uuid(),
});

const settingsSchema = z.object({
  companyName: z.string().trim().min(1).max(200).default("Minha Empresa"),
  logoUrl: z.string().max(500_000).refine(
    (val) => val === "" || val.startsWith("data:image/"),
    { message: "Logo must be a base64 data:image URL or empty" }
  ).default(""),
});

const backupSchema = z.object({
  drivers: z.array(driverSchema).max(50).optional().default([]),
  expenses: z.array(expenseSchema).max(10_000).optional().default([]),
  revenues: z.array(revenueSchema).max(10_000).optional().default([]),
  settings: settingsSchema.optional(),
  exportedAt: z.string().optional(),
});

export default function SettingsPage() {
  const { settings, save } = useSettings();
  const { drivers } = useDrivers();
  const { expenses } = useExpenses();
  const { revenues } = useRevenues();
  const [name, setName] = useState(settings.companyName);
  const [logo, setLogo] = useState(settings.logoUrl);
  const importRef = useRef<HTMLInputElement>(null);
  const [synced, setSynced] = useState(false);

  // Sync local state when settings load from DB
  if (!synced) {
    if (settings.companyName !== name || settings.logoUrl !== logo) {
      setName(settings.companyName);
      setLogo(settings.logoUrl);
    }
    setSynced(true);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function exportBackup() {
    const data = {
      drivers,
      expenses,
      revenues,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado com sucesso!");
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = JSON.parse(reader.result as string);
        const parsed = backupSchema.safeParse(raw);
        if (!parsed.success) {
          toast.error("Arquivo de backup inválido: " + parsed.error.issues[0]?.message);
          return;
        }
        const data = parsed.data;
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) { toast.error("Não autenticado"); return; }

        // Import settings
        if (data.settings) {
          await save({
            companyName: data.settings.companyName,
            logoUrl: data.settings.logoUrl,
          });
          setName(data.settings.companyName);
          setLogo(data.settings.logoUrl);
        }

        // Import drivers with new UUIDs
        const driverIdMap = new Map<string, string>();
        for (const d of data.drivers) {
          const newId = crypto.randomUUID();
          if (d.id) driverIdMap.set(d.id, newId);
          await supabase.from("drivers").insert({
            id: newId, owner_id: user.id, name: d.name, phone: d.phone, truck: d.truck,
          });
        }

        // Import expenses with new UUIDs and remapped driver IDs
        for (const ex of data.expenses) {
          const mappedDriverId = driverIdMap.get(ex.driverId) || ex.driverId;
          await supabase.from("expenses").insert({
            id: crypto.randomUUID(), owner_id: user.id, driver_id: mappedDriverId,
            description: ex.description, amount: ex.amount, date: ex.date,
            category: ex.category, is_boleto: ex.isBoleto,
          });
        }

        // Import revenues with new UUIDs and remapped driver IDs
        for (const r of data.revenues) {
          const mappedDriverId = driverIdMap.get(r.driverId) || r.driverId;
          await supabase.from("revenues").insert({
            id: crypto.randomUUID(), owner_id: user.id, driver_id: mappedDriverId,
            description: r.description, amount: r.amount, date: r.date,
          });
        }

        toast.success("Backup restaurado com sucesso! Recarregue a página.");
      } catch {
        toast.error("Arquivo inválido. Selecione um backup JSON válido.");
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  }

  async function handleSave() {
    await save({ companyName: name.trim() || "Galos Transportes", logoUrl: logo });
    toast.success("Configurações salvas!");
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Edite o nome e logo da empresa</p>
      </div>

      <div className="stat-card space-y-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nome da Empresa</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Logo</label>
          {logo && (
            <img src={logo} alt="Logo" className="w-20 h-20 rounded-lg object-cover mb-3 border" />
          )}
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/70 transition-colors">
            <Upload className="w-4 h-4" /> Escolher imagem
            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </label>
        </div>

        <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" /> Salvar
        </Button>
      </div>

      <div className="stat-card space-y-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <h2 className="font-semibold">Backup de Dados</h2>
        <p className="text-muted-foreground text-sm">Exporte ou importe todos os dados do sistema em formato JSON.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={exportBackup} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" /> Exportar Backup
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => importRef.current?.click()}>
            <FolderUp className="w-4 h-4 mr-2" /> Importar Backup
          </Button>
          <input ref={importRef} type="file" className="hidden" accept=".json" onChange={handleImportBackup} />
        </div>
      </div>
    </div>
  );
}
