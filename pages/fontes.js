import PrayerLayout from "@/components/prayer/Layout";
import { CONTENT_SOURCES, MYSTERY_SETS } from "@/lib/rosary/content";
export default function Fontes() {
  return (
    <PrayerLayout title="Fontes e créditos">
      <article className="p-container p-document">
        <div className="p-page-head">
          <p className="p-eyebrow">TRADIÇÃO, BELEZA E RESPONSABILIDADE</p>
          <h1>
            O que inspira
            <br />
            este lugar de oração.
          </h1>
        </div>
        <h2>O Santo Rosário</h2>
        <p>
          A organização dos mistérios e a estrutura das dezenas seguem a
          apresentação do Santo Rosário pela Santa Sé. O roteiro inclui orações
          tradicionais de uso devocional no Brasil; a jaculatória de Fátima pode
          ser desmarcada ao iniciar. As meditações são textos originais de apoio
          à contemplação, com referências bíblicas para leitura na sua própria
          Bíblia.
        </p>
        <ul>
          {CONTENT_SOURCES.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            </li>
          ))}
          {MYSTERY_SETS.map((set) => (
            <li key={set.id}>
              <a href={set.source} target="_blank" rel="noreferrer">
                Mistérios {set.title} — Santa Sé
              </a>
            </li>
          ))}
        </ul>
        <p>
          Os mistérios da Assunção e da Coroação de Maria são contemplados à luz
          da fé e da tradição da Igreja. As referências bíblicas indicadas
          oferecem contexto para essa contemplação; não são uma narração bíblica
          direta desses acontecimentos.
        </p>
        <h2>As imagens e a tipografia</h2>
        <p>
          As imagens dos mistérios do Santo Rosário reúnem pinturas sacras em
          estilo clássico (restauradas e originais do acervo PanteraLab) e
          composições originais criadas para a plataforma, organizadas para
          auxiliar a contemplação sem distrações. Cada imagem possui descrição
          acessível e crédito. A tipografia utiliza fontes disponíveis no
          dispositivo, sem carregar fontes de outros serviços.
        </p>
        <h2>Conteúdo com cuidado</h2>
        <p>
          O conteúdo religioso pode ser atualizado pela administração com
          registro de nova edição e confirmação de revisão. Orações já iniciadas
          preservam sua versão para manter a continuidade. Partilhas de
          participantes e respostas do assistente de IA são identificadas na
          comunidade; a edição do roteiro do Rosário é um processo separado.
        </p>
      </article>
    </PrayerLayout>
  );
}
