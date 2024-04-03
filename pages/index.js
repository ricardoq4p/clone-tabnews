import React, { useState } from "react";

function Home() {
  const [mostrarEmoticon, setMostrarEmoticon] = useState(false);

  return (
    <div style={{ backgroundColor: "hsl(180, 100%, 75%)", minHeight: "100vh" }}>
      <h1>
        Sempre que houver alternativas, tenha cuidado. Não opte pelo
        conveniente, pelo confortável, pelo respeitável, pelo socialmente
        aceitável, pelo honroso. Opte pelo que faz o seu coração vibrar. Opte
        pelo que gostaria de fazer, apesar de todas as consequências. -Osho!
      </h1>
      <button onClick={() => setMostrarEmoticon(true)}>
        Smile button of the killer toy
      </button>
      {mostrarEmoticon && <p>🐕</p>}
    </div>
  );
}

export default Home;
