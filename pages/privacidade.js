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
        <h2>Quem cuida dos seus dados</h2>
        <p>
          Ricardo A Santos é o responsável pelo PanteraLab. Para dúvidas,
          solicitações sobre dados ou para retirar seu consentimento, escreva
          para <a href="mailto:ricardo.q4p@gmail.com">ricardo.q4p@gmail.com</a>.
          Você também pode registrar um pedido pela sua conta, abaixo.
        </p>
        <h2>Por que usamos essas informações</h2>
        <p>
          Os dados de conta permitem identificar você, proteger o acesso e
          guardar seu progresso. Publicações e intenções são usadas para
          oferecer a comunidade e os recursos de oração que você escolhe
          utilizar. Registros de segurança e moderação ajudam a prevenir abusos
          e a proteger informações privadas.
        </p>
        <p>
          Intenções podem revelar convicção religiosa ou informações sensíveis.
          Compartilhar uma intenção é opcional: você pode rezar o Rosário sem
          publicar nada. Ao apresentar uma intenção, pedimos sua autorização
          específica para guardá-la e mostrá-la conforme a visibilidade
          escolhida. Não inclua dados de terceiros sem autorização nem dados
          pessoais de crianças. Você pode retirar a intenção da área pública e
          solicitar exclusão ou revogação pelo contato acima.
        </p>
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
          com a privacidade escolhida. Para novas intenções desta versão, a
          retenção é de 90 dias após a expiração; a eliminação ocorre em rotina
          diária posterior a esse prazo. A eliminação também pode ser solicitada
          antes disso pelo contato do responsável. Você pode retirar uma vela
          antes desse prazo e alterar sua visibilidade. Expirar ou retirar uma
          vela não significa excluir os dados do banco.
        </p>
        <h2>Cookies e armazenamento no aparelho</h2>
        <p>
          O login utiliza cookies de sessão e proteção contra requisições
          indevidas. O progresso de oração pode ficar no armazenamento local do
          seu navegador. Você pode apagá-lo pelas configurações do navegador, o
          que também pode remover sua retomada local.
        </p>
        <h2>Serviços que apoiam esta casa</h2>
        <p>
          A hospedagem utiliza Vercel e os registros ficam no MongoDB Atlas.
          Brevo para emails, Cloudinary para imagens e Pusher para avisos de
          atualização são integrações opcionais, usadas somente quando
          habilitadas. O envio de emails de conta e de novas imagens pode ficar
          indisponível até a validação desses serviços. Os novos avisos de tempo
          real não contêm textos das intenções. As ilustrações do Rosário são
          servidas pelo próprio site e as fontes tipográficas não exigem
          serviços externos.
        </p>
        <p>
          O assistente Pantera IA permanece disponível por menção nas partilhas
          públicas, quando sua integração estiver habilitada. Essa ação pode
          enviar o texto e o contexto público à integração de IA. O conteúdo
          canônico do Rosário não é gerado pela IA. O assistente não recebe
          intenções privadas da Capelinha nem conversas de comunidades privadas
          por esta funcionalidade. O assistente permanece desligado em produção
          até sua habilitação específica.
        </p>
        <p>
          Os provedores podem processar dados em infraestrutura fora do Brasil,
          conforme os serviços habilitados. Não envie informações sensíveis a
          integrações opcionais sem compreender sua finalidade. O contato do
          responsável está disponível para esclarecer quais fornecedores estão
          ativos e atender pedidos relativos a esses dados.
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
