import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const { login } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ACCESS_CODE = "Rn15002442";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (accessCode.trim() !== ACCESS_CODE) {
      toast.error("Código de acesso incorreto.");
      return;
    }
    setSubmitting(true);
    const ok = await login("acesso@sistema.local", ACCESS_CODE);
    if (!ok) {
      const { error } = await supabase.auth.signUp({
        email: "acesso@sistema.local",
        password: ACCESS_CODE,
      });
      if (error) {
        toast.error("Erro ao acessar. Tente novamente.");
        setSubmitting(false);
        return;
      }
      toast.success("Acesso liberado!");
    } else {
      toast.success("Acesso liberado!");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-xl overflow-hidden border bg-primary/10 flex items-center justify-center">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Gestão de Frotas</CardTitle>
          <CardDescription>Digite o código de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Código de Acesso</label>
              <Input type="password" placeholder="Digite o código" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} autoComplete="off" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
              Acessar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
