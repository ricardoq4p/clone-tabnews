import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import Beads from "@/components/rosary/Beads";
import { useRosary } from "@/lib/rosary/useRosary";
import { buildRosary, mysteriesForDay } from "@/lib/rosary/engine";
const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
export default function Rosario() {
  const rosary = useRosary();
  const { content, progress, ready } = rosary;
  const [selected, setSelected] = useState(() => mysteriesForDay().id),
    [full, setFull] = useState(false),
    [fatima, setFatima] = useState(true),
    [praying, setPraying] = useState(false),
    [restart, setRestart] = useState(false),
    [focusMode, setFocusMode] = useState(false),
    [fontSize, setFontSize] = useState(1),
    [previewIndex, setPreviewIndex] = useState(0);
  const heading = useRef(null);
  const [daySet, setDaySet] = useState(() => mysteriesForDay().id),
    [manualSelection, setManualSelection] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      const id = mysteriesForDay().id;
      setDaySet(id);
      if (!manualSelection) setSelected(id);
    }, 60000);
    return () => clearInterval(timer);
  }, [manualSelection]);
  const steps = progress ? buildRosary(progress.setId, progress, content) : [];
  const completed = Boolean(progress && progress.position === steps.length);
  const step = steps[progress?.position];
  const contextSet =
    step?.setId ||
    [...steps.slice(0, progress?.position || 0)]
      .reverse()
      .find((item) => item.setId)?.setId ||
    (progress?.full ? content.sets[0].id : progress?.setId || selected);
  const activeSet =
    content.sets.find((set) => set.id === contextSet) || content.sets[0];
  const selectedSet =
    content.sets.find((set) => set.id === selected) || content.sets[0];
  const previewMystery =
    selectedSet.mysteries[previewIndex] || selectedSet.mysteries[0];
  const mystery =
    step?.mystery ||
    [...steps.slice(0, progress?.position || 0)]
      .reverse()
      .find((item) => item.mystery)?.mystery ||
    activeSet.mysteries[0];
  const mysteryPosition =
    step?.mysteryIndex !== undefined
      ? step.mysteryIndex + 1
      : Math.max(
          1,
          activeSet.mysteries.findIndex((item) => item.id === mystery.id) + 1,
        );
  const beadTotal = step?.bead ? (step.mysteryIndex !== undefined ? 10 : 3) : 0;
  const stageSummary =
    step?.mysteryIndex !== undefined
      ? `${step.mysteryIndex + 1}º Mistério ${activeSet.title}`
      : (progress?.position || 0) < 8
        ? "Orações iniciais"
        : "Orações finais";
  function go(position) {
    rosary.go(Math.max(0, Math.min(steps.length, position)));
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width:720px)").matches)
        heading.current
          ?.closest(".p-prayer-card")
          ?.scrollIntoView({ block: "start" });
    });
  }
  function begin() {
    if (progress && !completed && !restart) {
      setRestart(true);
      return;
    }
    rosary.start(selected, { full, fatima });
    setPraying(true);
    setRestart(false);
  }
  return (
    <PrayerLayout title="Santo Rosário Guiado">
      <div
        className={`p-container p-rosary ${focusMode ? "p-focus-mode" : ""} ${praying && progress ? "is-praying" : ""}`}
      >
        <div className="p-page-head">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>Santo Rosário
          </div>
          <p className="p-eyebrow">CONTEMPLAR COM MARIA</p>
          <h1>
            {praying && progress ? (
              "Santo Rosário"
            ) : (
              <>
                O Santo Rosário.
                <br className="p-mobile-only" /> Um encontro, conta a conta.
              </>
            )}
          </h1>
          <p>
            Faça uma pausa. Entregue este momento a Deus e deixe que cada oração
            conduza seu coração a Jesus.
          </p>
        </div>
        {!ready ? (
          <p className="p-loading" role="status">
            Preparando seu momento de oração…
          </p>
        ) : (
          <>
            {rosary.conflict ? (
              <section className="p-panel p-conflict" role="alert">
                <h2>Qual oração você deseja continuar?</h2>
                <p>
                  Encontramos dois progressos diferentes. Você escolhe; nenhum
                  será substituído sem sua decisão.
                </p>
                <div className="p-choice-grid">
                  <button
                    onClick={() => rosary.choose(false)}
                    className="p-button p-button-outline"
                  >
                    Neste navegador · etapa {(progress?.position || 0) + 1}
                  </button>
                  <button
                    onClick={() => rosary.choose(true)}
                    className="p-button"
                  >
                    {rosary.conflict.label} · etapa{" "}
                    {(rosary.conflict.progress?.position || 0) + 1}
                  </button>
                </div>
              </section>
            ) : null}
            {!praying || !progress ? (
              <>
                {progress && completed ? (
                  <p className="p-notice" role="status">
                    Seu último roteiro foi concluído. Que a oração continue no
                    seu dia.
                  </p>
                ) : null}
                {progress && !completed ? (
                  <section className="p-resume">
                    <Icon name="rosary" size={30} />
                    <div>
                      <p className="p-eyebrow">
                        SEU MOMENTO DE ORAÇÃO CONTINUA
                      </p>
                      <h2>Há um caminho esperando por você.</h2>
                      <p>
                        {
                          content.sets.find((set) => set.id === progress.setId)
                            ?.title
                        }{" "}
                        · {Math.round((progress.position / steps.length) * 100)}
                        % do roteiro percorrido
                      </p>
                    </div>
                    <button
                      className="p-button"
                      onClick={() => setPraying(true)}
                      disabled={Boolean(rosary.conflict)}
                    >
                      Continuar oração
                      <Icon name="arrow" size={16} />
                    </button>
                  </section>
                ) : null}
                <section className="p-rosary-prepare">
                  <div>
                    <p className="p-section-label">ESCOLHA OS MISTÉRIOS</p>
                    <div className="p-mystery-options">
                      {content.sets.map((set) => (
                        <button
                          key={set.id}
                          className={`p-mystery-option ${selected === set.id ? "is-selected" : ""}`}
                          onClick={() => {
                            setSelected(set.id);
                            setPreviewIndex(0);
                            setManualSelection(true);
                            setRestart(false);
                          }}
                          aria-pressed={selected === set.id}
                        >
                          <span className={`p-set-dot ${set.color}`} />
                          <span className="p-mystery-copy">
                            <strong>{set.title}</strong>
                            <small>{set.subtitle}</small>
                            <span className="p-mystery-days">
                              <Icon name="calendar" size={13} />
                              <span>
                                {[...set.days]
                                  .sort((a, b) => (a || 7) - (b || 7))
                                  .map((day) => WEEKDAYS[day])
                                  .join(" e ")}
                              </span>
                            </span>
                            {daySet === set.id ? (
                              <span className="p-mystery-today">
                                Mistérios de hoje
                              </span>
                            ) : null}
                          </span>
                          {selected === set.id ? (
                            <Icon name="check" size={18} />
                          ) : null}
                        </button>
                      ))}
                    </div>
                    <p className="p-muted p-day-hint">
                      <Icon name="sun" size={15} />
                      Sugestão de hoje:{" "}
                      {content.sets.find((set) => set.id === daySet)?.title}, no
                      horário de Brasília. A distribuição semanal é uma tradição
                      devocional: você pode escolher qualquer conjunto.
                    </p>
                    <div className="p-rosary-preferences">
                      <label className="p-check">
                        <input
                          type="checkbox"
                          checked={full}
                          onChange={(e) => setFull(e.target.checked)}
                        />
                        Rezar os quatro conjuntos em sequência (20 mistérios)
                      </label>
                      <label className="p-check">
                        <input
                          type="checkbox"
                          checked={fatima}
                          onChange={(e) => setFatima(e.target.checked)}
                        />
                        Incluir a jaculatória de Fátima ao fim de cada dezena
                      </label>
                    </div>
                    {restart ? (
                      <div className="p-notice">
                        Começar outra oração substituirá o ponto de retomada
                        atual.{" "}
                        <button
                          className="p-inline-button"
                          onClick={() => setRestart(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : null}
                    <button
                      className="p-button p-start-prayer"
                      onClick={begin}
                      disabled={Boolean(rosary.conflict)}
                    >
                      <Icon name="rosary" />
                      {restart
                        ? "Confirmar nova oração"
                        : "Começar este momento"}
                      <Icon name="arrow" size={17} />
                    </button>
                    <p className="p-muted">
                      {rosary.authenticated ? (
                        "Seu ponto de retomada é salvo no navegador e sincronizado com sua conta quando houver conexão."
                      ) : (
                        <>
                          Seu ponto de retomada fica neste navegador.{" "}
                          <Link href="/login" className="p-inline-link">
                            Entre para salvar também na sua conta.
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="p-preview-mysteries">
                    <figure className="p-mystery-frame">
                      <div className="p-mystery-frame-meta">
                        <span>
                          {previewIndex + 1}º MISTÉRIO ·{" "}
                          {selectedSet.title.toUpperCase()}
                        </span>
                        <span>{previewMystery.scripture}</span>
                      </div>
                      <div className="p-mystery-frame-art">
                        <Image
                          key={previewMystery.id}
                          src={previewMystery.image}
                          alt={previewMystery.imageAlt}
                          width={600}
                          height={720}
                          priority
                        />
                      </div>
                    </figure>
                    <div className="p-preview-mysteries-body">
                      <p className="p-eyebrow">
                        CINCO ENCONTROS PARA CONTEMPLAR
                      </p>
                      <ol>
                        {selectedSet.mysteries.map((item, i) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={`p-preview-item ${previewIndex === i ? "is-active" : ""}`}
                              onClick={() => setPreviewIndex(i)}
                              aria-pressed={previewIndex === i}
                            >
                              <span>{String(i + 1).padStart(2, "0")}</span>
                              <span className="p-preview-item-copy">
                                <strong>{item.title}</strong>
                                <small>{item.scripture}</small>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </section>
              </>
            ) : completed ? (
              <section className="p-prayer-complete">
                <Icon name="cross" size={38} />
                <p className="p-eyebrow">PERMANEÇA NA PAZ DE CRISTO</p>
                <h2>
                  Que esta oração
                  <br />
                  <em>continue na sua vida.</em>
                </h2>
                <p>
                  Você chegou ao final do roteiro. Leve para o seu dia o amor
                  contemplado nos mistérios de Jesus e Maria.
                </p>
                <div className="p-actions">
                  <Link href="/capelinha" className="p-button">
                    <Icon name="candle" />
                    Apresentar uma intenção
                  </Link>
                  <button
                    className="p-button p-button-outline"
                    onClick={() => {
                      setPraying(false);
                      setFocusMode(false);
                    }}
                  >
                    Rezar novamente
                  </button>
                </div>
              </section>
            ) : (
              <>
                <div className="p-prayer-toolbar">
                  <button
                    className="p-inline-button"
                    onClick={() => {
                      setPraying(false);
                      setFocusMode(false);
                    }}
                  >
                    <Icon name="back" size={16} />
                    Pausar e voltar
                  </button>
                  <span>
                    {progress.full
                      ? "Rosário completo"
                      : `Mistérios ${activeSet.title}`}
                  </span>
                  <div>
                    <button
                      aria-label="Alterar tamanho do texto"
                      className="p-font-button"
                      onClick={() =>
                        setFontSize((value) =>
                          value >= 1.3 ? 1 : value + 0.15,
                        )
                      }
                    >
                      A<span>A</span>
                    </button>
                    <button
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
                      {stageSummary.toUpperCase()}
                    </span>
                    <span>
                      {Math.round((progress.position / steps.length) * 100)}%
                    </span>
                  </div>
                  <progress
                    value={progress.position}
                    max={steps.length}
                    aria-label="Progresso do roteiro de oração"
                  />
                </div>
                <div className="p-prayer-workspace">
                  <aside
                    className="p-contemplation"
                    aria-label="Mistério contemplado"
                  >
                    <figure className="p-mystery-frame">
                      <div className="p-mystery-frame-meta">
                        <span>
                          {mysteryPosition}º DE {activeSet.mysteries.length}{" "}
                          MISTÉRIOS
                        </span>
                        <span>{activeSet.title.toUpperCase()}</span>
                      </div>
                      <div className="p-mystery-frame-art">
                        <Image
                          key={mystery.id}
                          src={mystery.image}
                          alt={mystery.imageAlt}
                          width={600}
                          height={720}
                          priority
                        />
                      </div>
                    </figure>
                    <div className="p-contemplation-body">
                      <p className="p-eyebrow">
                        {step.mysteryIndex !== undefined
                          ? `${mysteryPosition}º MISTÉRIO · PARA CONTEMPLAR`
                          : "PARA CONTEMPLAR · 1º MISTÉRIO"}
                      </p>
                      <h2>{mystery.title}</h2>
                      <p className="p-contemplation-scripture">
                        <Icon name="book" size={14} />
                        <span>{mystery.scripture}</span>
                      </p>
                      <details
                        key={`${mystery.id}-${step.prayer === "contemplacao" ? "open" : "closed"}`}
                        open={step.prayer === "contemplacao"}
                      >
                        <summary>Uma meditação para este mistério</summary>
                        <p>{mystery.meditation}</p>
                        <small>{mystery.credit}</small>
                      </details>
                    </div>
                  </aside>
                  <section className="p-prayer-card">
                    <div className="p-prayer-card-top">
                      <div className="p-prayer-card-heading">
                        <span className="p-section-label">
                          {step.mysteryIndex !== undefined
                            ? `${step.mysteryIndex + 1}º MISTÉRIO ${activeSet.title.toUpperCase()}`
                            : "NA PRESENÇA DE DEUS"}
                        </span>
                        {step.mysteryIndex !== undefined &&
                        step.prayer !== "contemplacao" ? (
                          <span className="p-prayer-mystery-name">
                            {mystery.title}
                          </span>
                        ) : null}
                      </div>
                      <Icon name="cross" size={19} />
                    </div>
                    <div className="p-prayer-meta">
                      <p className="p-prayer-label">
                        {step.label ||
                          (step.prayer === "contemplacao"
                            ? "Faça uma pausa e contemple"
                            : "Reze com serenidade")}
                      </p>
                      {beadTotal > 0 ? (
                        <div className="p-decade-beads" aria-hidden="true">
                          {Array.from({ length: beadTotal }, (_, i) => {
                            const index = i + 1;
                            return (
                              <span
                                key={index}
                                className={`p-decade-dot ${index < step.bead ? "is-done" : ""} ${index === step.bead ? "is-current" : ""}`}
                              />
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <h2 ref={heading} tabIndex={-1} className="p-prayer-title">
                      {step.title}
                    </h2>
                    <p
                      className="p-prayer-text"
                      style={{ "--prayer-scale": fontSize }}
                      key={step.id}
                    >
                      {step.text}
                    </p>
                    {step.prayer === "contemplacao" ? (
                      <p className="p-scripture">
                        <Icon name="book" size={16} />
                        Leia na sua Bíblia: {step.mystery.scripture}
                      </p>
                    ) : null}
                    <div className="p-prayer-controls">
                      <button
                        className="p-button p-button-outline"
                        disabled={progress.position === 0}
                        onClick={() => go(progress.position - 1)}
                        aria-label="Oração anterior"
                      >
                        <Icon name="back" size={17} />
                        <span>Anterior</span>
                      </button>
                      <button
                        className="p-button"
                        onClick={() => go(progress.position + 1)}
                      >
                        {step.prayer === "contemplacao"
                          ? "Iniciar esta dezena"
                          : progress.position === steps.length - 1
                            ? "Concluir oração"
                            : "Próxima oração"}
                        <Icon name="arrow" size={17} />
                      </button>
                    </div>
                    <div className="p-save-indicator" role="status">
                      <Icon
                        name={rosary.saveState === "saved" ? "check" : "lock"}
                        size={13}
                      />
                      {
                        {
                          saved: "Progresso salvo na sua conta",
                          saving: "Salvando com cuidado…",
                          local: "Retomada salva neste navegador",
                          memory:
                            "Armazenamento bloqueado: mantenha esta aba aberta",
                        }[rosary.saveState]
                      }
                      {rosary.authenticated && rosary.saveState === "local" ? (
                        <button
                          className="p-inline-button"
                          onClick={rosary.retrySave}
                        >
                          Sincronizar
                        </button>
                      ) : null}
                    </div>
                  </section>
                  <aside className="p-beads-panel" aria-label="Contas do terço">
                    <p className="p-section-label">ACOMPANHE NAS CONTAS</p>
                    <Beads
                      steps={steps}
                      position={progress.position}
                      onSelect={go}
                      setId={activeSet.id}
                    />
                    <p>
                      Toque em uma conta para ir à oração.
                      <br />
                      Sem pressa. Este tempo é seu.
                    </p>
                  </aside>
                </div>
              </>
            )}
            <div className="p-rosary-footnote">
              <Icon name="book" size={17} />
              <p>
                Orações tradicionais e meditações inspiradas nas Sagradas
                Escrituras.{" "}
                <Link href="/fontes">Conheça as fontes e os créditos.</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </PrayerLayout>
  );
}
