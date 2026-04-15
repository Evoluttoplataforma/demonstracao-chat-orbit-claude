import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, Trash2, Calendar, Clock, Video, Users, Edit2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Sala {
  id: string;
  nome: string;
  descricao: string;
  link_sala: string;
  ativo: boolean;
  categoria: string;
}

interface Horario {
  id: string;
  sala_id: string;
  tipo: string;
  dia_semana: number | null;
  data_especifica: string | null;
  horario: string;
  ativo: boolean;
}

interface Presenca {
  id: string;
  sala_id: string;
  horario_id: string;
  data_sessao: string;
  nome: string;
  email: string;
  whatsapp: string;
  created_at: string;
}

const SalasTab = () => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [salaForm, setSalaForm] = useState({ nome: "", descricao: "", link_sala: "", categoria: "treinamento_inicial" });
  const [salaDialogOpen, setSalaDialogOpen] = useState(false);
  const [horarioForm, setHorarioForm] = useState({ sala_id: "", tipo: "recorrente", dia_semana: "1", horario: "10:00" });
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false);
  const [presencaDialogOpen, setPresencaDialogOpen] = useState(false);
  const [selectedSalaPresencas, setSelectedSalaPresencas] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [salasRes, horariosRes, presencasRes] = await Promise.all([
      supabase.from("salas").select("*").order("created_at"),
      supabase.from("sala_horarios").select("*").order("horario"),
      supabase.from("sala_presencas").select("*").order("data_sessao", { ascending: false }),
    ]);
    setSalas((salasRes.data as Sala[]) || []);
    setHorarios((horariosRes.data as Horario[]) || []);
    setPresencas((presencasRes.data as Presenca[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveSala = async () => {
    if (!salaForm.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editingSala) {
      const { error } = await supabase.from("salas").update({ nome: salaForm.nome, descricao: salaForm.descricao, link_sala: salaForm.link_sala, categoria: salaForm.categoria }).eq("id", editingSala.id);
      if (error) { toast.error("Erro ao atualizar sala"); return; }
      toast.success("Sala atualizada");
    } else {
      const { error } = await supabase.from("salas").insert({ nome: salaForm.nome, descricao: salaForm.descricao, link_sala: salaForm.link_sala, categoria: salaForm.categoria });
      if (error) { toast.error("Erro ao criar sala"); return; }
      toast.success("Sala criada");
    }
    setSalaDialogOpen(false);
    setEditingSala(null);
    setSalaForm({ nome: "", descricao: "", link_sala: "", categoria: "treinamento_inicial" });
    fetchAll();
  };

  const toggleSalaAtivo = async (sala: Sala) => {
    await supabase.from("salas").update({ ativo: !sala.ativo }).eq("id", sala.id);
    fetchAll();
  };

  const deleteSala = async (id: string) => {
    await supabase.from("salas").delete().eq("id", id);
    toast.success("Sala excluída");
    fetchAll();
  };

  const handleSaveHorario = async () => {
    if (!horarioForm.sala_id) { toast.error("Selecione uma sala"); return; }
    if (horarioForm.tipo === "recorrente") {
      const payload = {
        sala_id: horarioForm.sala_id,
        tipo: horarioForm.tipo,
        horario: horarioForm.horario,
        dia_semana: parseInt(horarioForm.dia_semana),
      };
      const { error } = await supabase.from("sala_horarios").insert(payload);
      if (error) { toast.error("Erro ao criar horário"); return; }
      toast.success("Horário adicionado");
    } else {
      if (selectedDates.length === 0) { toast.error("Selecione pelo menos uma data"); return; }
      const rows = selectedDates.map(d => ({
        sala_id: horarioForm.sala_id,
        tipo: "especifico" as const,
        horario: horarioForm.horario,
        data_especifica: format(d, "yyyy-MM-dd"),
      }));
      const { error } = await supabase.from("sala_horarios").insert(rows);
      if (error) { toast.error("Erro ao criar horários"); return; }
      toast.success(`${rows.length} horário(s) adicionado(s)`);
    }
    setHorarioDialogOpen(false);
    setHorarioForm({ sala_id: "", tipo: "recorrente", dia_semana: "1", horario: "10:00" });
    setSelectedDates([]);
    fetchAll();
  };

  const deleteHorario = async (id: string) => {
    await supabase.from("sala_horarios").delete().eq("id", id);
    toast.success("Horário excluído");
    fetchAll();
  };

  const toggleHorarioAtivo = async (h: Horario) => {
    await supabase.from("sala_horarios").update({ ativo: !h.ativo }).eq("id", h.id);
    fetchAll();
  };

  if (loading) return <p className="text-muted-foreground text-center py-12">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Salas Fixas</h2>
        <div className="flex gap-2">
          <Dialog open={horarioDialogOpen} onOpenChange={setHorarioDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Clock className="h-4 w-4" /> Adicionar Horário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Horário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Sala</Label>
                  <Select value={horarioForm.sala_id} onValueChange={(v) => setHorarioForm(f => ({ ...f, sala_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                    <SelectContent>
                      {salas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={horarioForm.tipo} onValueChange={(v) => setHorarioForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recorrente">Recorrente (semanal)</SelectItem>
                      <SelectItem value="especifico">Data específica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {horarioForm.tipo === "recorrente" ? (
                  <div>
                    <Label>Dia da semana</Label>
                    <Select value={horarioForm.dia_semana} onValueChange={(v) => setHorarioForm(f => ({ ...f, dia_semana: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIAS_SEMANA.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Datas (selecione múltiplas)</Label>
                    <CalendarComponent
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => setSelectedDates(dates || [])}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={cn("p-3 pointer-events-auto rounded-md border border-border")}
                      locale={ptBR}
                    />
                    {selectedDates.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedDates.length} data(s) selecionada(s)
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <Label>Horário</Label>
                  <Input type="time" value={horarioForm.horario} onChange={(e) => setHorarioForm(f => ({ ...f, horario: e.target.value }))} />
                </div>
                <Button onClick={handleSaveHorario} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={salaDialogOpen} onOpenChange={(open) => { setSalaDialogOpen(open); if (!open) { setEditingSala(null); setSalaForm({ nome: "", descricao: "", link_sala: "", categoria: "treinamento_inicial" }); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Nova Sala
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSala ? "Editar Sala" : "Nova Sala"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input placeholder="Ex: Onboarding" value={salaForm.nome} onChange={(e) => setSalaForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea placeholder="Breve descrição da sala" value={salaForm.descricao} onChange={(e) => setSalaForm(f => ({ ...f, descricao: e.target.value }))} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={salaForm.categoria} onValueChange={(v) => setSalaForm(f => ({ ...f, categoria: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="treinamento_inicial">Treinamento Inicial</SelectItem>
                      <SelectItem value="ativacao_canal">Ativação Canal</SelectItem>
                      <SelectItem value="tira_duvidas_empresas">Tira-dúvidas Empresas</SelectItem>
                      <SelectItem value="tira_duvidas_consultores">Tira-dúvidas Consultores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Link da sala (Meet/Zoom)</Label>
                  <Input placeholder="https://meet.google.com/..." value={salaForm.link_sala} onChange={(e) => setSalaForm(f => ({ ...f, link_sala: e.target.value }))} />
                </div>
                <Button onClick={handleSaveSala} className="w-full">{editingSala ? "Atualizar" : "Criar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {salas.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma sala criada ainda. Clique em "Nova Sala" para começar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salas.map((sala) => {
            const salaHorarios = horarios.filter(h => h.sala_id === sala.id);
            const salaPresencas = presencas.filter(p => p.sala_id === sala.id);
            return (
              <Card key={sala.id} className={`${!sala.ativo ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        {sala.nome}
                        {!sala.ativo && <Badge variant="outline" className="text-xs">Inativa</Badge>}
                        <Badge variant="secondary" className="text-xs">
                          {sala.categoria === "treinamento_inicial" ? "Treinamento Inicial"
                            : sala.categoria === "ativacao_canal" ? "Ativação Canal"
                            : sala.categoria === "tira_duvidas_empresas" ? "Tira-dúvidas Empresas"
                            : sala.categoria === "tira_duvidas_consultores" ? "Tira-dúvidas Consultores"
                            : sala.categoria}
                        </Badge>
                      </CardTitle>
                      {sala.descricao && <p className="text-sm text-muted-foreground mt-1">{sala.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={sala.ativo} onCheckedChange={() => toggleSalaAtivo(sala)} />
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingSala(sala);
                        setSalaForm({ nome: sala.nome, descricao: sala.descricao, link_sala: sala.link_sala, categoria: sala.categoria || "treinamento_inicial" });
                        setSalaDialogOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSala(sala.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {sala.link_sala && (
                    <a href={sala.link_sala} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block mt-1">
                      {sala.link_sala}
                    </a>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Horários */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Horários</p>
                    {salaHorarios.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhum horário configurado</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {salaHorarios.map(h => (
                          <div key={h.id} className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 ${h.ativo ? "border-border bg-card" : "border-border/50 opacity-50"}`}>
                            <Clock className="h-3 w-3 text-primary" />
                            {h.tipo === "recorrente"
                              ? `${DIAS_SEMANA[h.dia_semana || 0]} ${h.horario?.slice(0, 5)}`
                              : `${new Date(h.data_especifica + "T12:00").toLocaleDateString("pt-BR")} ${h.horario?.slice(0, 5)}`
                            }
                            <Switch className="scale-75" checked={h.ativo} onCheckedChange={() => toggleHorarioAtivo(h)} />
                            <button onClick={() => deleteHorario(h.id)} className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Presenças */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Presenças confirmadas ({salaPresencas.length})
                      </p>
                      {salaPresencas.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setSelectedSalaPresencas(sala.id); setPresencaDialogOpen(true); }}>
                          <Users className="h-3 w-3 mr-1" /> Ver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Presenças dialog */}
      <Dialog open={presencaDialogOpen} onOpenChange={setPresencaDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Presenças Confirmadas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {presencas.filter(p => p.sala_id === selectedSalaPresencas).map(p => (
              <div key={p.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.data_sessao + "T12:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {p.whatsapp && (
                  <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalasTab;
