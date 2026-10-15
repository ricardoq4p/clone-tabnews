import Link from "next/link";
export default function ProfileShortcut() {
  return (
    <section className="p-container p-section">
      <div className="p-panel">
        <p className="p-eyebrow">SUA CONTA</p>
        <h1>Foto de perfil</h1>
        <p>Envie e gerencie sua foto na página do seu perfil.</p>
        <Link href="/profile" className="p-button">
          Abrir meu perfil
        </Link>
      </div>
    </section>
  );
}
