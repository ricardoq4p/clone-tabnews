import PrayerLayout from "@/components/prayer/Layout";
import PrivacyRequests from "@/components/prayer/PrivacyRequests";
export default function Privacidade() {
  return (
    <PrayerLayout title="Cuidado com seus dados">
      <article className="p-container p-document">
        <div className="p-page-head">
          <p className="p-eyebrow">CONFIANÇA TAMBÉM É CUIDADO</p>
          <h1>
            Sua oração merece respeito.
            <br />
            Sua privacidade, também.
          </h1>
          <p>Informações de privacidade · versão de 15 de outubro de 2026</p>
        </div>
        <h2>O que fica guardado</h2>
        <p>
          A conta utiliza nome, email, senha protegida por hash e, quando você
          escolhe, foto de perfil. Guardamos as partilhas, os comentários e a
          participação em comunidades que você registra. No Rosário, o ponto de
          retomada fica no navegador e, para quem entra na conta, pode ser salvo
          também na conta. O armazenamento local não é uma cópia de segurança
          permanente.
        </p>
        <h2>A visibilidade das intenções</h2>
        <ul>
          <li>
            <strong>Pública:</strong> texto e nome de apresentação podem ser
            vistos por quem visita a Capelinha.
          </li>
          <li>
            <strong>Anônima:</strong> o texto é público, mas a resposta pública
            não inclui seu nome, avatar ou vínculo com o perfil. A intenção
            continua vinculada à sua conta internamente.
          </li>
          <li>
            <strong>Privada:</strong> fica no seu histórico pessoal.
            Administradores autorizados podem acessá-la excepcionalmente para
            atendimento ou moderação, mediante motivo e registro de auditoria.
          </li>
        </ul>
        <p>
          Escolha com atenção. Mesmo sem um nome, o texto pode identificar
          alguém. Evite informações de saúde, nomes completos e dados de
          terceiros. Tornar privada uma intenção que já foi pública impede novas
          consultas públicas, mas não apaga cópias que outras pessoas possam ter
          guardado.
        </p>
        <h2>Sete dias de luz, um histórico pessoal</h2>
        <p>
          A vela deixa de aparecer na área pública depois de exatamente 168
          horas, contadas pelo servidor. Ela pode continuar no seu histórico,
          com a privacidade escolhida. Você pode retirar uma vela antes desse
          prazo e alterar sua visibilidade. Expirar ou retirar uma vela não
          significa excluir os dados do banco.
        </p>
        <h2>Serviços que apoiam esta casa</h2>
        <p>
          Utilizamos MongoDB para os registros, Brevo para emails de conta,
          Cloudinary para imagens enviadas e Pusher para avisos de atualização.
          Os novos avisos de tempo real não contêm textos das intenções. As
          ilustrações do Rosário são servidas pelo próprio site e as fontes
          tipográficas não exigem serviços externos.
        </p>
        <p>
          O assistente Pantera IA permanece disponível por menção nas partilhas
          públicas, quando sua integração estiver habilitada. Essa ação pode
          enviar o texto e o contexto público à integração de IA. O conteúdo
          canônico do Rosário não é gerado pela IA. O assistente não recebe
          intenções privadas da Capelinha nem conversas de comunidades privadas
          por esta funcionalidade.
        </p>
        <h2>Seus pedidos sobre dados</h2>
        <p>
          Você pode registrar um pedido de acesso, correção ou exclusão. A
          administração deve analisar a solicitação e as obrigações aplicáveis
          antes de efetuar qualquer exclusão. O registro do pedido não executa
          uma remoção automática.
        </p>
        <PrivacyRequests />
        <h2>Cuidados compartilhados</h2>
        <p>
          Use uma senha exclusiva e encerre sua sessão em aparelhos
          compartilhados. O progresso de visitante pode permanecer no navegador
          depois de fechar a página. Evite usar esse recurso em aparelhos que
          não sejam seus. Não publique dados de crianças ou pessoas vulneráveis
          em intenções abertas.
        </p>
      </article>
    </PrayerLayout>
  );
}
