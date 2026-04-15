import { Rocket } from "lucide-react";
import SalaCategoryPage from "@/components/salas/SalaCategoryPage";

export default function SalasOnboarding() {
  return (
    <SalaCategoryPage
      categoria="treinamento_inicial"
      title="Treinamento Inicial do Orbit"
      subtitle="Sessão EM GRUPO para fazer o treinamento inicial de utilização do Orbit."
      description="Nas sessões de treinamento inicial, nossa equipe te guia no uso da plataforma, mostrando as principais funcionalidades, fluxos e boas práticas para você começar a operar com confiança. Cada sessão é realizada ao vivo por videoconferência."
      icon={<Rocket className="h-7 w-7 text-primary" />}
    />
  );
}
