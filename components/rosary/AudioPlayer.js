import { AUDIO_RATES } from "@/lib/rosary/audio-catalog";
import styles from "@/styles/RosaryAudio.module.css";

const messages = {
  idle: "Toque em reproduzir para começar.",
  paused: "Áudio pausado. Seu ponto foi preservado.",
  playing: "Acompanhe a oração. Os silêncios também fazem parte deste momento.",
  loading: "Preparando o áudio…",
  finished: "Oração ouvida. Avance quando estiver pronto ou ouça novamente.",
  unavailable:
    "Esta etapa ainda não tem gravação correspondente ao texto atual. Continue pelo texto.",
  error: "Não foi possível reproduzir. Tente novamente ou continue pelo texto.",
  blocked: "Toque em reproduzir para continuar o áudio.",
  complete: "Você chegou ao fim do roteiro de oração.",
};
const clock = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function AudioPlayer({
  audio,
  onDisable,
  onPrevious,
  onNext,
  first,
  title,
}) {
  const playing = ["playing", "loading"].includes(audio.status);
  return (
    <section className={styles.player} aria-label="Rosário com áudio">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            REZAR COM ÁUDIO · ORAÇÃO GUIADA
          </span>
          <h2>{title}</h2>
        </div>
        <button type="button" className="p-inline-button" onClick={onDisable}>
          Desativar áudio
        </button>
      </div>
      <p className={styles.note}>
        Narração serena em português brasileiro para todas as orações e os vinte
        mistérios do Santo Rosário.
      </p>
      <div className={styles.options}>
        <label>
          Como avançar
          <select
            aria-label="Como avançar"
            value={audio.mode}
            onChange={(event) => audio.setMode(event.target.value)}
          >
            <option value="manual">Manual</option>
            <option value="continuous">Contínuo</option>
          </select>
        </label>
        <label>
          Velocidade
          <select
            aria-label="Velocidade"
            value={audio.rate}
            onChange={(event) => audio.setRate(Number(event.target.value))}
          >
            {AUDIO_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {String(rate).replace(".", ",")}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.note}>
        {audio.mode === "continuous"
          ? "Após cada oração e sua pausa, seguimos para a próxima conta."
          : "Ouça a oração e avance quando estiver pronto, no seu ritmo."}
      </p>
      <div className={styles.controls}>
        <button
          type="button"
          className="p-button p-button-outline"
          disabled={first}
          onClick={onPrevious}
          aria-label="Oração anterior pelo áudio"
        >
          Anterior
        </button>
        <button
          type="button"
          className="p-button"
          disabled={!audio.available}
          onClick={playing ? audio.pause : audio.play}
        >
          {playing
            ? "Pausar áudio"
            : audio.status === "finished"
              ? "Ouvir novamente"
              : audio.time > 0
                ? "Continuar áudio"
                : "Reproduzir áudio"}
        </button>
        <button
          type="button"
          className="p-button p-button-outline"
          onClick={onNext}
          aria-label="Próxima oração pelo áudio"
        >
          Próxima
        </button>
      </div>
      <div className={styles.timeline} aria-label="Tempo do áudio">
        <progress
          value={audio.time}
          max={audio.duration || 1}
          aria-label="Progresso do áudio desta oração"
        />
        <span>
          {clock(audio.time)} / {clock(audio.duration)}
        </span>
      </div>
      <p className={styles.status} role="status">
        {audio.status === "playing" && audio.inSilence
          ? audio.contemplating
            ? "Um momento de silêncio para contemplar este mistério."
            : "Uma breve pausa para acolher a oração."
          : messages[audio.status]}
      </p>
      {audio.storageHealthy === false ? (
        <p role="alert">
          O navegador bloqueou o salvamento do áudio. Mantenha esta aba aberta
          para preservar a retomada.
        </p>
      ) : null}
    </section>
  );
}
