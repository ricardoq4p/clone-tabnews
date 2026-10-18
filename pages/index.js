import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";

import { mysteriesForDay } from "@/lib/rosary/engine";
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
    <PrayerLayout>
      <div className="p-container r-home">
        <div className="r-status">
          <span>
            <span className="r-status-dot" aria-hidden="true" /> BEM-VINDO À
            NOSSA CASA
          </span>
          <span>FÉ · ORAÇÃO · COMUNIDADE</span>
        </div>
        <section className="p-hero">
          <div className="p-hero-copy">
            <p className="p-eyebrow">
              <span />
              UM REFÚGIO NO MUNDO DIGITAL
            </p>
            <h1>
              Um lugar para
              <br /> aquietar a <em>alma.</em>
            </h1>
            <p className="p-lead">
              Entre o ruído dos dias, um lugar de silêncio.
              <br className="p-desktop" /> Reze com Maria, confie suas intenções
              e encontre uma comunidade que caminha com você.
            </p>
            <div className="p-actions">
              <Link className="p-button" href="/rosario">
                <Icon name="rosary" />
                Começar a rezar
                <Icon name="arrow" size={17} />
              </Link>
              <Link className="p-button p-button-outline" href="/comunidade">
                <Icon name="people" />
                Conhecer a comunidade
              </Link>
            </div>
            <p className="p-quiet">
              <Icon name="leaf" size={15} />A oração começa onde você está. Sem
              pressa, sem cadastro.
            </p>
          </div>
          <figure className="r-hero-window">
            <figcaption className="r-window-bar">
              <span>
                <Icon name="cross" size={14} /> CAPELINHA VIRTUAL
              </span>
              <span aria-hidden="true">— □ ×</span>
            </figcaption>
            <Image
              src="/sacred/capelinha-076db5e69b37.png"
              alt="Nossa Senhora no altar da Capelinha, entre vitrais azuis e velas acesas"
              width={1536}
              height={1024}
              sizes="(max-width: 720px) 92vw, 48vw"
              priority
            />
            <div className="r-window-footer">
              <span>Um instante de silêncio. Uma presença de fé.</span>
              <Link href="/capelinha">
                Entrar <Icon name="arrow" size={15} />
              </Link>
            </div>
          </figure>
        </section>
        <section className="p-section r-paths">
          <div className="p-section-heading">
            <div>
              <p className="p-eyebrow">TRÊS CAMINHOS, UM ENCONTRO</p>
              <h2>Encontre seu caminho de oração.</h2>
            </div>
            <p>
              Pequenos gestos de fé.
              <br />
              Uma presença que transforma o dia.
            </p>
          </div>
          <div className="p-path-grid">
            <Link href="/rosario" className="p-path-card">
              <div className="p-path-art p-path-rosary">
                <Image
                  src="/images/home/caminho-rosario.webp"
                  alt=""
                  width={1536}
                  height={204}
                  sizes="(max-width: 720px) 92vw, 33vw"
                />
                <span>CONTEMPLAR</span>
              </div>
              <div className="p-path-copy">
                <span className="p-number">01</span>
                <h3>Santo Rosário</h3>
                <p>
                  Contemple cada mistério com imagens, meditações e as orações
                  que atravessam gerações.
                </p>
                <span className="p-text-link">
                  Começar a rezar
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            </Link>
            <Link href="/capelinha" className="p-path-card">
              <div className="p-path-art p-path-chapel">
                <Image
                  src="/images/home/caminho-capelinha.webp"
                  alt=""
                  width={1536}
                  height={201}
                  sizes="(max-width: 720px) 92vw, 33vw"
                />
                <span>CONFIAR</span>
              </div>
              <div className="p-path-copy">
                <span className="p-number">02</span>
                <h3>Capelinha</h3>
                <p>
                  Acenda uma vela simbólica. Entregue a Deus o que pesa no
                  coração e una-se à oração de outros.
                </p>
                <span className="p-text-link">
                  Visitar a Capelinha
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            </Link>
            <Link href="/comunidade" className="p-path-card">
              <div className="p-path-art p-path-community">
                <Image
                  src="/images/home/caminho-comunidades.webp"
                  alt=""
                  width={1536}
                  height={210}
                  sizes="(max-width: 720px) 92vw, 33vw"
                />
                <span>CAMINHAR JUNTOS</span>
              </div>
              <div className="p-path-copy">
                <span className="p-number">03</span>
                <h3>Comunidades</h3>
                <p>
                  Partilhe intenções, testemunhos e reflexões. Há sempre um
                  lugar para você nesta caminhada.
                </p>
                <span className="p-text-link">
                  Encontrar a comunidade
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            </Link>
          </div>
        </section>
        <div className="r-lower-panels">
          <section className="p-daily">
            <span className="p-daily-icon">
              <Icon name="sun" size={24} />
            </span>
            <div>
              <p className="p-eyebrow">ORAÇÃO DO DIA</p>
              <h2>Mistérios {today?.set.title || "do Santo Rosário"}</h2>
            </div>
            <p className="p-daily-date">
              {today?.day || "Um novo dia para rezar"}
              <small>Horário de Brasília</small>
            </p>
            <Link href="/rosario" className="p-text-link">
              Rezar os mistérios
              <Icon name="arrow" size={17} />
            </Link>
          </section>

          <section
            className="r-account-panel p-panel"
            aria-labelledby="r-intentions-title"
          >
            <p className="p-eyebrow">
              <Icon name="candle" size={16} /> SEU ESPAÇO DE ORAÇÃO
            </p>
            <h2 id="r-intentions-title">Suas intenções, com cuidado.</h2>
            <p>Acompanhe suas velas e escolha como partilhar cada intenção.</p>
            <Link href="/minhas-velas" className="p-text-link">
              Ver minhas velas <Icon name="arrow" size={16} />
            </Link>
          </section>
        </div>
        <div className="r-home-note">
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
