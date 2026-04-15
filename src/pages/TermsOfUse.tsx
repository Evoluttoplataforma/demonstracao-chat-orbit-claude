import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Termos de Uso
        </h1>
        <p className="text-muted-foreground mb-12">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="space-y-10 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:mt-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_strong]:text-foreground">
          <section>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar a plataforma Orbit ("Serviço"), operada pela Orbit Sistemas ("Orbit",
              "nós" ou "nosso"), você concorda em cumprir e ficar vinculado a estes Termos de Uso.
              Se você não concorda com qualquer parte destes termos, não deve utilizar o Serviço.
            </p>
            <p>
              Estes Termos constituem um acordo legal entre você ("Usuário") e a Orbit, aplicável a
              todo o uso da plataforma, incluindo demonstrações gratuitas, agendamentos e funcionalidades de gestão.
            </p>
          </section>

          <section>
            <h2>2. Descrição do Serviço</h2>
            <p>
              A Orbit é uma plataforma de gestão empresarial que oferece ferramentas de organização de processos,
              consultoria automatizada via IA, dashboards executivos, integrações com WhatsApp e outras
              funcionalidades voltadas à melhoria da operação de empresas de todos os portes e segmentos.
            </p>
          </section>

          <section>
            <h2>3. Elegibilidade</h2>
            <p>Para utilizar o Serviço, você deve:</p>
            <ul>
              <li>Ter pelo menos 18 anos de idade ou a maioridade legal em sua jurisdição.</li>
              <li>Ter autoridade para vincular a empresa que você representa, quando aplicável.</li>
              <li>Fornecer informações verdadeiras, completas e atualizadas durante o cadastro.</li>
            </ul>
          </section>

          <section>
            <h2>4. Cadastro e Conta</h2>
            <p>
              Ao se cadastrar na plataforma ou agendar uma demonstração, você é responsável por
              manter a confidencialidade de suas credenciais de acesso. Você concorda em:
            </p>
            <ul>
              <li>Não compartilhar suas credenciais com terceiros.</li>
              <li>Notificar imediatamente a Orbit sobre qualquer uso não autorizado de sua conta.</li>
              <li>Manter seus dados cadastrais atualizados.</li>
            </ul>
            <p>
              A Orbit reserva-se o direito de suspender ou encerrar contas que violem estes termos
              ou que apresentem atividades suspeitas.
            </p>
          </section>

          <section>
            <h2>5. Uso Aceitável</h2>
            <p>Ao utilizar a plataforma Orbit, você concorda em não:</p>
            <ul>
              <li>Utilizar o Serviço para fins ilegais ou não autorizados.</li>
              <li>Tentar acessar áreas restritas do sistema sem autorização.</li>
              <li>Transmitir vírus, malware ou código malicioso.</li>
              <li>Interferir no funcionamento da plataforma ou de seus servidores.</li>
              <li>Reproduzir, copiar, vender ou revender qualquer parte do Serviço sem autorização expressa.</li>
              <li>Utilizar bots, scrapers ou ferramentas automatizadas para acessar o Serviço sem autorização.</li>
              <li>Fornecer informações falsas ou enganosas.</li>
            </ul>
          </section>

          <section>
            <h2>6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, design, código, logos, marcas, textos e materiais disponíveis na
              plataforma Orbit são de propriedade exclusiva da Orbit ou de seus licenciadores e
              estão protegidos por leis de propriedade intelectual brasileiras e internacionais.
            </p>
            <p>
              Você recebe uma licença limitada, não exclusiva e intransferível para acessar e utilizar
              o Serviço conforme estes Termos. Esta licença não inclui o direito de modificar, distribuir,
              vender ou criar obras derivadas a partir do Serviço.
            </p>
          </section>

          <section>
            <h2>7. Demonstrações e Agendamentos</h2>
            <p>
              Ao agendar uma demonstração gratuita através da plataforma, você concorda em:
            </p>
            <ul>
              <li>Comparecer no horário agendado ou comunicar cancelamento com antecedência.</li>
              <li>Fornecer informações verdadeiras sobre sua empresa para personalização da demonstração.</li>
              <li>Entender que a demonstração não constitui obrigação de contratação.</li>
            </ul>
            <p>
              A Orbit reserva-se o direito de reagendar ou cancelar demonstrações em casos excepcionais,
              com aviso prévio ao usuário.
            </p>
          </section>

          <section>
            <h2>8. Limitação de Responsabilidade</h2>
            <p>
              Na extensão máxima permitida por lei, a Orbit não será responsável por:
            </p>
            <ul>
              <li>Danos indiretos, incidentais, especiais ou consequenciais decorrentes do uso ou impossibilidade de uso do Serviço.</li>
              <li>Perda de dados, lucros cessantes ou interrupção de negócios.</li>
              <li>Ações de terceiros relacionadas ao uso da plataforma.</li>
              <li>Indisponibilidades temporárias causadas por manutenção, atualizações ou eventos de força maior.</li>
            </ul>
            <p>
              O Serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer natureza,
              expressas ou implícitas.
            </p>
          </section>

          <section>
            <h2>9. Indenização</h2>
            <p>
              Você concorda em indenizar e isentar a Orbit, seus diretores, funcionários e parceiros de
              quaisquer reclamações, perdas, danos, custos e despesas (incluindo honorários advocatícios)
              decorrentes do uso indevido do Serviço ou da violação destes Termos.
            </p>
          </section>

          <section>
            <h2>10. Alterações nos Termos</h2>
            <p>
              A Orbit pode modificar estes Termos a qualquer momento. Alterações significativas serão
              comunicadas por meio da plataforma ou por e-mail. O uso continuado do Serviço após a
              publicação de alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2>11. Rescisão</h2>
            <p>
              A Orbit pode suspender ou encerrar seu acesso ao Serviço, a qualquer momento e sem aviso
              prévio, caso você viole estes Termos. Em caso de rescisão, as cláusulas referentes a
              propriedade intelectual, limitação de responsabilidade e indenização permanecerão em vigor.
            </p>
          </section>

          <section>
            <h2>12. Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas
              serão submetidas ao foro da comarca de Florianópolis - SC, com renúncia a qualquer outro,
              por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2>13. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <ul>
              <li><strong>E-mail:</strong> contato@orbitsistemas.com.br</li>
              <li><strong>WhatsApp:</strong> (48) 99120-6282</li>
              <li><strong>Endereço:</strong> Square SC - Rod. José Carlos Daux, 5500 — Saco Grande, Florianópolis - SC, 88032-005</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
