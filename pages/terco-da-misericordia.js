import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { MERCY_STAGE_SUMMARY } from "@/lib/misericordia/content";
import { buildMercySections } from "@/lib/misericordia/engine";
import {
  MERCY_AUDIO_RATES,
  areMercyRecordingsIntegrated,
} from "@/lib/misericordia/audio-catalog";
import { useMercyChaplet } from "@/lib/misericordia/useMercyChaplet";

const formatClock = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const AUDIO_STATUS_MESSAGES = {
  idle: "Toque em reproduzir para iniciar a condução em áudio com avanço automático.",
  loading: "Preparando o áudio desta etapa…",
  playing:
    "Reproduzindo a oração atual. Ao concluir, avançaremos automaticamente para a próxima etapa.",
  paused:
    "Áudio pausado. Sua posição exata nesta oração foi preservada para continuar.",
  finished: "Etapa concluída no áudio.",
  unavailable:
    "Esta etapa não possui arquivo de áudio associado. Continue pelo texto abaixo.",
  blocked:
    "O navegador solicitou confirmação para iniciar o som. Toque em reproduzir áudio.",
  complete: "Você concluiu todas as etapas do Terço da Misericórdia.",
};

function RosaryIllustration() {
  return (
    <svg
      viewBox="0 0 84 96"
      fill="none"
      aria-hidden="true"
      className="pl-mercy-info-svg"
    >
      <ellipse
        cx="42"
        cy="34"
        rx="22"
        ry="25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="1 5.5"
        strokeLinecap="round"
      />
      <circle cx="42" cy="9" r="2.6" fill="currentColor" />
      <circle cx="22" cy="24" r="2.6" fill="currentColor" />
      <circle cx="62" cy="24" r="2.6" fill="currentColor" />
      <circle cx="25" cy="48" r="2.6" fill="currentColor" />
      <circle cx="59" cy="48" r="2.6" fill="currentColor" />
      <path
        d="M42 59l-3 4 3 4 3-4-3-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="rgba(166, 124, 62, 0.18)"
      />
      <circle cx="41" cy="71" r="1.9" fill="currentColor" />
      <circle cx="40" cy="76" r="1.9" fill="currentColor" />
      <path
        d="M39 81l-2 12M33 85l11 2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BibleIllustration() {
  return (
    <svg
      viewBox="0 0 84 72"
      fill="none"
      aria-hidden="true"
      className="pl-mercy-info-svg"
    >
      <path
        d="M12 16c10-3 21-2 30 3 9-5 20-6 30-3v39c-10-3-21-2-30 3-9-5-20-6-30-3V16Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 55c9-2.5 18-1.5 26 3 8-4.5 17-5.5 26-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M42 19v39"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TercoDaMisericordia() {
  const chaplet = useMercyChaplet();
  const { ready, progress, closingPrayer, steps, step, completed, audio } =
    chaplet;

  const [praying, setPraying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const headingRef = useRef(null);

  const recordingsReady = areMercyRecordingsIntegrated();
  const sections = buildMercySections(steps);
  const audioPlaying = ["playing", "loading"].includes(audio.status);

  function go(nextPosition) {
    chaplet.go(nextPosition);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        headingRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function begin({ autoPlay = false } = {}) {
    chaplet.start({ closingPrayer, autoPlay });
    setPraying(true);
  }

  function resumePrayer({ autoPlay = false } = {}) {
    setPraying(true);
    if (autoPlay) {
      audio.play();
    }
  }

  function toggleClosingOption(checked) {
    chaplet.setClosingPrayer(checked);
  }

  const playButtonLabel = audioPlaying
    ? "Pausar áudio"
    : audio.status === "paused" && audio.time > 0
      ? "Continuar áudio"
      : audio.status === "finished"
        ? "Ouvir novamente"
        : ["error", "blocked"].includes(audio.status)
          ? "Tentar novamente"
          : "Reproduzir áudio";

  return (
    <PrayerLayout
      title="Terço da Misericórdia"
      description="Oração guiada do Terço da Divina Misericórdia no Caminhar para Cristo."
    >
      <div
        className={`p-container pl-mercy-page ${focusMode ? "p-focus-mode" : ""} ${praying && progress ? "is-praying" : ""}`}
      >
        <div className="p-breadcrumb pl-mercy-breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/oratorio">Oratório</Link>
          <span>/</span>Terço da Misericórdia
        </div>

        <section className="pl-mercy-hero" aria-labelledby="pl-mercy-title">
          <div className="pl-mercy-hero-copy">
            <p className="p-eyebrow">JESUS, EU CONFIO EM VÓS</p>
            <h1 id="pl-mercy-title">
              {praying && progress ? (
                "Terço da Divina Misericórdia"
              ) : (
                <>
                  Terço da <em>Divina Misericórdia</em>
                </>
              )}
            </h1>
            <p className="pl-mercy-hero-lead">
              Uma oração de confiança na misericórdia de Deus para nós e para o
              mundo inteiro.
            </p>
            {!praying || !progress ? (
              <div className="p-actions pl-mercy-hero-actions">
                <button
                  type="button"
                  className="p-button"
                  onClick={() =>
                    progress && !completed
                      ? resumePrayer({ autoPlay: false })
                      : begin({ autoPlay: false })
                  }
                >
                  <Icon name="play" size={16} />
                  Rezar agora
                </button>
                <button
                  type="button"
                  className="p-button p-button-outline"
                  onClick={() =>
                    progress && !completed
                      ? resumePrayer({ autoPlay: true })
                      : begin({ autoPlay: true })
                  }
                >
                  <Icon name="headphones" size={17} />
                  Ouvir a oração
                </button>
              </div>
            ) : null}
          </div>

          {!praying || !progress ? (
            <figure className="pl-mercy-hero-art">
              <Image
                src="/images/misericordia/jesus-misericordioso.webp"
                alt="Jesus Misericordioso com vestes brancas, mão direita em bênção e raios vermelho e claro partindo do coração"
                width={624}
                height={448}
                sizes="(max-width: 900px) 92vw, 440px"
                priority
              />
            </figure>
          ) : null}
        </section>

        {!ready && praying ? (
          <p className="p-loading" role="status">
            Preparando o Terço da Misericórdia…
          </p>
        ) : !praying || !progress ? (
          <>
            {progress && completed ? (
              <p className="p-notice" role="status">
                Você concluiu o Terço da Misericórdia recentemente. Que a paz de
                Jesus permaneça em seu coração.
              </p>
            ) : null}

            {progress && !completed ? (
              <section
                className="p-resume pl-mercy-resume"
                aria-label="Retomar oração em andamento"
              >
                <Icon name="heart" size={28} />
                <div>
                  <p className="p-eyebrow">SUA ORAÇÃO ESTÁ GUARDADA</p>
                  <h2>Continue do ponto em que pausou.</h2>
                  <p>
                    Etapa {progress.position + 1} de {steps.length} ·{" "}
                    {steps[progress.position]?.stageTitle} (
                    {Math.round((progress.position / steps.length) * 100)}%
                    percorrido)
                  </p>
                </div>
                <div className="pl-mercy-resume-actions">
                  <button
                    type="button"
                    className="p-button"
                    onClick={() => resumePrayer({ autoPlay: false })}
                  >
                    Continuar oração
                    <Icon name="arrow" size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    onClick={() => begin({ autoPlay: false })}
                  >
                    Recomeçar do início
                  </button>
                </div>
              </section>
            ) : null}

            <div className="pl-mercy-grid">
              <section
                className="p-panel pl-mercy-prepare"
                aria-labelledby="pl-mercy-status-title"
              >
                <div className="pl-mercy-badge">
                  <Icon name="heart" size={16} />
                  <span>
                    {recordingsReady
                      ? "ORAÇÃO GUIADA POR VOZ E TEXTO"
                      : "REPRODUÇÃO AUTOMÁTICA PREPARADA · ÁUDIOS EM INTEGRAÇÃO"}
                  </span>
                </div>
                <h2 id="pl-mercy-status-title">
                  Reze conta a conta, com avanço automático ou no seu ritmo.
                </h2>
                <p>
                  Acompanhe as orações na ordem tradicional do Terço da Divina
                  Misericórdia.
                </p>

                <div className="pl-mercy-preferences">
                  <label className="p-check">
                    <input
                      type="checkbox"
                      checked={closingPrayer}
                      onChange={(e) => toggleClosingOption(e.target.checked)}
                    />
                    <span>
                      Incluir a <strong>Oração conclusiva</strong> ao final do
                      terço (opcional)
                    </span>
                  </label>
                </div>

                <div className="p-actions pl-mercy-start-actions">
                  <button
                    type="button"
                    className="p-button"
                    onClick={() =>
                      progress && !completed
                        ? resumePrayer({ autoPlay: false })
                        : begin({ autoPlay: false })
                    }
                  >
                    <Icon name="heart" />
                    {progress && !completed
                      ? "Retomar oração"
                      : "Iniciar oração"}
                    <Icon name="arrow" size={17} />
                  </button>
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    onClick={() =>
                      progress && !completed
                        ? resumePrayer({ autoPlay: true })
                        : begin({ autoPlay: true })
                    }
                  >
                    {progress && !completed
                      ? "Retomar com áudio"
                      : "Iniciar com áudio"}
                  </button>
                </div>

                <div className="pl-mercy-steps">
                  <p className="p-section-label">
                    ESTRUTURA TRADICIONAL ({steps.length} ETAPAS)
                  </p>
                  <ol className="pl-mercy-step-list">
                    {MERCY_STAGE_SUMMARY.map((item) => (
                      <li key={item.number}>
                        <span className="pl-mercy-step-num">{item.number}</span>
                        <div>
                          <div className="pl-mercy-step-title-row">
                            <h3>{item.title}</h3>
                            {item.optional ? (
                              <span className="pl-mercy-optional-pill">
                                Opcional
                              </span>
                            ) : null}
                          </div>
                          <p>{item.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <aside
                className="p-panel pl-mercy-aside"
                aria-label="Sobre o Terço da Divina Misericórdia"
              >
                <div className="pl-mercy-info-list">
                  <article className="pl-mercy-info-item">
                    <div className="pl-mercy-info-media pl-mercy-info-media--portrait">
                      <Image
                        src="/images/misericordia/santa-faustina.webp"
                        alt="Santa Faustina Kowalska"
                        width={264}
                        height={384}
                        sizes="96px"
                      />
                    </div>
                    <div className="pl-mercy-info-copy">
                      <h2>
                        <em>A História</em>
                      </h2>
                      <p>
                        Revelada a Santa Faustina no século XX, a devoção
                        convida a confiar na misericórdia de Jesus.
                      </p>
                    </div>
                  </article>

                  <article className="pl-mercy-info-item">
                    <div className="pl-mercy-info-media pl-mercy-info-media--icon">
                      <RosaryIllustration />
                    </div>
                    <div className="pl-mercy-info-copy">
                      <h2>
                        <em>Como rezar</em>
                      </h2>
                      <p>É rezado em um terço comum, com cinco dezenas.</p>
                    </div>
                  </article>

                  <article className="pl-mercy-info-item">
                    <div className="pl-mercy-info-media pl-mercy-info-media--icon">
                      <BibleIllustration />
                    </div>
                    <div className="pl-mercy-info-copy">
                      <h2>
                        <em>Intenção</em>
                      </h2>
                      <p>
                        Pela conversão, pela nossa salvação e de todo o mundo.
                      </p>
                    </div>
                  </article>
                </div>

                <div className="pl-mercy-aside-links">
                  <Link href="/oratorio" className="p-text-link">
                    Voltar ao Oratório
                    <Icon name="arrow" size={15} />
                  </Link>
                  <Link href="/rosario" className="p-text-link">
                    Ir para o Santo Rosário
                    <Icon name="arrow" size={15} />
                  </Link>
                  <Link href="/capelinha" className="p-text-link">
                    Acender vela na Capelinha
                    <Icon name="arrow" size={15} />
                  </Link>
                </div>
              </aside>
            </div>

            <figure className="pl-mercy-closing-panorama">
              <Image
                src="/images/misericordia/horizonte-cruz.webp"
                alt="Horizonte iluminado entre montanhas e névoa suave com uma cruz dourada ao centro"
                width={1536}
                height={324}
                sizes="100vw"
              />
            </figure>
          </>
        ) : completed ? (
          <section
            className="p-prayer-complete pl-mercy-complete"
            aria-label="Oração concluída"
          >
            <Icon name="cross" size={38} />
            <p className="p-eyebrow">JESUS, EU CONFIO EM VÓS</p>
            <h2>
              Terço da Misericórdia
              <br />
              <em>concluído em paz.</em>
            </h2>
            <p>
              Você completou todas as etapas desta oração. Que a misericórdia de
              Deus acompanhe suas intenções, sua família e o mundo inteiro.
            </p>
            <div className="p-actions">
              <button
                type="button"
                className="p-button"
                onClick={() => begin({ autoPlay: false })}
              >
                <Icon name="heart" />
                Rezar novamente
              </button>
              <button
                type="button"
                className="p-button p-button-outline"
                onClick={() => {
                  setPraying(false);
                  setFocusMode(false);
                }}
              >
                Voltar à apresentação
              </button>
              <Link href="/capelinha" className="p-button p-button-outline">
                <Icon name="candle" />
                Acender vela na Capelinha
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="p-prayer-toolbar">
              <button
                type="button"
                className="p-inline-button"
                onClick={() => {
                  audio.pause();
                  setPraying(false);
                  setFocusMode(false);
                }}
              >
                <Icon name="back" size={16} />
                Pausar e voltar
              </button>
              <span>{step.stageTitle}</span>
              <div>
                <button
                  type="button"
                  aria-label="Alterar tamanho do texto"
                  className="p-font-button"
                  onClick={() =>
                    setFontSize((value) => (value >= 1.3 ? 1 : value + 0.15))
                  }
                >
                  A<span>A</span>
                </button>
                <button
                  type="button"
                  className="p-inline-button"
                  onClick={() => setFocusMode((value) => !value)}
                >
                  <Icon name={focusMode ? "close" : "leaf"} size={15} />
                  {focusMode ? "Sair do recolhimento" : "Recolhimento"}
                </button>
              </div>
            </div>

            <div className="p-rosary-progress">
              <div>
                <span>
                  ETAPA {progress.position + 1} DE {steps.length} ·{" "}
                  {step.stageTitle.toUpperCase()}
                </span>
                <span>
                  {Math.round((progress.position / steps.length) * 100)}%
                </span>
              </div>
              <progress
                value={progress.position}
                max={steps.length}
                aria-label="Progresso do Terço da Misericórdia"
              />
            </div>

            <section
              className="p-panel pl-mercy-player"
              aria-label="Reprodutor de áudio do Terço da Misericórdia"
            >
              <div className="pl-mercy-player-head">
                <div>
                  <span className="p-section-label">
                    CONDUÇÃO EM ÁUDIO · ETAPA {progress.position + 1}
                  </span>
                  <p className="pl-mercy-player-title">{step.title}</p>
                </div>
                <div className="pl-mercy-player-badges">
                  {audio.clip ? (
                    <span className="pl-mercy-file-pill">
                      {audio.clip.file}
                    </span>
                  ) : null}
                  {!recordingsReady ? (
                    <span className="pl-mercy-pending-pill">
                      Gravações definitivas em preparação
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="pl-mercy-player-options">
                <label>
                  Avanço entre etapas
                  <select
                    aria-label="Avanço entre etapas"
                    value={audio.mode}
                    onChange={(event) => audio.setMode(event.target.value)}
                  >
                    <option value="continuous">Automático</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
                <label>
                  Velocidade
                  <select
                    aria-label="Velocidade"
                    value={audio.rate}
                    onChange={(event) =>
                      audio.setRate(Number(event.target.value))
                    }
                  >
                    {MERCY_AUDIO_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {String(rate).replace(".", ",")}×
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="pl-mercy-player-controls">
                <button
                  type="button"
                  className="p-button p-button-outline"
                  disabled={progress.position === 0}
                  onClick={() => go(progress.position - 1)}
                  aria-label="Etapa anterior pelo reprodutor"
                >
                  <Icon name="back" size={16} />
                  Etapa anterior
                </button>
                <button
                  type="button"
                  className="p-button"
                  disabled={!audio.available}
                  onClick={audioPlaying ? audio.pause : audio.play}
                >
                  {playButtonLabel}
                </button>
                <button
                  type="button"
                  className="p-button p-button-outline"
                  onClick={() => go(progress.position + 1)}
                  aria-label="Próxima etapa pelo reprodutor"
                >
                  Próxima etapa
                  <Icon name="arrow" size={16} />
                </button>
              </div>

              <div
                className="pl-mercy-player-timeline"
                aria-label="Tempo do áudio"
              >
                <progress
                  value={audio.time}
                  max={audio.duration || 1}
                  aria-label="Progresso do áudio desta etapa"
                />
                <span>
                  {formatClock(audio.time)} / {formatClock(audio.duration)}
                </span>
              </div>

              {audio.status === "error" ? (
                <p role="alert" className="p-error pl-mercy-audio-error">
                  Não foi possível carregar ou reproduzir o áudio desta etapa (
                  <code>{audio.clip?.file || "arquivo indisponível"}</code>).
                  Você pode tentar novamente, seguir normalmente pelo texto ou
                  avançar entre as etapas.
                </p>
              ) : (
                <p role="status" className="pl-mercy-audio-status">
                  {audio.inSilence && audio.status === "playing"
                    ? "Pausa contemplativa ao final da oração…"
                    : AUDIO_STATUS_MESSAGES[audio.status] ||
                      AUDIO_STATUS_MESSAGES.idle}
                </p>
              )}
            </section>

            <div className="pl-mercy-workspace">
              <section className="p-prayer-card pl-mercy-prayer-card">
                <div className="p-prayer-card-top">
                  <div className="p-prayer-card-heading">
                    <span className="p-section-label">
                      {step.stageTitle.toUpperCase()}
                    </span>
                    {step.optional ? (
                      <span className="pl-mercy-optional-pill">Opcional</span>
                    ) : null}
                  </div>
                  <Icon name="cross" size={19} />
                </div>

                {step.decadeIntention ? (
                  <p className="pl-mercy-decade-intention">
                    {step.decadeIntention}
                  </p>
                ) : null}

                <div className="p-prayer-meta">
                  <p className="p-prayer-label">{step.label}</p>
                  {step.beadTotal > 0 ? (
                    <div
                      className="p-decade-beads"
                      aria-label={`Conta ${step.bead} de ${step.beadTotal}`}
                    >
                      {Array.from({ length: step.beadTotal }, (_, idx) => {
                        const number = idx + 1;
                        return (
                          <span
                            key={number}
                            className={`p-decade-dot ${number < step.bead ? "is-done" : ""} ${number === step.bead ? "is-current" : ""}`}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <h2 ref={headingRef} tabIndex={-1} className="p-prayer-title">
                  {step.title}
                </h2>

                <p
                  className="p-prayer-text"
                  style={{ "--prayer-scale": fontSize }}
                  key={step.id}
                >
                  {step.text}
                </p>

                <div className="p-prayer-controls">
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    disabled={progress.position === 0}
                    onClick={() => go(progress.position - 1)}
                    aria-label="Oração anterior"
                  >
                    <Icon name="back" size={17} />
                    <span>Anterior</span>
                  </button>
                  <button
                    type="button"
                    className="p-button"
                    onClick={() => go(progress.position + 1)}
                  >
                    {progress.position === steps.length - 1
                      ? "Concluir oração"
                      : "Próxima oração"}
                    <Icon name="arrow" size={17} />
                  </button>
                </div>
              </section>

              <aside
                className="p-panel pl-mercy-navigator"
                aria-label="Roteiro do Terço da Misericórdia"
              >
                <p className="p-section-label">ETAPAS DA ORAÇÃO</p>
                <ol className="pl-mercy-nav-list">
                  {sections.map((sec) => {
                    const isCurrent =
                      progress.position >= sec.startIndex &&
                      progress.position <= sec.endIndex;
                    const isDone = progress.position > sec.endIndex;
                    return (
                      <li key={sec.id}>
                        <button
                          type="button"
                          className={`pl-mercy-nav-item ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
                          aria-current={isCurrent ? "step" : undefined}
                          onClick={() => go(sec.startIndex)}
                        >
                          <span className="pl-mercy-nav-dot" />
                          <span className="pl-mercy-nav-copy">
                            <strong>
                              {sec.title}
                              {sec.optional ? " (Opcional)" : ""}
                            </strong>
                            <small>{sec.subtitle}</small>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <div className="pl-mercy-nav-footer">
                  <label className="p-check">
                    <input
                      type="checkbox"
                      checked={Boolean(progress.closingPrayer)}
                      onChange={(e) => toggleClosingOption(e.target.checked)}
                    />
                    <span>Incluir oração conclusiva (opcional)</span>
                  </label>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </PrayerLayout>
  );
}
