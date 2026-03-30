import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDrivers, useExpenses, useRevenues, type Expense } from "@/hooks/use-store";
import { useInvoices, viewInvoice, downloadInvoice } from "@/hooks/use-invoices";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportToExcel, exportToDoc } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, FileText, FileSpreadsheet, File, DollarSign, TrendingDown, TrendingUp, Pencil, Save, X, Filter, Upload, Eye, Download } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Combustível", "Manutenção", "Pedágio", "Alimentação", "Ajudante", "Motorista", "Frete", "Seguro", "Multa", "Outros"];

export default function DriverPage() {
  const { id } = useParams<{ id: string }>();
  const { drivers, update: updateDriver } = useDrivers();
  const { expenses, add: addExp, remove: removeExp } = useExpenses(id);
  const { revenues, add: addRev, remove: removeRev } = useRevenues(id);
  const { invoices: driverInvoices, refetch: refetchInvoices } = useInvoices(id);

  const driver = drivers.find((d) => d.id === id);

  const [tab, setTab] = useState<"expenses" | "revenue">("expenses");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expFileInputRef = useRef<HTMLInputElement>(null);
  const [expInvoiceFile, setExpInvoiceFile] = useState<File | null>(null);

  // Edit driver state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTruck, setEditTruck] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editCustomModel, setEditCustomModel] = useState("");

  const VEHICLE_MODELS = ["VAN", "FIORINO", "CARRO", "CAMINHÃO"];

  useEffect(() => {
    if (driver) {
      setEditName(driver.name);
      setEditPhone(driver.phone);
      setEditTruck(driver.truck);
      setEditPlate(driver.plate || "");
      const m = driver.model || "";
      if (VEHICLE_MODELS.includes(m)) { setEditModel(m); setEditCustomModel(""); }
      else if (m) { setEditModel("custom"); setEditCustomModel(m); }
      else { setEditModel(""); setEditCustomModel(""); }
    }
  }, [driver?.id]);

  if (!driver) return <p className="text-muted-foreground">Motorista não encontrado</p>;

  async function handleSaveDriver() {
    if (!editName.trim()) { toast.error("Nome é obrigatório"); return; }
    await updateDriver({ id: driver!.id, name: editName.trim(), phone: editPhone.trim(), truck: editTruck.trim() });
    setEditing(false);
    toast.success("Dados do motorista atualizados!");
  }

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRev = revenues.reduce((s, r) => s + r.amount, 0);
  const profit = totalRev - totalExp;

  const filteredExpenses = filterCategory === "Todas" ? expenses : expenses.filter(e => e.category === filterCategory);
  const filteredRevenues = revenues;

  function sanitizeFileName(name: string) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  async function handleAddExpense() {
    if (!desc.trim() || !amount) return;
    await addExp({ description: desc.trim(), amount: parseFloat(amount), date, category, driverId: driver!.id });
    
    if (expInvoiceFile) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const filePath = `${user.id}/${Date.now()}_${sanitizeFileName(expInvoiceFile.name)}`;
          const { error: uploadError } = await supabase.storage.from('invoices').upload(filePath, expInvoiceFile);
          if (uploadError) throw uploadError;
          
          await supabase.from('invoices').insert({
            owner_id: user.id,
            driver_id: driver!.id,
            file_name: expInvoiceFile.name,
            file_path: filePath,
            file_type: expInvoiceFile.type,
            file_size: expInvoiceFile.size,
            notes: `Despesa: ${desc.trim()}`,
          });
          toast.success("Nota fiscal anexada!");
          refetchInvoices();
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao enviar nota fiscal");
      }
      setExpInvoiceFile(null);
      if (expFileInputRef.current) expFileInputRef.current.value = '';
    }
    
    setDesc(""); setAmount("");
    toast.success("Despesa adicionada");
  }

  async function handleAddRevenue() {
    if (!desc.trim() || !amount) return;
    await addRev({ description: desc.trim(), amount: parseFloat(amount), date, driverId: driver!.id });
    
    // Upload invoice file if selected
    if (invoiceFile) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const filePath = `${user.id}/${Date.now()}_${sanitizeFileName(invoiceFile.name)}`;
          const { error: uploadError } = await supabase.storage.from('invoices').upload(filePath, invoiceFile);
          if (uploadError) throw uploadError;
          
          await supabase.from('invoices').insert({
            owner_id: user.id,
            driver_id: driver!.id,
            file_name: invoiceFile.name,
            file_path: filePath,
            file_type: invoiceFile.type,
            file_size: invoiceFile.size,
            notes: desc.trim(),
          });
          toast.success("Nota fiscal anexada!");
          refetchInvoices();
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao enviar nota fiscal");
      }
      setInvoiceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    
    setDesc(""); setAmount("");
    toast.success("Receita adicionada");
  }

  const stats = [
    { label: "Faturamento", value: totalRev, icon: DollarSign, color: "text-accent" },
    { label: "Despesas", value: totalExp, icon: TrendingDown, color: "text-destructive" },
    { label: "Lucro", value: profit, icon: TrendingUp, color: profit >= 0 ? "text-success" : "text-destructive" },
  ];

  const exportExpenses = filteredExpenses;

  return (
    <div className="space-y-6">
      {editing ? (
        <div className="stat-card space-y-3 animate-fade-in-up">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Editar Motorista</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome do motorista" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Telefone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="5511999999999" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Caminhão / Placa</label>
              <Input value={editTruck} onChange={(e) => setEditTruck(e.target.value)} placeholder="Caminhão / Placa" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveDriver}><Save className="w-4 h-4 mr-1" /> Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in-up flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{driver.name}</h1>
            <p className="text-muted-foreground text-sm">{driver.truck}</p>
            {driver.phone && <p className="text-muted-foreground text-xs mt-0.5">{driver.phone}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-1" /> Editar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold tabular-nums ${s.color}`}>
              R$ {s.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <button onClick={() => setTab("expenses")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "expenses" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>Despesas</button>
        <button onClick={() => setTab("revenue")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === "revenue" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>Receitas</button>
      </div>

      <div className="stat-card animate-fade-in-up" style={{ animationDelay: "320ms" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input type="number" placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {tab === "expenses" && (
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={tab === "expenses" ? expFileInputRef : fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (tab === "expenses") setExpInvoiceFile(file);
                else setInvoiceFile(file);
              }}
            />
            <Button
              type="button"
              variant={(tab === "expenses" ? expInvoiceFile : invoiceFile) ? "default" : "outline"}
              className="w-full"
              onClick={() => (tab === "expenses" ? expFileInputRef : fileInputRef).current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              {(tab === "expenses" ? expInvoiceFile : invoiceFile)
                ? (tab === "expenses" ? expInvoiceFile! : invoiceFile!).name.slice(0, 20)
                : "Nota Fiscal"}
            </Button>
          </div>
          <Button onClick={tab === "expenses" ? handleAddExpense : handleAddRevenue} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {tab === "expenses" && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-2 mr-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option>Todas</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(exportExpenses, `${driver.name} - Despesas${filterCategory !== "Todas" ? ` (${filterCategory})` : ""}`)}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToDoc(exportExpenses, `${driver.name} - Despesas${filterCategory !== "Todas" ? ` (${filterCategory})` : ""}`)}>
            <File className="w-4 h-4 mr-1" /> DOC
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(exportExpenses, `${driver.name} - Despesas${filterCategory !== "Todas" ? ` (${filterCategory})` : ""}`)}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      )}

      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "480ms" }}>
        {(tab === "expenses" ? filteredExpenses : filteredRevenues).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum registro ainda.</p>
        ) : (
          (tab === "expenses" ? filteredExpenses : filteredRevenues).map((item) => {
            const matchingInvoices = driverInvoices.filter(inv => 
              inv.notes.includes(item.description) || 
              inv.notes === `Despesa: ${item.description}` ||
              inv.notes === item.description
            );
            return (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-card rounded-lg border hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString("pt-BR")}
                    {"category" in item && ` • ${(item as Expense).category}`}
                    {"isBoleto" in item && (item as Expense).isBoleto && " • 📄 Boleto"}
                  </p>
                  {matchingInvoices.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {matchingInvoices.map(inv => (
                        <div key={inv.id} className="flex items-center gap-0.5 bg-muted rounded px-1.5 py-0.5">
                          <FileText className="w-3 h-3 text-primary" />
                          <span className="text-[10px] text-muted-foreground max-w-[80px] truncate">{inv.file_name}</span>
                          <button onClick={() => viewInvoice(inv.file_path)} className="text-muted-foreground hover:text-primary" title="Visualizar">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button onClick={() => downloadInvoice(inv.file_path, inv.file_name)} className="text-muted-foreground hover:text-primary" title="Baixar">
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm tabular-nums ${tab === "expenses" ? "text-destructive" : "text-success"}`}>
                    R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={async () => {
                      tab === "expenses" ? await removeExp(item.id) : await removeRev(item.id);
                      toast.success("Removido");
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
