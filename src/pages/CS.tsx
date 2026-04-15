import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, RefreshCw } from "lucide-react";
import SalasTab from "@/components/admin/SalasTab";
import SalasPresencasCalendar from "@/components/admin/SalasPresencasCalendar";
import orbitLogo from "@/assets/orbit-icon.png";

const CS = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .then(({ data: roles }) => {
          const isCS = roles?.some((r) => r.role === "cs");
          const isAdmin = roles?.some((r) => r.role === "admin");
          if (!isCS && !isAdmin) {
            navigate("/login");
          } else {
            setLoading(false);
          }
        });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={orbitLogo} alt="Orbit" className="h-8" />
          <h1 className="text-lg font-bold text-foreground">Customer Success</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="confirmados">
          <TabsList>
            <TabsTrigger value="confirmados">Confirmados</TabsTrigger>
            <TabsTrigger value="salas">Gerenciar Salas</TabsTrigger>
          </TabsList>
          <TabsContent value="confirmados" className="mt-4">
            <SalasPresencasCalendar />
          </TabsContent>
          <TabsContent value="salas" className="mt-4">
            <SalasTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CS;
