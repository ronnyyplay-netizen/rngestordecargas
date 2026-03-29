import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDrivers } from "@/hooks/use-store";
import { useInvoices, viewInvoice, downloadInvoice, type Invoice } from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Camera, FileText, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.xml,.doc,.docx,.xlsx,.xls,.csv,.webp";

export default function InvoicesPage() {
  const { drivers } = useDrivers();
  const [uploading, setUploading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const driverId = selectedDriver !== "all" ? selectedDriver : undefined;
  const { invoices, loading, refetch: fetchInvoices } = useInvoices(driverId);

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "";
      const path = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(path, file);

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { error: dbError } = await supabase.from("invoices").insert({
        owner_id: user.id,
        driver_id: selectedDriver !== "all" ? selectedDriver : null,
        file_name: file.name,
        file_path: path,
        file_type: ext.toLowerCase(),
        file_size: file.size,
      });

      if (dbError) {
        toast.error(`Erro ao salvar registro: ${dbError.message}`);
      }
    }

    toast.success("Upload concluído!");
    setUploading(false);
    fetchInvoices();
  }

  async function handleDelete(inv: Invoice) {
    await supabase.storage.from("invoices").remove([inv.file_path]);
    await supabase.from("invoices").delete().eq("id", inv.id);
    toast.success("Nota removida!");
    fetchInvoices();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Notas Fiscais</h1>
        <div className="flex items-center gap-2">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por motorista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os motoristas</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enviar Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : "Selecionar Arquivos"}
            </Button>
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Tirar Foto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Formatos aceitos: PDF, JPEG, PNG, XML, DOC, XLSX, CSV
          </p>
        </CardContent>
      </Card>

      {/* Invoices list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma nota fiscal encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead className="hidden sm:table-cell">Tamanho</TableHead>
                    <TableHead className="hidden md:table-cell">Motorista</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const driverName =
                      drivers.find((d) => d.id === inv.driver_id)?.name || "—";
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {inv.file_name}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell uppercase text-xs">
                          {inv.file_type}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">
                          {formatSize(inv.file_size)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {driverName}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">
                          {format(new Date(inv.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => viewInvoice(inv.file_path)}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => downloadInvoice(inv.file_path, inv.file_name)}
                              title="Baixar"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(inv)}
                              title="Excluir"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
