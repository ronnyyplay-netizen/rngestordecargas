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
  onAdd: (driver: { name: string; phone: string; truck: string }) => Promise<void>;
}

export function AddDriverDialog({ onAdd }: AddDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [truck, setTruck] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    await onAdd({ name: name.trim(), phone: phone.trim(), truck: truck.trim() });
    setSaving(false);
    setName("");
    setPhone("");
    setTruck("");
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
            <label className="text-xs font-medium mb-1 block">Caminhão / Placa</label>
            <Input value={truck} onChange={(e) => setTruck(e.target.value)} placeholder="Ex: Scania R450 - ABC1D23" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
