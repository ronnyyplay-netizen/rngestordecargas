import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddDriverDialogProps {
  onAdd: (driver: { name: string; phone: string; truck: string; plate: string; model: string }) => Promise<void>;
}

const VEHICLE_MODELS = ["VAN", "FIORINO", "CARRO", "CAMINHÃO"];

export function AddDriverDialog({ onAdd }: AddDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [truck, setTruck] = useState("");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const finalModel = model === "custom" ? customModel.trim() : model;
    setSaving(true);
    await onAdd({ name: name.trim(), phone: phone.trim(), truck: truck.trim(), plate: plate.trim(), model: finalModel });
    setSaving(false);
    setName(""); setPhone(""); setTruck(""); setPlate(""); setModel(""); setCustomModel("");
    setOpen(false);
    toast.success("Motorista adicionado!");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <Plus className="w-4 h-4 shrink-0" />
          <span>Novo Motorista</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Motorista</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium mb-1 block">Nome *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do motorista" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Telefone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999999999" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Modelo do Veículo</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione...</option>
              {VEHICLE_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="custom">Digitar manualmente</option>
            </select>
            {model === "custom" && (
              <Input value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Ex: Sprinter 415" className="mt-2" />
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Placa</label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={7} />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}