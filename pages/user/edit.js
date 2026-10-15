import Link from "next/link";
export default function ProfileShortcut() {
  return (
    <section className="p-container p-section">
      <div className="p-panel">
        <p className="p-eyebrow">SUA CONTA</p>
        <h1>Seu perfil</h1>
        <p>Sua foto e seus recursos pessoais estão disponíveis no perfil.</p>
        <Link href="/profile" className="p-button">
          Abrir meu perfil
        </Link>
      </div>
    </section>
  );
}
