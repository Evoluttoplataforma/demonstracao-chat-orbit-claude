import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      toast({ title: "Erro ao entrar", description: "Sessão inválida.", variant: "destructive" });
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    setLoading(false);

    if (rolesError) {
      toast({ title: "Erro ao carregar perfil", description: rolesError.message, variant: "destructive" });
      navigate("/vendedor");
      return;
    }

    const isAdmin = roles?.some((r) => r.role === "admin") === true;
    const isCS = roles?.some((r) => r.role === "cs") === true;
    navigate(isAdmin ? "/admin" : isCS ? "/cs" : "/vendedor");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !whatsapp.trim() || !password.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("register-vendedor", {
      body: { nome: nome.trim(), email: email.trim(), whatsapp: whatsapp.trim(), senha: password },
    });

    if (error || (data && !data.success)) {
      setLoading(false);
      toast({ title: "Erro no cadastro", description: data?.error || "Tente novamente", variant: "destructive" });
      return;
    }

    // Auto-login after registration
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      toast({ title: "Cadastro realizado!", description: "Faça login com suas credenciais." });
      setIsRegistering(false);
      return;
    }

    toast({ title: "Bem-vindo!", description: "Cadastro realizado com sucesso." });
    navigate("/vendedor");
  };

  return (
    <div className="h-dvh bg-background flex items-center justify-center px-4">
      <form onSubmit={isRegistering ? handleRegister : handleLogin} className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isRegistering ? "Cadastro de Vendedor" : "Painel do Vendedor"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRegistering ? "Crie sua conta para acessar o painel" : "Entre com suas credenciais"}
          </p>
        </div>

        {isRegistering && (
          <>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required placeholder="71999998888" />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (isRegistering ? "Cadastrando..." : "Entrando...") : (isRegistering ? "Cadastrar" : "Entrar")}
        </Button>

        <button
          type="button"
          onClick={() => { setIsRegistering(!isRegistering); setLoading(false); }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isRegistering ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
        </button>
      </form>
    </div>
  );
};

export default Login;
