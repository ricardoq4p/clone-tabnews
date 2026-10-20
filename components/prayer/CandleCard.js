import ReportButton from "./ReportButton";
import { useState } from "react";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";
import CandleArt from "./CandleArt";
import PrayerButton from "./PrayerButton";
import Icon from "./Icon";
export default function CandleCard({ candle, now, history, onUpdate }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const active = candle.status
    ? candle.status === "active" && new Date(candle.expiresAt).getTime() > now
    : new Date(candle.expiresAt).getTime() > now;
  const remaining = Math.max(0, new Date(candle.expiresAt).getTime() - now);
  const days = Math.ceil(remaining / 86400000),
    hours = Math.ceil(remaining / 3600000);
  async function change(body) {
    setBusy(true);
    setError("");
    try {
      const data = await requestJson(
        `/api/velas/${candle._id}`,
        jsonRequest("PATCH", body),
      );
      onUpdate?.(data.candle);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      id={`candle-${candle._id}`}
      className={`p-candle-card ${!active ? "is-archived" : ""}`}
    >
      <div className="p-candle-card-art">
        <CandleArt lit={active} small />
        <span className="p-candle-privacy">
          <Icon
            name={
              candle.visibility === "private"
                ? "lock"
                : candle.visibility === "anonymous"
                  ? "leaf"
                  : "people"
            }
            size={11}
          />
          {
            { public: "Pública", anonymous: "Anônima", private: "Privada" }[
              candle.visibility
            ]
          }
        </span>
      </div>
      <div className="p-candle-card-copy">
        <p className="p-candle-author">{candle.author}</p>
        <p className="p-intention">{candle.intention}</p>
        <p className="p-candle-time">
          <Icon name="clock" size={12} />
          {active
            ? hours <= 24
              ? `Acesa por mais ${hours} ${hours === 1 ? "hora" : "horas"}`
              : `Acesa por mais ${days} dias`
            : candle.status === "hidden"
              ? "Recolhida pela moderação"
              : candle.status === "withdrawn"
                ? "Retirada por você"
                : "Sete dias de oração concluídos"}
        </p>
        <p className="p-candle-date">
          Acendimento em {formatPrayerDate(candle.createdAt)} · até{" "}
          {formatPrayerDate(candle.expiresAt, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {active ? (
          <PrayerButton
            endpoint={`/api/velas/${candle._id}/oracao`}
            initialPrayed={candle.prayed}
            initialCount={candle.supportCount}
          />
        ) : (
          <p className="p-muted">
            {candle.supportCount}{" "}
            {candle.supportCount === 1 ? "pessoa se uniu" : "pessoas se uniram"}{" "}
            a esta intenção.
          </p>
        )}
        {!history && active ? (
          <ReportButton targetType="candle" targetId={candle._id} />
        ) : null}
        {history ? (
          <div className="p-candle-manage">
            <label>
              Visibilidade
              <select
                aria-label="Visibilidade desta intenção"
                value={candle.visibility}
                disabled={busy}
                onChange={(e) =>
                  change({ action: "privacy", visibility: e.target.value })
                }
              >
                <option value="public">Pública</option>
                <option value="anonymous">Anônima</option>
                <option value="private">Privada</option>
              </select>
            </label>
            {active ? (
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Retirar esta vela da Capelinha? Ela continuará no seu histórico, sem renovar o prazo.",
                    )
                  )
                    change({ action: "withdraw" });
                }}
              >
                Retirar vela
              </button>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="p-error">
            {error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
