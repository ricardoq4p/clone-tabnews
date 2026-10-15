import Link from "next/link";
import PrayerLayout from "@/components/prayer/Layout";
export default function Sobre() {
  return (
    <PrayerLayout title="Nossa casa de oração">
      <article className="p-container p-document">
        <div className="p-page-head">
          <p className="p-eyebrow">UMA CASA ABERTA AO ENCONTRO</p>
          <h1>
            Pequenos gestos de fé.
            <br />
            <em>Um caminho em comunidade.</em>
          </h1>
        </div>
        <p>
          O PanteraLab é um espaço para apoiar a oração católica no cotidiano:
          contemplar com Maria a vida de Jesus, apresentar intenções e
          acompanhar outras pessoas com respeito e caridade.
        </p>
        <h2>Rezar no seu ritmo</h2>
        <p>
          O Santo Rosário está aberto a todos. Você pode seguir as orações,
          contemplar as imagens, voltar a uma conta e retomar depois. Não há
          metas de velocidade ou comparação entre participantes.
        </p>
        <h2>Uma luz como gesto de confiança</h2>
        <p>
          Na Capelinha, a vela virtual é um símbolo gratuito de uma intenção
          apresentada a Deus. Sua luz acompanha a intenção durante sete dias. A
          experiência apoia a oração pessoal e a participação na Santa Missa e
          nos sacramentos, na vida concreta da Igreja.
        </p>
        <h2>O jeito de caminhar nesta comunidade</h2>
        <ul>
          <li>
            Acolha sem julgar. Evite ataques, discriminação e exposição de
            outras pessoas.
          </li>
          <li>
            Partilhe testemunhos com verdade e reflexões com fidelidade ao
            ensinamento da Igreja.
          </li>
          <li>
            Preserve informações pessoais, especialmente de crianças e pessoas
            em sofrimento.
          </li>
          <li>
            Use o botão de oração como um gesto de intercessão. As contagens não
            medem a fé de ninguém.
          </li>
          <li>Sinalize à moderação conteúdos que precisem de cuidado.</li>
        </ul>
        <div className="p-actions">
          <Link href="/rosario" className="p-button">
            Encontrar meu momento de oração
          </Link>
          <Link href="/comunidade" className="p-button p-button-outline">
            Conhecer a comunidade
          </Link>
        </div>
      </article>
    </PrayerLayout>
  );
}
