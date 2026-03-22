import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #1a1a1a 0%, #000 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {/* NOME */}
      <p style={{ opacity: 0.4, marginBottom: "20px", letterSpacing: "2px" }}>
        PANTERALAB
      </p>

      {/* FRASE PRINCIPAL */}
      <h1
        style={{
          fontSize: "2.8rem",
          fontWeight: "500",
          maxWidth: "700px",
          lineHeight: "1.4",
          marginBottom: "20px",
        }}
      >
        Em silêncio, tudo fala.
      </h1>

      {/* FRASE SECUNDÁRIA */}
      <p
        style={{
          opacity: 0.6,
          maxWidth: "500px",
          marginBottom: "40px",
        }}
      >
        Entre. Observe. Permaneça.
      </p>

      {/* BOTÃO */}
      <Link href="/feed">
        <button
          style={{
            padding: "10px 22px",
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "20px",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          Entrar
        </button>
      </Link>
    </div>
  );
}
