import React, { useState, useRef } from 'react';

function Home() {
  // Cria um estado para controlar a visibilidade do emoticon
  const [mostrarEmoticon, setMostrarEmoticon] = useState(false);
  // Cria um estado para controlar se o áudio está mutado
  const [isMuted, setIsMuted] = useState(false);
  // Ref para acessar o elemento de áudio
  const audioRef = useRef(null);

  // Função para mutar/desmutar a música
  const toggleMute = () => {
    // Verifica se o audioRef.current é nulo antes de tentar acessar sua propriedade
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div>
      <h1>Sempre que houver alternativas, tenha cuidado. Não opte pelo conveniente, pelo confortável, pelo respeitável, pelo socialmente aceitável, pelo honroso. Opte pelo que faz o seu coração vibrar. Opte pelo que gostaria de fazer, apesar de todas as consequências. -Osho!</h1>
      {/* Botão que ao ser clicado altera o estado para verdadeiro, mostrando o emoticon */}
      <button onClick={() => setMostrarEmoticon(true)}>Enviar Beijo</button>
      {/* Exibe o emoticon se o estado mostrarEmoticon for verdadeiro */}
      {mostrarEmoticon && <p>😘</p>}

      {/* Elemento de áudio para tocar a música de fundo */}
      <audio ref={audioRef} autoPlay loop>
        <source src="https://github.com/ricardoq4p/clone-tabnews/raw/main/21%20Savage%20-%20redrum%20(Lyrics)%20_uma%20palavra%20adeus_.mp3" type="audio/mpeg" />
        Seu navegador não suporta áudio em HTML5.
      </audio>

      {/* Botão para mutar/desmutar a música */}
      <button onClick={toggleMute}>{isMuted ? "Desmutar" : "Mutar"} Música</button>
    </div>
  );
}

export default Home;
