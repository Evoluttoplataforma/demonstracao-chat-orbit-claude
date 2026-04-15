import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RescheduleDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leadName, setLeadName] = useState("");

  const handleGenerate = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Digite o e-mail do lead");
      return;
    }

    setLoading(true);
    setGeneratedLink(null);

    // Find lead by email
    const { data: lead, error } = await supabase
      .from("leads")
      .select("id, nome, reschedule_token")
      .eq("email", trimmed)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !lead) {
      toast.error("Lead não encontrado com esse e-mail");
      setLoading(false);
      return;
    }

    // Generate token if doesn't exist
    let token = lead.reschedule_token;
    if (!token) {
      token = crypto.randomUUID();
      const { error: updateError } = await supabase
        .from("leads")
        .update({ reschedule_token: token })
        .eq("id", lead.id);

      if (updateError) {
        toast.error("Erro ao gerar link");
        setLoading(false);
        return;
      }
    }

    const baseUrl = window.location.origin;
    setGeneratedLink(`${baseUrl}/reagendar/${token}`);
    setLeadName(lead.nome);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setGeneratedLink(null);
    setCopied(false);
    setLeadName("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Link2 className="h-4 w-4" />
          Reagendar Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar link de reagendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">E-mail do lead</label>
            <div className="flex gap-2">
              <Input
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
              </Button>
            </div>
          </div>

          {generatedLink && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-muted-foreground">
                Link para <strong>{leadName}</strong>:
              </p>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
