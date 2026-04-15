import { useState } from "react";
import { HelpCircle } from "lucide-react";
import SalaCategoryPage from "@/components/salas/SalaCategoryPage";
import SalaProfilePicker from "@/components/salas/SalaProfilePicker";

export default function SalasTiraDuvidas() {
  const [perfil, setPerfil] = useState<"empresas" | "consultores" | null>(null);

  if (!perfil) {
    return (
      <SalaProfilePicker
        title="Tira-Dúvidas Orbit"
        subtitle="Selecione seu perfil para agendar sua sessão de tira-dúvidas."
        onSelect={setPerfil}
      />
    );
  }

  const isEmpresa = perfil === "empresas";

  return (
    <SalaCategoryPage
      categoria={isEmpresa ? "tira_duvidas_empresas" : "tira_duvidas_consultores"}
      title={isEmpresa ? "Tira-Dúvidas Empresas" : "Tira-Dúvidas Consultores"}
      subtitle={isEmpresa
        ? "Resolva suas dúvidas ao vivo com nosso time de especialistas."
        : "Suporte ao vivo para consultores que implementam o Orbit."
      }
      description={isEmpresa
        ? "As sessões de tira-dúvidas são abertas para empresas clientes do Orbit. Traga suas perguntas sobre funcionalidades, configurações, integrações ou boas práticas. Sessões ao vivo por videoconferência com duração de 1 hora."
        : "Sessões dedicadas para consultores tirarem dúvidas sobre implementação, configurações avançadas e boas práticas do Orbit. Sessões ao vivo por videoconferência com duração de 1 hora."
      }
      icon={<HelpCircle className="h-7 w-7 text-primary" />}
      onBack={() => setPerfil(null)}
    />
  );
}
