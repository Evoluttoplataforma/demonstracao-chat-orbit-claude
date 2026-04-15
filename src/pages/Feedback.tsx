import { useState } from "react";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import orbitLogo from "@/assets/orbit-icon.png";

const Feedback = () => {
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wantsContact, setWantsContact] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, insira um email válido.");
      return;
    }
    if (rating === 0) {
      setError("Por favor, selecione uma nota.");
      return;
    }
    if (wantsContact === null) {
      setError("Por favor, responda se deseja contato de um vendedor.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("confirm-participation", {
        body: { email: email.trim().toLowerCase(), rating, comment: comment.trim(), deseja_contato_vendedor: wantsContact },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "Erro ao enviar feedback.");

      setSubmitted(true);
    } catch (err: any) {
      console.error("Feedback error:", err);
      setError(err.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Obrigado pelo feedback!</h1>
          <p className="text-muted-foreground">
            Sua avaliação foi registrada com sucesso. Agradecemos por participar da demonstração!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <img src={orbitLogo} alt="Orbit" className="h-10 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Como foi a demonstração?</h1>
          <p className="text-muted-foreground text-sm">
            Avalie sua experiência na apresentação do Orbit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Seu email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex h-12 w-full rounded-xl border border-input bg-secondary px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Nota para a apresentação</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "Ruim"}
                {rating === 2 && "Regular"}
                {rating === 3 && "Bom"}
                {rating === 4 && "Muito bom"}
                {rating === 5 && "Excelente!"}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Deseja contato de um vendedor?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWantsContact(true)}
                className={`flex-1 h-12 rounded-xl border-2 font-semibold transition-colors ${
                  wantsContact === true
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-secondary text-foreground hover:border-primary/50"
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setWantsContact(false)}
                className={`flex-1 h-12 rounded-xl border-2 font-semibold transition-colors ${
                  wantsContact === false
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-secondary text-foreground hover:border-primary/50"
                }`}
              >
                Não
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Comentário <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que achou da apresentação?"
              rows={3}
              maxLength={500}
              className="flex w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar avaliação"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
