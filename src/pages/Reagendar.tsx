import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import orbitLogo from "@/assets/orbit-icon.png";
import { getMeetingLink } from "@/lib/meeting-link";
import CalendarPicker from "@/components/chat/CalendarPicker";
import ConfirmationScreen from "@/components/chat/ConfirmationScreen";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import execGabriel from "@/assets/exec-gabriel.png";
import execGisele from "@/assets/exec-gisele.png";
import execPedro from "@/assets/exec-pedro.png";
import execThayane from "@/assets/exec-thayane.png";

const EXECUTIVES: Record<string, { nome: string; foto: string; whatsapp: string }> = {
  gabriel: { nome: "Gabriel Carvente", foto: execGabriel, whatsapp: "5511971999192" },
  gisele: { nome: "Gisele Ferrarezi", foto: execGisele, whatsapp: "5548991206282" },
  pedro: { nome: "Pedro", foto: execPedro, whatsapp: "5548996934524" },
  thayane: { nome: "Thayane Torbis", foto: execThayane, whatsapp: "5548996934515" },
};

function matchExecutive(ownerName: string) {
  const lower = ownerName.toLowerCase();
  for (const [key, exec] of Object.entries(EXECUTIVES)) {
    if (lower.includes(key)) return exec;
  }
  return null;
}

interface LeadData {
  id: string;
  nome: string;
  sobrenome: string | null;
  email: string;
  empresa: string;
  cargo: string | null;
  oque_faz: string | null;
  whatsapp: string;
  faturamento: string | null;
  funcionarios: string | null;
  prioridade: string | null;
  software_gestao: string | null;
  pipedrive_deal_id: number | null;
  pipedrive_person_id: number | null;
  pipedrive_org_id: number | null;
  data_reuniao: string | null;
  horario_reuniao: string | null;
}

