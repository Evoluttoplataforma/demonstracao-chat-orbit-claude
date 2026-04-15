import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, XCircle, Clock } from "lucide-react";

type CallLog = {
  id: string;
  created_at: string;
  recipient_name: string | null;
  recipient_email: string; // stores phone
  success: boolean;
  resend_id: string | null; // stores Twilio SID
  error_message: string | null;
  lead_id: string | null;
};

type Period = "today" | "7d" | "30d";

const CallLogsTab = () => {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("today");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    let from: Date;
    if (period === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .eq("email_type", "ligacao_confirmacao")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching call logs:", error);
    setLogs((data as CallLog[]) || []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const successCount = logs.filter((l) => l.success).length;
  const failCount = logs.filter((l) => !l.success).length;
  const lastCall = logs[0];

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {(["today", "7d", "30d"] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === "today" ? "Hoje" : p === "7d" ? "7 dias" : "30 dias"}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase mb-1">
            <Phone className="h-3.5 w-3.5" /> Total
          </div>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase mb-1">
            <CheckCircle className="h-3.5 w-3.5" /> Sucesso
          </div>
          <p className="text-2xl font-bold text-primary">{successCount}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase mb-1">
            <XCircle className="h-3.5 w-3.5" /> Falha
          </div>
          <p className="text-2xl font-bold text-destructive">{failCount}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase mb-1">
            <Clock className="h-3.5 w-3.5" /> Taxa Sucesso
          </div>
          <p className="text-2xl font-bold text-foreground">
            {logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Last call info */}
      {lastCall && (
        <p className="text-sm text-muted-foreground">
          Última ligação: {lastCall.recipient_name || "—"} ({lastCall.recipient_email}) em{" "}
          {new Date(lastCall.created_at).toLocaleString("pt-BR")}
        </p>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma ligação encontrada no período.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Data/Hora</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Twilio SID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">{log.recipient_name || "—"}</td>
                  <td className="p-3 text-foreground font-mono text-xs">{log.recipient_email}</td>
                  <td className="p-3">
                    <Badge variant={log.success ? "default" : "destructive"}>
                      {log.success ? "Sucesso" : "Falha"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {log.resend_id ? log.resend_id.substring(0, 20) + "…" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CallLogsTab;
