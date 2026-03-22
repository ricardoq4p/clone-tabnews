export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {/* HERO */}
      <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>
        Encontre paz em meio ao ruído do mundo
      </h1>

      <p style={{ maxWidth: "600px", marginBottom: "30px", opacity: 0.8 }}>
        O PanteraLab é um espaço de silêncio, reflexão e conexão com Deus.
        Receba mensagens profundas e caminhe com mais leveza todos os dias.
      </p>

      <a href="/login">
        <button
          style={{
            padding: "12px 24px",
            backgroundColor: "#ffffff",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Começar agora
        </button>
      </a>

      {/* SOBRE */}
      <section style={{ marginTop: "80px", maxWidth: "700px" }}>
        <h2>Um refúgio espiritual</h2>
        <p style={{ opacity: 0.8 }}>
          Aqui você encontra palavras que tocam a alma, imagens que despertam a
          consciência e mensagens que ajudam você a se reconectar com Deus no
          meio da correria do dia a dia.
        </p>
      </section>

      {/* FEATURES */}
      <section style={{ marginTop: "60px" }}>
        <p>✨ Mensagens inspiradas na fé</p>
        <p>✨ Reflexões profundas</p>
        <p>✨ Conteúdos exclusivos</p>
        <p>✨ Um espaço de paz e silêncio</p>
      </section>

      {/* CTA FINAL */}
      <section style={{ marginTop: "60px" }}>
        <a href="/login">
          <button
            style={{
              padding: "12px 24px",
              backgroundColor: "#ffffff",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Criar conta gratuitamente
          </button>
        </a>
      </section>
    </div>
  );
}
