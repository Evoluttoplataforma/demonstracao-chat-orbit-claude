import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FlowLog {
  id: string;
  created_at: string;
  flow_name: string;
  step_name: string;
  message_preview: string | null;
}

interface LeadFlowLogsProps {
  leadId: string;
  leadName: string;
}

const LeadFlowLogs = ({ leadId, leadName }: LeadFlowLogsProps) => {
  const [logs, setLogs] = useState<FlowLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("manychat_flow_logs")
      .select("id, created_at, flow_name, step_name, message_preview")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to load flow logs", error);
        setLogs((data as FlowLog[]) || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, leadId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Histórico ManyChat">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico ManyChat — {leadName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-muted-foreground text-sm py-4">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">Nenhum registro de fluxo encontrado.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs">{log.flow_name}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{log.step_name}</p>
                {log.message_preview && (
                  <p className="text-xs text-muted-foreground italic">{log.message_preview}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadFlowLogs;
