import { useState } from "react";
import Image from "next/image";
import CandleCard from "./CandleCard";
import {
  activeSceneCandles,
  CHAPEL_PAGE_SIZE,
  CHAPEL_SLOTS,
} from "@/lib/chapel-scene";
import styles from "@/styles/Chapel.module.css";

export default function ChapelScene({
  candles,
  now,
  history,
  onUpdate,
  onRefresh,
  loading,
}) {
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const active = activeSceneCandles(candles, now, history);
  const pages = Math.max(1, Math.ceil(active.length / CHAPEL_PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const displayed = active.slice(
    currentPage * CHAPEL_PAGE_SIZE,
    (currentPage + 1) * CHAPEL_PAGE_SIZE,
  );
  const selected = active.find((candle) => candle._id === selectedId);
  const label = (index) =>
    `Selecionar vela ${currentPage * CHAPEL_PAGE_SIZE + index + 1}`;
  return (
    <section
      className={styles.sanctuary}
      aria-label="Cenário da Capelinha Virtual"
    >
      <div className={styles.scene}>
        <Image
          src="/sacred/capelinha-076db5e69b37.png"
          alt="Santuário mariano ao entardecer, com Nossa Senhora sobre o altar, vitrais azuis e degraus de mármore"
          width={1536}
          height={1024}
          priority
          unoptimized
          className={styles.image}
        />
        {displayed.map((candle, index) => {
          const slot = CHAPEL_SLOTS[index];
          return (
            <button
              key={candle._id}
              type="button"
              className={styles.candle}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                height: `${slot.height}%`,
              }}
              aria-label={label(index)}
              aria-pressed={selectedId === candle._id}
              aria-controls="chapel-selected-intention"
              onClick={() => setSelectedId(candle._id)}
            >
              <span className={styles.flame} aria-hidden="true" />
              <span className={styles.wick} aria-hidden="true" />
              <span className={styles.wax} aria-hidden="true" />
              <span className={styles.shadow} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className={styles.sceneControls}>
        <div className={styles.sceneCaption}>
          <p className={styles.eyebrow}>UM LUGAR PARA PERMANECER EM ORAÇÃO</p>
          <h2>
            {history
              ? "As luzes da sua oração"
              : "Cada luz, uma intenção entregue"}
          </h2>
          <p role="status">
            {loading
              ? "Preparando as velas…"
              : active.length
                ? "Selecione uma vela para conhecer sua intenção e unir-se em oração."
                : "A capelinha está em silêncio. Nenhuma vela ativa neste espaço."}
          </p>
          <p className={styles.privacyNote}>
            {history
              ? "Aqui aparecem somente suas velas ainda acesas. O histórico completo permanece abaixo."
              : "Somente intenções públicas e anônimas aparecem neste cenário."}
          </p>
        </div>
        {displayed.length > 0 && (
          <div
            className={styles.choices}
            role="group"
            aria-label="Selecionar uma vela nos degraus"
          >
            {displayed.map((candle, index) => (
              <button
                type="button"
                key={candle._id}
                aria-label={label(index)}
                aria-pressed={selectedId === candle._id}
                aria-controls="chapel-selected-intention"
                onClick={() => setSelectedId(candle._id)}
              >
                Vela {currentPage * CHAPEL_PAGE_SIZE + index + 1}
              </button>
            ))}
          </div>
        )}
        <div className={styles.navigation}>
          {pages > 1 && (
            <>
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Anteriores
              </button>
              <span>
                Página {currentPage + 1} de {pages}
              </span>
              <button
                type="button"
                disabled={currentPage === pages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Próximas
              </button>
            </>
          )}
          <button type="button" onClick={onRefresh} disabled={loading}>
            Atualizar velas
          </button>
        </div>
        <div
          id="chapel-selected-intention"
          className={styles.selection}
          aria-live="polite"
        >
          {selected && (
            <>
              <div className={styles.selectedHeading}>
                <h3>Uma intenção para sua oração</h3>
                <button type="button" onClick={() => setSelectedId(null)}>
                  Fechar intenção
                </button>
              </div>
              <CandleCard
                key={selected._id}
                candle={selected}
                now={now}
                history={history}
                onUpdate={onUpdate}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
