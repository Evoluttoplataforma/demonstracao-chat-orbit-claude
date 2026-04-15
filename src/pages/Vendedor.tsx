import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, CalendarDays, RefreshCw, Brain } from "lucide-react";
import LeadsTable from "@/components/admin/LeadsTable";
import CalendarView from "@/components/admin/CalendarView";
import DiagnosticoTab from "@/components/admin/DiagnosticoTab";
import { Lead } from "@/components/admin/lead-types";

const Vendedor = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserName(session.user.email || "");
      fetchLeads();
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

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Painel do Vendedor</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{userName}</span>
          <Button variant="ghost" size="icon" onClick={fetchLeads} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="leads">
          <TabsList className="mb-4">
            <TabsTrigger value="leads" className="gap-1.5">
              <Users className="h-4 w-4" /> Leads
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarDays className="h-4 w-4" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="diagnostico" className="gap-1.5">
              <Brain className="h-4 w-4" /> Diagnóstico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <LeadsTable leads={leads} loading={loading} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView leads={leads} loading={loading} />
          </TabsContent>

          <TabsContent value="diagnostico">
            <DiagnosticoTab readOnly />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Vendedor;
