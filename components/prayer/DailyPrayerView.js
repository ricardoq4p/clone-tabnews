import { useState } from "react";
import Link from "next/link";
import PrayerLayout from "./Layout";
import Icon from "./Icon";
import {
  DAILY_PRAYER_SCALE,
  adjustPrayerFontScale,
  copyPrayerText,
  sharePrayerText,
} from "@/lib/oratorio/daily-prayers";

export default function DailyPrayerView({ page }) {
  const prayers = page?.prayers || [];
  const [activeId, setActiveId] = useState(prayers[0]?.id || "");
  const [fontScale, setFontScale] = useState(DAILY_PRAYER_SCALE.default);
  const [feedback, setFeedback] = useState({});

  function showFeedback(prayerId, message) {
    setFeedback((prev) => ({ ...prev, [prayerId]: message }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setFeedback((prev) => ({ ...prev, [prayerId]: "" }));
      }, 2600);
    }
  }

  function handleSelectPrayer(prayerId) {
    setActiveId(prayerId);
    if (typeof document !== "undefined") {
      const target = document.getElementById(`oracao-${prayerId}`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleCopy(prayer) {
    try {
      const result = await copyPrayerText(prayer);
      if (result.ok) {
        showFeedback(prayer.id, "Oração copiada");
      }
    } catch {
      showFeedback(prayer.id, "Não foi possível copiar");
    }
  }

  async function handleShare(prayer) {
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : page.href;
    try {
      const result = await sharePrayerText(prayer, shareUrl);
      if (result.ok) {
        showFeedback(
          prayer.id,
          result.method === "web-share"
            ? "Oração compartilhada"
            : "Texto copiado para compartilhar",
        );
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        showFeedback(prayer.id, "Não foi possível compartilhar");
      }
    }
  }

  return (
    <PrayerLayout title={page.seoTitle} description={page.seoDescription}>
      <div className="p-container pl-daily-prayer-page">
        <div className="p-page-head pl-daily-prayer-head">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/oratorio">Oratório</Link>
            <span>/</span>
            <Link href="/oratorio#oracoes-do-dia-a-dia">Orações</Link>
            <span>/</span>
            {page.breadcrumbTitle}
          </div>
          <p className="p-eyebrow">
            <span aria-hidden="true" />
            {page.category}
          </p>
          <h1>{page.title}</h1>
          <p className="pl-daily-prayer-subtitle">{page.subtitle}</p>
        </div>

        {prayers.length > 1 ? (
          <section
            className="pl-daily-prayer-options"
            aria-label="Escolha uma oração para leitura"
          >
            {prayers.map((prayer) => {
              const isSelected = activeId === prayer.id;
              return (
                <div
                  key={prayer.id}
                  className={`pl-daily-prayer-option ${isSelected ? "is-selected" : ""}`}
                >
                  <div>
                    <span className="pl-daily-prayer-badge">
                      {prayer.badge}
                    </span>
                    <h2>{prayer.title}</h2>
                    <p>{prayer.presentation}</p>
                  </div>
                  <button
                    type="button"
                    className={
                      isSelected ? "p-button" : "p-button p-button-outline"
                    }
                    aria-pressed={isSelected}
                    onClick={() => handleSelectPrayer(prayer.id)}
                  >
                    Ler {prayer.title}
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              );
            })}
          </section>
        ) : null}

        <div className="pl-daily-prayer-toolbar" aria-label="Tamanho do texto">
          <span className="p-section-label">LEITURA</span>
          <div className="pl-daily-prayer-font-controls">
            <button
              type="button"
              className="p-font-button"
              aria-label="Diminuir tamanho da fonte"
              disabled={fontScale <= DAILY_PRAYER_SCALE.min}
              onClick={() =>
                setFontScale((current) =>
                  adjustPrayerFontScale(current, -DAILY_PRAYER_SCALE.step),
                )
              }
            >
              A-
            </button>
            <button
              type="button"
              className="p-font-button"
              aria-label="Aumentar tamanho da fonte"
              disabled={fontScale >= DAILY_PRAYER_SCALE.max}
              onClick={() =>
                setFontScale((current) =>
                  adjustPrayerFontScale(current, DAILY_PRAYER_SCALE.step),
                )
              }
            >
              A+
            </button>
          </div>
        </div>

        <div className="pl-daily-prayer-stack">
          {prayers.map((prayer) => (
            <article
              key={prayer.id}
              id={`oracao-${prayer.id}`}
              className={`p-panel pl-daily-prayer-card ${
                prayers.length > 1 && activeId === prayer.id ? "is-focused" : ""
              }`}
            >
              <header className="pl-daily-prayer-card-head">
                <div>
                  <span className="pl-daily-prayer-badge">{prayer.badge}</span>
                  <h2>{prayer.title}</h2>
                  {prayer.presentation ? (
                    <p className="pl-daily-prayer-presentation">
                      {prayer.presentation}
                    </p>
                  ) : null}
                </div>
                <Icon name="cross" size={18} />
              </header>

              <div
                className="pl-daily-prayer-body"
                style={{ "--prayer-scale": fontScale }}
              >
                {prayer.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <footer className="pl-daily-prayer-actions">
                <div className="pl-daily-prayer-action-buttons">
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    onClick={() => handleCopy(prayer)}
                  >
                    Copiar oração
                  </button>
                  <button
                    type="button"
                    className="p-button p-button-outline"
                    onClick={() => handleShare(prayer)}
                  >
                    Compartilhar
                  </button>
                </div>
                {feedback[prayer.id] ? (
                  <span
                    className="pl-daily-prayer-feedback"
                    role="status"
                    aria-live="polite"
                  >
                    {feedback[prayer.id]}
                  </span>
                ) : null}
              </footer>
            </article>
          ))}
        </div>

        <div className="pl-daily-prayer-return">
          <Link href="/oratorio" className="p-button p-button-outline">
            <Icon name="back" size={16} />
            Voltar ao Oratório
          </Link>
        </div>
      </div>
    </PrayerLayout>
  );
}
