import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { mysteriesForDay } from "@/lib/rosary/engine";

const EXPERIENCES = [
  {
    href: "/rosario",
    number: "01",
    badge: "CONTEMPLAR",
    title: "Santo Rosário",
    description:
      "Medite cada mistério da vida de Jesus com Maria, acompanhado por pinturas sacras e orações tradicionais.",
    cta: "Rezar o Rosário",
    image: "/images/home/caminho-rosario.webp",
    imageWidth: 1536,
    imageHeight: 204,
    artClass: "p-path-rosary",
  },
  {
    href: "/terco-da-misericordia",
    number: "02",
    badge: "CONFIAR",
    title: "Terço da Misericórdia",
    description:
      "Entregue suas intenções à Divina Misericórdia, rezando conta a conta com texto e condução em áudio.",
    cta: "Terço da Misericórdia",
    image: "/images/rosario/dolorosos/crucificacao.webp",
    imageWidth: 640,
    imageHeight: 640,
    artClass: "p-path-mercy",
  },
  {
    href: "/capelinha",
    number: "03",
    badge: "ENTREGAR",
    title: "Capelinha",
    description:
      "Acenda uma vela simbólica por sete dias, escolha a privacidade da sua intenção e una-se à oração de outros irmãos.",
    cta: "Visitar a Capelinha",
    image: "/images/home/caminho-capelinha.webp",
    imageWidth: 1536,
    imageHeight: 201,
    artClass: "p-path-chapel",
  },
  {
    href: "/comunidade",
    number: "04",
    badge: "CAMINHAR JUNTOS",
    title: "Comunidades",
    description:
      "Partilhe pedidos de oração, testemunhos e reflexões em comunhão, com respeito, acolhimento e caridade.",
    cta: "Encontrar a comunidade",
    image: "/images/home/caminho-comunidades.webp",
    imageWidth: 1536,
    imageHeight: 210,
    artClass: "p-path-community",
  },
];

