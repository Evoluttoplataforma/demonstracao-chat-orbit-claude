import { Radio } from "lucide-react";
import SalaCategoryPage from "@/components/salas/SalaCategoryPage";

export default function SalasAtivacaoCanal() {
  return (
    <SalaCategoryPage
      categoria="ativacao_canal"
      title="Ativação Canal"
      subtitle="Sessão EM GRUPO para entender o modelo de negócio de canal, fazer as Personalizações do seu canal, configurar seu gateway de pagamento, criar seus agentes de implantação."
      description="Nesta sessão em grupo, você aprenderá a configurar seu canal do zero: entender o modelo de negócio, personalizar sua operação, configurar o gateway de pagamento e criar seus agentes de implantação."
      icon={<Radio className="h-7 w-7 text-primary" />}
      prerequisite={
        <div>
          <p className="font-semibold mb-1">⚠️ Pré-requisito</p>
          <p>
            Antes da sessão, é necessário configurar o Stripe.{" "}
            <a
              href="https://docs.stripe.com/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline hover:text-primary/80"
            >
              Veja o passo a passo aqui →
            </a>
          </p>
        </div>
      }
    />
  );
}
