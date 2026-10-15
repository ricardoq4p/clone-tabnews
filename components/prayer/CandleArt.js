export default function CandleArt({ lit = true, small = false }) {
  return (
    <div
      className={`p-candle-art ${lit ? "is-lit" : ""} ${small ? "is-small" : ""}`}
      aria-hidden="true"
    >
      <div className="p-candle-aura" />
      <div className="p-flame">
        <i />
      </div>
      <div className="p-wick" />
      <div className="p-wax">
        <span>✝</span>
      </div>
      <div className="p-candle-base" />
    </div>
  );
}