export default function Home() {
  const [today, setToday] = useState(null);
  useEffect(() => {
    const update = () =>
      setToday({
        set: mysteriesForDay(),
        day: new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "America/Sao_Paulo",
        }).format(new Date()),
      });
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <PrayerLayout
      title="Uma casa de oração"
      description="Reze o Santo Rosário e o Terço da Misericórdia, apresente suas intenções na Capelinha e caminhe em comunidade."
    >
      <div className="p-container pl-home">
        <section className="p-hero pl-home-hero">
          <div className="p-hero-copy pl-hero-copy">
            <p className="p-eyebrow">
              <span aria-hidden="true" />
              CASA CATÓLICA DE ORAÇÃO
            </p>
            <h1>
              Um lugar para
              <br /> aquietar a <em>alma.</em>
            </h1>
            <p className="p-lead">
              Entre o ruído dos dias, um espaço de silêncio e fé. Reze com a
              Igreja, confie suas intenções diante do altar e encontre uma
              comunidade que caminha com você.
            </p>
            <div className="p-actions">
              <Link className="p-button" href="/rosario">
                <Icon name="rosary" />
                Começar a rezar
                <Icon name="arrow" size={17} />
              </Link>
              <Link
                className="p-button p-button-outline"
                href="/terco-da-misericordia"
              >
                <Icon name="heart" />
                Terço da Misericórdia
              </Link>
            </div>
            <p className="p-quiet">
              <Icon name="leaf" size={15} />A oração começa onde você está. Sem
              pressa, sem cadastro obrigatório.
            </p>
          </div>

          <figure className="pl-hero-chapel">
            <Link
              href="/capelinha"
              className="pl-hero-chapel-media"
              aria-label="Abrir a Capelinha Virtual"
            >
              <Image
                src="/sacred/capelinha-076db5e69b37.png"
                alt="Nossa Senhora no altar da Capelinha, entre vitrais azuis e degraus de mármore"
                width={1536}
                height={1024}
                sizes="(max-width: 900px) 92vw, 48vw"
                priority
              />
            </Link>
            <figcaption className="pl-hero-chapel-footer">
              <div>
                <span className="pl-hero-chapel-tag">
                  <Icon name="candle" size={14} /> CAPELINHA VIRTUAL
                </span>
                <p>Um instante de silêncio. Uma presença de fé.</p>
              </div>
              <Link href="/capelinha" className="pl-hero-chapel-link">
                Entrar <Icon name="arrow" size={15} />
              </Link>
            </figcaption>
          </figure>
        </section>

        <section
          className="p-section pl-home-paths"
          aria-labelledby="pl-paths-heading"
        >
          <div className="p-section-heading">
            <div>
              <p className="p-eyebrow">QUATRO CAMINHOS, UM ENCONTRO</p>
              <h2 id="pl-paths-heading">Encontre seu caminho de oração.</h2>
            </div>
            <p>
              Pequenos gestos de fé.
              <br />
              Uma presença que santifica o dia.
            </p>
          </div>

          <div className="p-path-grid pl-path-grid">
            {EXPERIENCES.map((item) => (
              <Link key={item.href} href={item.href} className="p-path-card">
                <div className={`p-path-art ${item.artClass}`}>
                  <Image
                    src={item.image}
                    alt=""
                    width={item.imageWidth}
                    height={item.imageHeight}
                    sizes="(max-width: 640px) 92vw, (max-width: 1120px) 46vw, 24vw"
                  />
                  <span>{item.badge}</span>
                </div>
                <div className="p-path-copy">
                  <span className="p-number">{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="p-text-link">
                    {item.cta}
                    <Icon name="arrow" size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="pl-lower-panels">
          <section
            className="p-daily pl-daily-panel"
            aria-labelledby="pl-daily-title"
          >
            <div className="pl-daily-top">
              <span className="p-daily-icon" aria-hidden="true">
                <Icon name="sun" size={22} />
              </span>
              <div>
                <p className="p-eyebrow">ORAÇÃO DO DIA</p>
                <h2 id="pl-daily-title">
                  Mistérios {today?.set.title || "do Santo Rosário"}
                </h2>
              </div>
            </div>
            <p className="pl-daily-subtitle">
              {today?.set.subtitle ||
                "Contemple a vida de Cristo em comunhão com a Igreja."}
            </p>
            <div className="pl-daily-footer">
              <p className="p-daily-date">
                {today?.day || "Um novo dia para rezar"}
                <small>Horário de Brasília</small>
              </p>
              <Link href="/rosario" className="p-text-link">
                Rezar os mistérios
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          </section>

          <section
            className="p-panel pl-intentions-panel"
            aria-labelledby="r-intentions-title"
          >
            <div className="pl-daily-top">
              <span className="p-daily-icon" aria-hidden="true">
                <Icon name="candle" size={22} />
              </span>
              <div>
                <p className="p-eyebrow">INTENÇÕES E VELAS</p>
                <h2 id="r-intentions-title">Suas intenções, com cuidado.</h2>
              </div>
            </div>
            <p className="pl-intentions-copy">
              Cada vela permanece simbolicamente acesa por sete dias na
              Capelinha. Você escolhe se a sua intenção será privada, anônima ou
              pública.
            </p>
            <div className="pl-intentions-actions">
              <Link href="/capelinha" className="p-text-link">
                Acender uma vela <Icon name="arrow" size={16} />
              </Link>
              <Link href="/minhas-velas" className="p-text-link">
                Ver minhas velas <Icon name="arrow" size={16} />
              </Link>
            </div>
          </section>
        </div>

        <div className="pl-home-note">
          <Icon name="cross" size={16} />
          <p>A oração nos aproxima. Mesmo quando estamos longe.</p>
          <Link href="/sobre">
            Conheça nossa casa <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </PrayerLayout>
  );
}