const Reagendar = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<LeadData | null>(null);
  const [success, setSuccess] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [showVendedor, setShowVendedor] = useState(false);
  const [loadingExec, setLoadingExec] = useState(false);
  const [matchedExec, setMatchedExec] = useState<{ nome: string; foto: string; whatsapp: string } | null>(null);

  const handleSearch = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Digite seu e-mail");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, nome, sobrenome, email, empresa, cargo, oque_faz, whatsapp, faturamento, funcionarios, prioridade, software_gestao, pipedrive_deal_id, pipedrive_person_id, pipedrive_org_id, data_reuniao, horario_reuniao, manychat_subscriber_id")
      .eq("email", trimmed)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error("E-mail não encontrado. Verifique e tente novamente.");
      setLoading(false);
      return;
    }

    setLead(data);
    setLoading(false);
  };

  const handleSelect = async (date: string, time: string) => {
    if (!lead) return;

    // Add "EM GRUPO" label when lead confirms time slot
    if (lead.pipedrive_deal_id) {
      supabase.functions.invoke("create-pipedrive-lead", {
        body: { action: "add_label", deal_id: lead.pipedrive_deal_id, label_name: "EM GRUPO", label_color: "blue" },
      }).catch((e) => console.error("[Reagendar] Failed to add EM GRUPO label:", e));
    }

    setNewDate(date);
    setNewTime(time);

    const meetLink = getMeetingLink(lead.faturamento || "", lead.cargo || "", lead.oque_faz || "");

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        data_reuniao: date,
        horario_reuniao: time,
        status: "completo",
        ligacao_agendada: true,
        link_reuniao: meetLink,
      })
      .eq("id", lead.id);

    if (updateError) console.error("Failed to update lead:", updateError);

    if (lead.pipedrive_deal_id) {
      try {
        await supabase.functions.invoke("create-pipedrive-lead", {
          body: {
            action: "reschedule",
            deal_id: lead.pipedrive_deal_id,
            person_id: lead.pipedrive_person_id,
            org_id: lead.pipedrive_org_id,
            date,
            time,
            name: `${lead.nome} ${lead.sobrenome || ""}`.trim(),
          },
        });
      } catch (e) {
        console.error("Failed to update Pipedrive:", e);
      }
    }
    // Send calendar invite email
    try {
      await supabase.functions.invoke("send-calendar-invite", {
        body: {
          email: lead.email,
          name: `${lead.nome} ${lead.sobrenome || ""}`.trim(),
          date,
          time,
          meetingLink: meetLink,
        },
      });
      console.log("[Reagendar] Calendar invite sent to:", lead.email);
    } catch (e) {
      console.error("[Reagendar] Failed to send calendar invite:", e);
    }

    // Tag lead in ManyChat as "agendou-reuniao"
    try {
      await supabase.functions.invoke("tag-manychat", {
        body: {
          action: "tag",
          whatsapp: lead.whatsapp,
          tag_name: "agendou-reuniao",
          lead_data: {
            nome: lead.nome,
            sobrenome: lead.sobrenome,
            email: lead.email,
            empresa: lead.empresa,
            oque_faz: lead.oque_faz,
            cargo: lead.cargo,
            faturamento: lead.faturamento,
            funcionarios: lead.funcionarios,
            prioridade: lead.prioridade,
            data_reuniao: date,
            horario_reuniao: time,
            software_gestao: lead.software_gestao,
          },
        },
      });
      console.log("[Reagendar] ManyChat tag 'agendou-reuniao' applied");
    } catch (e) {
      console.error("[Reagendar] Failed to tag ManyChat:", e);
    }

    // Disparar webhook n8n via Edge Function
    try {
      const [dd, mm, yyyy] = date.split("/");
      const callDatetime = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time}:00-03:00`;
      const phone = lead.whatsapp.startsWith("+") ? lead.whatsapp : `+55${lead.whatsapp.replace(/\D/g, "")}`;
      const { data: n8nResult, error: n8nError } = await supabase.functions.invoke("trigger-n8n-call", {
        body: {
          lead_name: `${lead.nome} ${lead.sobrenome || ""}`.trim(),
          lead_phone: phone,
          call_datetime: callDatetime,
          subscriber_id: (lead as any).manychat_subscriber_id || null,
          deal_id: lead.pipedrive_deal_id || null,
        },
      });
      if (n8nError || !n8nResult?.ok) {
        console.error("[Reagendar] n8n trigger failed:", n8nError || n8nResult);
      } else {
        console.log("[Reagendar] n8n webhook disparado com sucesso:", n8nResult);
      }
    } catch (e) {
      console.error("[Reagendar] Falha ao disparar n8n edge function:", e);
    }

    setSuccess(true);
  };

  const handleRequestExecutive = async () => {
    if (!lead) return;
    // Update lead in DB
    await supabase.from("leads").update({ deseja_contato_vendedor: true }).eq("id", lead.id);

    // Add DIRETO EXECUTIVO label
    if (lead.pipedrive_deal_id) {
      supabase.functions.invoke("create-pipedrive-lead", {
        body: { action: "add_label", deal_id: lead.pipedrive_deal_id, label_name: "DIRETO EXECUTIVO", label_color: "green" },
      }).catch((e) => console.error("[Reagendar] Failed to add DIRETO EXECUTIVO label:", e));
    }

    setLoadingExec(true);
    setShowVendedor(true);

    try {
      if (lead.pipedrive_deal_id) {
        const { data: assignResult } = await supabase.functions.invoke("assign-pipedrive-owner", {
          body: { deal_id: lead.pipedrive_deal_id, flow: "vendedor" },
        });
        if (assignResult?.assigned_user?.name) {
          const exec = matchExecutive(assignResult.assigned_user.name);
          if (exec) setMatchedExec(exec);
        }
        supabase.functions.invoke("get-pipedrive-owners", {
          body: {
            leads: [],
            add_note: {
              deal_id: lead.pipedrive_deal_id,
              content: `<b>📞 Lead solicitou contato com executivo (reagendamento)</b><br><br>O lead não encontrou um horário adequado e optou por falar diretamente com um executivo.`,
            },
          },
        }).catch((e) => console.error("[Reagendar] Failed to add Pipedrive note:", e));
        supabase.functions.invoke("tag-manychat", {
          body: {
            action: "tag",
            whatsapp: lead.whatsapp,
            tag_name: "foi-falar-com-vendedor",
            lead_data: { nome: lead.nome, sobrenome: lead.sobrenome, email: lead.email },
          },
        }).catch((e) => console.error("[Reagendar] Failed to tag ManyChat:", e));
      }
    } catch (e) {
      console.error("[Reagendar] Failed to assign executive:", e);
    } finally {
      setLoadingExec(false);
    }
  };

  if (showVendedor) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={orbitLogo} alt="Orbit Gestão" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold text-foreground tracking-tight">Orbit Gestão</span>
          </div>
          <div className="text-center space-y-6 animate-fade-in-up">
            {loadingExec ? (
              <p className="text-muted-foreground">Localizando seu executivo...</p>
            ) : matchedExec ? (
              <>
                <img
                  src={matchedExec.foto}
                  alt={matchedExec.nome}
                  className="w-28 h-28 rounded-full object-cover object-top mx-auto border-4 border-primary/20 shadow-lg"
                />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {lead?.nome}, seu executivo é
                  </h2>
                  <p className="text-2xl font-bold text-primary mt-1">{matchedExec.nome}</p>
                </div>
                <a
                  href={`https://wa.me/${matchedExec.whatsapp}?text=${encodeURIComponent(`Olá ${matchedExec.nome.split(" ")[0]}, sou ${lead?.nome} ${lead?.sobrenome || ""} da ${lead?.empresa}. Gostaria de saber mais sobre o Orbit!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base shadow-md"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.462-1.494A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.724-6.022-1.95l-.422-.316-2.644.885.886-2.638-.346-.45A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  Fale agora com {matchedExec.nome.split(" ")[0]}
                </a>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">🤝</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {lead?.nome}, seu contato foi registrado!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Um dos nossos executivos comerciais vai entrar em contato com você em breve pelo WhatsApp.
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground">Fique de olho no seu WhatsApp! 📱</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={orbitLogo} alt="Orbit Gestão" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold text-foreground tracking-tight">Orbit Gestão</span>
          </div>
          <ConfirmationScreen name={lead?.nome || ""} date={newDate} time={newTime} meetingLink={getMeetingLink(lead?.faturamento || "", lead?.cargo || "", lead?.oque_faz || "")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-center gap-3">
          <img src={orbitLogo} alt="Orbit Gestão" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold text-foreground tracking-tight">Orbit Gestão</span>
        </div>

        {!lead ? (
          <>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                Imprevistos acontecem, nós entendemos! 😉
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sem estresse — escolha um novo horário e venha participar da{" "}
                <span className="font-semibold text-primary">melhor reunião da sua semana</span>.
                <br />
                Em 30 minutos você vai descobrir como o{" "}
                <span className="font-semibold text-foreground">Orbit</span> transforma a gestão da sua empresa.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Digite seu e-mail para reagendar</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    type="email"
                  />
                  <Button onClick={handleSearch} disabled={loading} className="shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Orbit Gestão · Transformando empresas com IA
            </p>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Olá, {lead.nome}! 👋</h1>
              <p className="text-muted-foreground text-sm">
                Escolha o melhor horário para a demonstração mais produtiva da sua semana
              </p>
              {lead.data_reuniao && lead.horario_reuniao && (
                <p className="text-xs text-muted-foreground">
                  Horário anterior: {lead.data_reuniao} às {lead.horario_reuniao}
                </p>
              )}
            </div>
            <CalendarPicker onSelect={handleSelect} onRequestExecutive={handleRequestExecutive} segmento={lead.oque_faz || ""} cargo={lead.cargo || ""} faturamento={lead.faturamento || ""} />
          </>
        )}
      </div>
    </div>
  );
};

export default Reagendar;
