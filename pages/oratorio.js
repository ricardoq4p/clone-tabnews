import Link from "next/link";
import Image from "next/image";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { DAILY_PRAYER_CARDS } from "@/lib/oratorio/daily-prayers";

export { DAILY_PRAYER_CARDS };

export const ORATORIO_EXPERIENCES = [
  {
    href: "/rosario",
    number: "01",
    badge: "CONTEMPLAR",
    title: "Santo Rosário",
    description:
      "Contemple os mistérios da vida de Jesus com Maria, acompanhado por pinturas sacras, orações tradicionais e condução guiada.",
    cta: "Entrar no Santo Rosário",
    image: "/images/home/caminho-rosario.webp",
    imageWidth: 1536,
    imageHeight: 204,
    artClass: "p-path-rosary",
    icon: "rosary",
  },
  {
    href: "/terco-da-misericordia",
    number: "02",
    badge: "CONFIAR",
    title: "Terço da Misericórdia",
    description:
      "Entregue suas intenções à Divina Misericórdia, rezando conta a conta com texto e condução em áudio.",
    cta: "Rezar o Terço da Misericórdia",
    image: "/images/rosario/dolorosos/crucificacao.webp",
    imageWidth: 640,
    imageHeight: 640,
    artClass: "p-path-mercy",
    icon: "heart",
  },
];

export default function Oratorio() {
  return (
    <PrayerLayout
      title="Oratório | PanteraLab"
      description="Um espaço de oração, contemplação e encontro com Deus. Acesse o Santo Rosário e o Terço da Misericórdia."
    >
      <div className="p-container pl-oratorio">
        <div className="p-page-head pl-oratorio-head">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>Oratório
          </div>
          <p className="p-eyebrow">
            <span aria-hidden="true" />
            ORATÓRIO
          </p>
          <h1>Oratório</h1>
          <p className="pl-oratorio-support">
            Um espaço de silêncio, contemplação e encontro com Deus.
          </p>
          <p className="pl-oratorio-lead">
            Encontre um momento de silêncio, oração e proximidade com Deus.
            Escolha seu caminho de oração e permita que este momento seja
            dedicado à fé, à contemplação e à confiança em Deus.
          </p>
        </div>

        <section
          className="p-section pl-oratorio-paths"
          aria-labelledby="pl-oratorio-paths-heading"
        >
          <div className="p-section-heading">
            <div>
              <p className="p-eyebrow">DEVOÇÕES GUIADAS</p>
              <h2 id="pl-oratorio-paths-heading">
                Escolha sua experiência de oração.
              </h2>
            </div>
            <p>
              Reze no seu ritmo, com recolhimento,
              <br />
              texto tradicional e condução em áudio.
            </p>
          </div>

          <div className="p-path-grid pl-path-grid pl-oratorio-grid">
            {ORATORIO_EXPERIENCES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="p-path-card pl-oratorio-card"
              >
                <div className={`p-path-art ${item.artClass}`}>
                  <Image
                    src={item.image}
                    alt=""
                    width={item.imageWidth}
                    height={item.imageHeight}
                    sizes="(max-width: 720px) 92vw, 46vw"
                    priority
                  />
                  <span>{item.badge}</span>
                </div>
                <div className="p-path-copy">
                  <div className="pl-oratorio-card-meta">
                    <span className="p-number">{item.number}</span>
                    <Icon name={item.icon} size={17} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="p-text-link">
                    {item.cta} →
                    <Icon name="arrow" size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          id="oracoes-do-dia-a-dia"
          className="p-section pl-oratorio-daily"
          aria-labelledby="pl-oratorio-daily-heading"
        >
          <div className="p-section-heading">
            <div>
              <p className="p-eyebrow">ORAÇÕES DO DIA A DIA</p>
              <h2 id="pl-oratorio-daily-heading">Orações do Dia a Dia</h2>
              <p className="pl-oratorio-daily-subtitle">
                Uma oração para cada momento.
              </p>
            </div>
            <p>
              Nem toda oração precisa ser longa. Às vezes, poucas palavras ditas
              com fé aproximam nosso coração de Deus.
            </p>
          </div>

          <div className="pl-oratorio-daily-grid">
            {DAILY_PRAYER_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="p-panel pl-oratorio-daily-card"
              >
                <div className="pl-oratorio-daily-card-top">
                  <span className="p-number">{card.number}</span>
                  <div className="pl-oratorio-daily-card-badges">
                    {card.complement ? (
                      <span className="pl-oratorio-daily-pill">
                        {card.complement}
                      </span>
                    ) : null}
                    <span className="pl-oratorio-daily-icon" aria-hidden="true">
                      <Icon name={card.icon} size={17} />
                    </span>
                  </div>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <span className="p-text-link">
                  {card.cta}
                  <Icon name="arrow" size={15} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="pl-home-note">
          <Icon name="cross" size={16} />
          <p>
            Deseja confiar uma intenção diante do altar antes ou depois de
            rezar?
          </p>
          <Link href="/capelinha">
            Visitar a Capelinha <Icon name="arrow" size={15} />
          </Link>
        </div>
      </div>
    </PrayerLayout>
  );
}
