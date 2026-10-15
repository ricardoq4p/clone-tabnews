import Icon from "../prayer/Icon";
export default function Beads({ steps, position, onSelect, setId }) {
  const beads = steps
    .map((step, index) => ({ ...step, index }))
    .filter(
      (step) =>
        ["pai", "ave"].includes(step.prayer) &&
        (!step.setId || step.setId === setId),
    );
  const initial = beads.filter((step) => !step.mystery),
    ring = beads.filter((step) => step.mystery);
  return (
    <div
      className="p-beads"
      role="group"
      aria-label="Contas do terço. Selecione uma conta para ir à oração correspondente."
    >
      <svg viewBox="0 0 280 360" aria-hidden="true">
        <ellipse cx="140" cy="137" rx="102" ry="115" />
        <path d="M140 252v77" />
      </svg>
      <div className="p-beads-center">
        <Icon name="cross" size={24} />
        <span>
          COM MARIA,
          <br />
          ATÉ JESUS
        </span>
      </div>
      {ring.map((step, index) => {
        const angle = Math.PI / 2 + (index / ring.length) * Math.PI * 2;
        return (
          <button
            key={step.id}
            className={`p-bead ${step.prayer === "pai" ? "p-bead-large" : ""} ${step.index < position ? "is-done" : ""} ${step.index === position ? "is-current" : ""}`}
            style={{
              left: `${((140 + 102 * Math.cos(angle)) / 280) * 100}%`,
              top: `${((137 + 115 * Math.sin(angle)) / 360) * 100}%`,
            }}
            onClick={() => onSelect(step.index)}
            aria-current={step.index === position ? "step" : undefined}
            aria-label={
              step.prayer === "pai"
                ? `Pai-Nosso do ${step.mysteryIndex + 1}º mistério`
                : step.label
            }
          >
            <span />
          </button>
        );
      })}
      {initial.map((step, index) => (
        <button
          key={step.id}
          className={`p-bead ${step.prayer === "pai" ? "p-bead-large" : ""} ${step.index < position ? "is-done" : ""} ${step.index === position ? "is-current" : ""}`}
          style={{
            left: "50%",
            top: `${((270 + (3 - index) * 18) / 360) * 100}%`,
          }}
          onClick={() => onSelect(step.index)}
          aria-label={`${step.title} inicial${step.bead ? ` ${step.bead}` : ""}`}
        >
          <span />
        </button>
      ))}
      <button
        className="p-bead-cross"
        onClick={() => onSelect(0)}
        aria-label="Voltar ao Sinal da Cruz"
      >
        <Icon name="cross" size={21} />
      </button>
    </div>
  );
}
