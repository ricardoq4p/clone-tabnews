import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import CandleArt from "@/components/prayer/CandleArt";
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
      <section className="p-hero p-container">
        <div className="p-hero-copy">
          <p className="p-eyebrow">
            <span />
            UM TEMPO PARA O QUE É ETERNO
          </p>
          <h1>
            Aquiete a alma.
            <br />
            Aproxime-se de <em>Deus.</em>
          </h1>
          <p className="p-lead">
            Entre o ruído dos dias, um lugar de silêncio.
            <br className="p-desktop" /> Reze com Maria, confie suas intenções e
            encontre uma comunidade que caminha com você.
          </p>
          <div className="p-actions">
            <Link className="p-button" href="/rosario">
              <Icon name="rosary" />
              Rezar o Santo Rosário
              <Icon name="arrow" size={17} />
            </Link>
            <Link className="p-button p-button-outline" href="/capelinha">
              <Icon name="candle" />
              Acender uma vela
            </Link>
          </div>
          <p className="p-quiet">
            <Icon name="leaf" size={15} />A oração começa onde você está. Sem
            pressa, sem cadastro.
          </p>
        </div>
        <div className="p-hero-art">
          <div className="p-art-orbit" />
          <Image
            src="/sacred/oratorio.svg"
            alt="Ilustração de Maria em oração, com manto azul e auréola dourada"
            width={600}
            height={720}
            priority
          />
          <div className="p-art-caption">
            <span>COM MARIA, ATÉ JESUS</span>
            <p>Um sim que renova o coração.</p>
          </div>
        </div>
      </section>
      <section className="p-daily p-container">
        <span className="p-daily-icon">
          <Icon name="sun" size={24} />
        </span>
        <div>
          <p className="p-eyebrow">NOSSA ORAÇÃO DE HOJE</p>
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
      <section className="p-container p-section">
        <div className="p-section-heading">
          <div>
            <p className="p-eyebrow">TRÊS CAMINHOS, UM ENCONTRO</p>
            <h2>Cultive o que floresce por dentro.</h2>
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
              <Icon name="rosary" size={82} />
              <span>CONTEMPLAR</span>
            </div>
            <div className="p-path-copy">
              <span className="p-number">01</span>
              <h3>O Rosário, no seu ritmo.</h3>
              <p>
                Contemple cada mistério com imagens, meditações e as orações que
                atravessam gerações.
              </p>
              <span className="p-text-link">
                Começar a rezar
                <Icon name="arrow" size={16} />
              </span>
            </div>
          </Link>
          <Link href="/capelinha" className="p-path-card">
            <div className="p-path-art p-path-chapel">
              <CandleArt small />
              <span>CONFIAR</span>
            </div>
            <div className="p-path-copy">
              <span className="p-number">02</span>
              <h3>Uma luz, uma intenção.</h3>
              <p>
                Acenda uma vela simbólica. Entregue a Deus o que pesa no coração
                e una-se à oração de outros.
              </p>
              <span className="p-text-link">
                Visitar a Capelinha
                <Icon name="arrow" size={16} />
              </span>
            </div>
          </Link>
          <Link href="/comunidade" className="p-path-card">
            <div className="p-path-art p-path-community">
              <Icon name="people" size={82} />
              <span>CAMINHAR JUNTOS</span>
            </div>
            <div className="p-path-copy">
              <span className="p-number">03</span>
              <h3>Ninguém reza sozinho.</h3>
              <p>
                Partilhe intenções, testemunhos e reflexões. Há sempre um lugar
                para você nesta caminhada.
              </p>
              <span className="p-text-link">
                Encontrar a comunidade
                <Icon name="arrow" size={16} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section className="p-invitation">
        <div className="p-container">
          <Icon name="cross" size={28} />
          <p className="p-eyebrow">PERMANEÇA UM POUCO</p>
          <h2>
            Você não precisa ter todas as palavras.
            <br />
            <em>Basta abrir o coração.</em>
          </h2>
          <p>
            Deixe as preocupações por um instante. Faça o sinal da cruz.
            <br />
            Dê o primeiro passo na presença de Deus.
          </p>
          <Link href="/rosario" className="p-button">
            Reservar este momento
            <Icon name="arrow" size={17} />
          </Link>
        </div>
      </section>
    </PrayerLayout>
  );
}
