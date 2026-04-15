import { useNavigate } from "react-router-dom";
import { Building2, Users, ArrowLeft } from "lucide-react";
import orbitLogo from "@/assets/orbit-icon.png";

interface SalaProfilePickerProps {
  title: string;
  subtitle: string;
  onSelect: (perfil: "empresas" | "consultores") => void;
}

export default function SalaProfilePicker({ title, subtitle, onSelect }: SalaProfilePickerProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/salas")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <img src={orbitLogo} alt="Orbit" className="h-8" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-10 py-16">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => onSelect("empresas")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Sou Empresa</h2>
                  <p className="text-sm text-muted-foreground">Uso o Orbit para gerenciar minha própria operação</p>
                </div>
                <div className="text-sm font-semibold text-primary">Continuar →</div>
              </div>
            </button>

            <button
              onClick={() => onSelect("consultores")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Sou Consultor</h2>
                  <p className="text-sm text-muted-foreground">Implemento o Orbit nos meus clientes</p>
                </div>
                <div className="text-sm font-semibold text-primary">Continuar →</div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
