import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailLog {
  id: string;
  created_at: string;
  email_type: string;
  recipient_email: string;
  recipient_name: string | null;
  resend_id: string | null;
  success: boolean;
  error_message: string | null;
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
  convite_agendamento: "📅 Convite de Agendamento",
  lembrete_reuniao: "⏰ Lembrete de Reunião",
};

const EmailsTab = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const startOfDay = `${selectedDate}T00:00:00.000Z`;
    const endOfDay = `${selectedDate}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching email logs:", error);
    }
    setLogs((data as EmailLog[]) || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Group by type
  const grouped = logs.reduce<Record<string, EmailLog[]>>((acc, log) => {
    const key = log.email_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const totalSent = logs.filter((l) => l.success).length;
  const totalFailed = logs.filter((l) => !l.success).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-card border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
          />
          <Button variant="ghost" size="icon" onClick={fetchLogs} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs uppercase">Total Enviados</p>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs uppercase flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" /> Sucesso
          </p>
          <p className="text-2xl font-bold text-green-500">{totalSent}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs uppercase flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" /> Falhas
          </p>
          <p className="text-2xl font-bold text-destructive">{totalFailed}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-xs uppercase">Tipos</p>
          <p className="text-2xl font-bold text-foreground">{Object.keys(grouped).length}</p>
        </div>
      </div>

      {/* Grouped by type */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum e-mail enviado nesta data.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-semibold text-foreground">
                  {EMAIL_TYPE_LABELS[type] || type}
                </h3>
                <span className="text-sm text-muted-foreground font-medium">
                  {items.length} {items.length === 1 ? "e-mail" : "e-mails"}
                </span>
              </div>
              <div className="divide-y divide-border">
                {items.map((log) => (
                  <div key={log.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      {log.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-foreground font-medium truncate">
                          {log.recipient_name || log.recipient_email}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {log.recipient_email}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs whitespace-nowrap ml-3">
                      {new Date(log.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailsTab;
