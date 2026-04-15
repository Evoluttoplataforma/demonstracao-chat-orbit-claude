import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, CalendarDays, RefreshCw, UserPlus, BarChart3, Presentation, Brain, Mail, Video, Headset, Phone, FlaskConical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import VendedoresTab from "@/components/admin/VendedoresTab";
import LeadsTable from "@/components/admin/LeadsTable";
import RescheduleDialog from "@/components/admin/RescheduleDialog";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import CalendarView from "@/components/admin/CalendarView";
import SlidesTab from "@/components/admin/SlidesTab";
import DiagnosticoTab from "@/components/admin/DiagnosticoTab";
import EmailsTab from "@/components/admin/EmailsTab";
import SalasTab from "@/components/admin/SalasTab";
import CSTab from "@/components/admin/CSTab";
import CallLogsTab from "@/components/admin/CallLogsTab";
import { Lead, toDateKey } from "@/components/admin/lead-types";

const Admin = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [abEnabled, setAbEnabled] = useState<boolean | null>(null);
  const [abToggling, setAbToggling] = useState(false);
  const navigate = useNavigate();

  // Fetch A/B setting
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ab_testing_enabled")
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load ab_testing_enabled setting", error);
          setAbEnabled(false);
          return;
        }
        setAbEnabled(data?.value === "true");
      });
  }, []);

  const toggleAB = async () => {
    if (abEnabled === null) return;
    setAbToggling(true);
    const newValue = !abEnabled;
    const { error } = await supabase
      .from("app_settings")
      .update({ value: newValue ? "true" : "false", updated_at: new Date().toISOString() })
      .eq("key", "ab_testing_enabled");
    if (error) {
      console.error("Failed to toggle AB setting", error);
    } else {
      setAbEnabled(newValue);
    }
    setAbToggling(false);
  };

  const fetchLeads = async () => {
    setLoading(true);
    // Fetch ALL leads (Supabase defaults to 1000 row limit)
    let allLeads: Lead[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      const batch = (data as Lead[]) || [];
      allLeads = allLeads.concat(batch);
      hasMore = batch.length === PAGE_SIZE;
      from += PAGE_SIZE;
    }
    setLeads(allLeads);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else fetchLeads();
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

  const todayKey = toDateKey(new Date());

  const leadsByDateKey = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const lead of leads) {
      if (!lead.data_reuniao) continue;
      const [day, month, year] = lead.data_reuniao.split("/");
      if (!day || !month || !year) continue;
      const k = toDateKey(new Date(+year, +month - 1, +day));
      if (!map[k]) map[k] = [];
      map[k].push(lead);
    }
    return map;
  }, [leads]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Painel de Gestão</h1>
        <div className="flex items-center gap-2">
          {abEnabled !== null && (
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">A/B</span>
              <Switch
                checked={abEnabled}
                onCheckedChange={toggleAB}
                disabled={abToggling}
                className="scale-75"
              />
              <span className="text-xs font-medium text-foreground">{abEnabled ? "ON" : "OFF"}</span>
            </div>
          )}
          <RescheduleDialog />
          <Button variant="ghost" size="icon" onClick={fetchLeads} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-muted-foreground text-xs uppercase">Total Leads</p>
            <p className="text-2xl font-bold text-foreground">{leads.length}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-muted-foreground text-xs uppercase">Urgentes</p>
            <p className="text-2xl font-bold text-destructive">
              {leads.filter((l) => l.prioridade?.includes("Urgente")).length}
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-muted-foreground text-xs uppercase">Reuniões Hoje</p>
            <p className="text-2xl font-bold text-primary">
              {leadsByDateKey[todayKey]?.length || 0}
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-muted-foreground text-xs uppercase">Parciais</p>
            <p className="text-2xl font-bold text-foreground">
              {leads.filter((l) => !l.data_reuniao).length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="mb-4">
            <TabsTrigger value="leads" className="gap-1.5">
              <Users className="h-4 w-4" /> Leads
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarDays className="h-4 w-4" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="vendedores" className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Vendedores
            </TabsTrigger>
            <TabsTrigger value="slides" className="gap-1.5">
              <Presentation className="h-4 w-4" /> Apresentação
            </TabsTrigger>
            <TabsTrigger value="diagnostico" className="gap-1.5">
              <Brain className="h-4 w-4" /> Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-1.5">
              <Mail className="h-4 w-4" /> E-mails
            </TabsTrigger>
            <TabsTrigger value="salas" className="gap-1.5">
              <Video className="h-4 w-4" /> Salas
            </TabsTrigger>
            <TabsTrigger value="cs" className="gap-1.5">
              <Headset className="h-4 w-4" /> CS
            </TabsTrigger>
            <TabsTrigger value="calls" className="gap-1.5">
              <Phone className="h-4 w-4" /> Ligações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <LeadsTable leads={leads} loading={loading} onLeadsDeleted={fetchLeads} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView leads={leads} loading={loading} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab leads={leads} loading={loading} />
          </TabsContent>

          <TabsContent value="vendedores">
            <VendedoresTab />
          </TabsContent>

          <TabsContent value="slides">
            <SlidesTab />
          </TabsContent>

          <TabsContent value="diagnostico">
            <DiagnosticoTab />
          </TabsContent>

          <TabsContent value="emails">
            <EmailsTab />
          </TabsContent>

          <TabsContent value="salas">
            <SalasTab />
          </TabsContent>

          <TabsContent value="cs">
            <CSTab />
          </TabsContent>

          <TabsContent value="calls">
            <CallLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
