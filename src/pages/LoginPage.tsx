import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Truck } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });
      setSubmitting(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Conta criada com sucesso! Você já está logado.");
    } else {
      const ok = await login(email.trim(), password.trim());
      setSubmitting(false);
      if (!ok) {
        toast.error("Email ou senha incorretos.");
        return;
      }
      toast.success("Login realizado!");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-xl overflow-hidden border bg-primary/10 flex items-center justify-center">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Gestão de Frotas</CardTitle>
          <CardDescription>
            {isSignUp ? "Crie sua conta para começar" : "Acesse sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isSignUp ? (
                <UserPlus className="w-4 h-4 mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
