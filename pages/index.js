import React, { useState } from 'react';

function Home() {
  // Cria um estado para controlar a visibilidade do emoticon
  const [mostrarEmoticon, setMostrarEmoticon] = useState(false);

  return (
    <div>
      <h1>Sempre que houver alternativas, tenha cuidado. Não opte pelo conveniente, pelo confortável, pelo respeitável, pelo socialmente aceitável, pelo honroso. Opte pelo que faz o seu coração vibrar. Opte pelo que gostaria de fazer, apesar de todas as consequências. -Osho!</h1>
      {/* Botão que ao ser clicado altera o estado para verdadeiro, mostrando o emoticon */}
      <button onClick={() => setMostrarEmoticon(true)}>Enviar Beijo</button>
      {/* Exibe o emoticon se o estado mostrarEmoticon for verdadeiro */}
      {mostrarEmoticon && <p>😘</p>}
    </div>
  );
}

export default Home;