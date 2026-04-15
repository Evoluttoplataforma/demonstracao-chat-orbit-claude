import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Phone, Loader2 } from "lucide-react";
import { Lead, PRIORITY_COLORS } from "./lead-types";
import LeadFlowLogs from "./LeadFlowLogs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  onLeadsDeleted?: () => void;
}

const LeadsTable = ({ leads, loading, onLeadsDeleted }: LeadsTableProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);

  const handleConfirmationCall = async (leadId: string, leadName: string) => {
    setCallingLeadId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("confirmation-call", {
        body: { leadId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Ligação iniciada para ${leadName}`);
      onLeadsDeleted?.(); // refresh
    } catch (err: any) {
      console.error("Call failed:", err);
      toast.error(`Erro ao ligar para ${leadName}: ${err.message || "erro desconhecido"}`);
    } finally {
      setCallingLeadId(null);
    }
  };

  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && selected.size < leads.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selected);
      // Delete in batches of 50
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        const { error } = await supabase.from("leads").delete().in("id", batch);
        if (error) throw error;
      }
      toast.success(`${ids.length} lead(s) excluído(s) com sucesso`);
      setSelected(new Set());
      onLeadsDeleted?.();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("Erro ao excluir leads");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Carregando...</p>;
  }

  if (leads.length === 0) {
    return <p className="text-muted-foreground text-center py-12">Nenhum lead cadastrado ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2 border border-border">
          <span className="text-sm text-muted-foreground">
            {selected.size} lead(s) selecionado(s)
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting} className="gap-1.5">
                <Trash2 className="h-4 w-4" />
                Excluir selecionados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir {selected.size} lead(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Os leads selecionados serão removidos permanentemente do sistema e do calendário.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      const input = el.querySelector('button');
                      if (input) input.dataset.indeterminate = someSelected ? 'true' : 'false';
                    }
                  }}
                  onCheckedChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Demonstração</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10">Fluxo</TableHead>
              <TableHead className="w-10">Ligar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className={selected.has(lead.id) ? "bg-muted/30" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(lead.id)}
                    onCheckedChange={() => toggleOne(lead.id)}
                    aria-label={`Selecionar ${lead.nome}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {lead.nome} {lead.sobrenome}
                </TableCell>
                <TableCell>{lead.empresa || "—"}</TableCell>
                <TableCell>
                  {lead.whatsapp ? (
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {lead.whatsapp}
                    </a>
                  ) : "—"}
                </TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>
                  {lead.data_reuniao && lead.horario_reuniao
                    ? `${lead.data_reuniao} às ${lead.horario_reuniao}`
                    : <span className="text-muted-foreground">Não agendou</span>}
                </TableCell>
                <TableCell>
                  {lead.prioridade ? (
                    <Badge className={PRIORITY_COLORS[lead.prioridade] || "bg-muted text-muted-foreground"}>
                      {lead.prioridade.split("—")[0].trim()}
                    </Badge>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={lead.status === "completo" ? "default" : "outline"}>
                    {lead.status === "completo" ? "Completo" : "Parcial"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <LeadFlowLogs leadId={lead.id} leadName={`${lead.nome} ${lead.sobrenome || ""}`} />
                </TableCell>
                <TableCell>
                  {lead.whatsapp && lead.data_reuniao && lead.horario_reuniao ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={callingLeadId === lead.id || lead.ligacao_confirmacao_enviada}
                      title={lead.ligacao_confirmacao_enviada ? "Ligação já enviada" : "Ligar para confirmar"}
                      onClick={() => handleConfirmationCall(lead.id, lead.nome)}
                    >
                      {callingLeadId === lead.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Phone className={`h-3.5 w-3.5 ${lead.ligacao_confirmacao_enviada ? "text-muted-foreground" : "text-primary"}`} />
                      )}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeadsTable;
