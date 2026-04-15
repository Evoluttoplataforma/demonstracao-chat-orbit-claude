import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
          Política de Privacidade
        </h1>
        <p className="text-muted-foreground mb-12">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="space-y-10 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:mt-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-foreground">
          <section>
            <h2>1. Introdução</h2>
            <p>
              A Orbit ("nós", "nosso" ou "Orbit") opera a plataforma de gestão empresarial disponível em{" "}
              <strong>orbitgestaolead.lovable.app</strong> e serviços relacionados. Esta Política de Privacidade
              descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando
              você utiliza nossos serviços.
            </p>
            <p>
              Ao utilizar a plataforma Orbit, você concorda com as práticas descritas nesta política.
              Recomendamos a leitura completa deste documento.
            </p>
          </section>

          <section>
            <h2>2. Dados que Coletamos</h2>
            <p>Coletamos as seguintes categorias de informações:</p>
            <ul>
              <li><strong>Dados de identificação:</strong> nome, sobrenome, e-mail e número de WhatsApp fornecidos durante o cadastro ou agendamento de demonstração.</li>
              <li><strong>Dados empresariais:</strong> nome da empresa, segmento de atuação, cargo, faturamento mensal estimado e número de funcionários.</li>
              <li><strong>Dados de uso:</strong> informações sobre como você interage com nossa plataforma, incluindo páginas visitadas, cliques, tempo de sessão e dispositivo utilizado.</li>
              <li><strong>Dados de comunicação:</strong> conteúdo de mensagens trocadas via chat ou WhatsApp com nossa equipe.</li>
              <li><strong>Cookies e tecnologias similares:</strong> utilizamos cookies para melhorar a experiência, personalizar conteúdo e analisar o tráfego do site.</li>
            </ul>
          </section>

          <section>
            <h2>3. Como Utilizamos seus Dados</h2>
            <p>Utilizamos seus dados pessoais para:</p>
            <ul>
              <li>Fornecer, manter e melhorar nossos serviços de gestão empresarial.</li>
              <li>Personalizar sua experiência na plataforma.</li>
              <li>Processar agendamentos de demonstrações e reuniões.</li>
              <li>Enviar comunicações relevantes sobre nossos serviços, atualizações e novidades.</li>
              <li>Realizar análises internas para aprimorar nossos produtos.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2>4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou negociamos seus dados pessoais. Podemos compartilhar informações
              com terceiros apenas nas seguintes situações:
            </p>
            <ul>
              <li><strong>Prestadores de serviço:</strong> empresas que nos auxiliam na operação da plataforma (hospedagem, análise de dados, CRM), sempre sob obrigações de confidencialidade.</li>
              <li><strong>Exigência legal:</strong> quando necessário para cumprir ordens judiciais, regulamentações ou solicitações de autoridades competentes.</li>
              <li><strong>Proteção de direitos:</strong> para proteger os direitos, propriedade ou segurança da Orbit, de nossos usuários ou do público.</li>
              <li><strong>Com seu consentimento:</strong> em situações específicas onde solicitaremos sua autorização prévia.</li>
            </ul>
          </section>

          <section>
            <h2>5. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS/SSL) e em
              repouso. Implementamos medidas técnicas e organizacionais para proteger suas informações contra
              acesso não autorizado, alteração, divulgação ou destruição.
            </p>
            <p>
              Retemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política
              ou conforme exigido por lei. Após esse período, os dados são excluídos ou anonimizados de forma segura.
            </p>
          </section>

          <section>
            <h2>6. Seus Direitos (LGPD)</h2>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
            </p>
            <ul>
              <li>Confirmar a existência de tratamento de dados pessoais.</li>
              <li>Acessar seus dados pessoais.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Solicitar a portabilidade dos dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Obter informações sobre o compartilhamento de dados com terceiros.</li>
            </ul>
            <p>
              Para exercer qualquer destes direitos, entre em contato pelo e-mail{" "}
              <strong>privacidade@orbitsistemas.com.br</strong> ou pelo WhatsApp (48) 99120-6282.
            </p>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para
              entender como você utiliza nossos serviços. Você pode gerenciar as preferências de cookies
              nas configurações do seu navegador. A desativação de cookies essenciais pode impactar a
              funcionalidade da plataforma.
            </p>
          </section>

          <section>
            <h2>8. Alterações nesta Política</h2>
            <p>
              Reservamo-nos o direito de atualizar esta Política de Privacidade periodicamente.
              Notificaremos sobre alterações significativas por meio da plataforma ou por e-mail.
              A data da última atualização será sempre indicada no topo do documento.
            </p>
          </section>

          <section>
            <h2>9. Contato</h2>
            <p>
              Para dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade,
              entre em contato:
            </p>
            <ul>
              <li><strong>E-mail:</strong> privacidade@orbitsistemas.com.br</li>
              <li><strong>WhatsApp:</strong> (48) 99120-6282</li>
              <li><strong>Endereço:</strong> Square SC - Rod. José Carlos Daux, 5500 — Saco Grande, Florianópolis - SC, 88032-005</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
