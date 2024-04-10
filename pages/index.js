import React from "react";

const HomePage = () => {
  // Aqui você pode adicionar lógica JavaScript adicional, como estados e efeitos, se necessário.

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "rgb(227, 227, 238)",
        color: "white",
        fontSize: "20pt",
      }}
    >
      <header
        style={{
          textAlign: "center",
          padding: "20px",
          borderBottom: "2px solid #000",
        }}
      >
        <img
          src="https://github.com/ricardoq4p/clone-tabnews/blob/main/PanteraLab.png?raw=true"
          alt="Logo Pantera Lab"
          style={{ height: "100px" }}
        />
        <h1 style={{ color: "rgb(45, 75, 134)" }}>Seu futuro mini-fórum!</h1>
      </header>

      <main
        style={{
          textAlign: "center",
          padding: "20px",
          borderBottom: "2px solid #000",
          minHeight: "400px",
          color: "rgb(45, 75, 134)",
        }}
      >
        <p>SITE EM CONSTRUÇÃO!</p>
        {/* Para interações dinâmicas, considere usar estado e outros hooks do React */}
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "20px",
          borderTop: "2px solid #000",
          color: "rgb(45, 75, 134)",
        }}
      >
        <p>Instagram @pug_pantera</p>
      </footer>
    </div>
  );
};

export default HomePage;
