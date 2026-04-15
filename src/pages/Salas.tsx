import { useNavigate } from "react-router-dom";
import { Rocket, HelpCircle, Radio } from "lucide-react";
import orbitLogo from "@/assets/orbit-icon.png";

export default function Salas() {
  const navigate = useNavigate();

  const cards = [
    {
      to: "/salas/onboarding",
      icon: <Rocket className="h-7 w-7 text-primary" />,
      title: "Treinamento Inicial do Orbit",
      desc: "Sessão em grupo para fazer o treinamento inicial de utilização do Orbit",
    },
    {
      to: "/salas/ativacao-canal",
      icon: <Radio className="h-7 w-7 text-primary" />,
      title: "Ativação Canal",
      desc: "Sessão em grupo para configurar seu canal, gateway de pagamento e agentes de implantação",
      badge: "Exclusivo para Consultores",
    },
    {
      to: "/salas/tira-duvidas",
      icon: <HelpCircle className="h-7 w-7 text-primary" />,
      title: "Quero tirar dúvidas",
      desc: "Sessões ao vivo para resolver dúvidas e receber suporte",
    },
  ];

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={orbitLogo} alt="Orbit" className="h-8" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl w-full text-center space-y-10 py-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium">
              ✨ Área exclusiva para clientes
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
              Bem-vindo ao <span className="text-primary">Orbit</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Estamos aqui para te ajudar a aproveitar ao máximo a plataforma. Escolha como podemos te atender:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {cards.map((card) => (
              <button
                key={card.to}
                onClick={() => navigate(card.to)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-foreground">{card.title}</h2>
                    </div>
                    {card.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 mb-2">
                        {card.badge}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground">{card.desc}</p>
                  </div>
                  <div className="text-sm font-semibold text-primary flex items-center gap-1">Agendar sessão →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Ainda não é cliente?{" "}
          <a href="https://demonstracao.orbitgestao.com.br/" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
            Clique aqui
          </a>
        </p>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Orbit Gestão · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
