import { useState } from "react";
import Link from "next/link";
import AuthLayout from "../components/AuthLayout";
export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/users/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message || data.error || "Tente novamente.");
    } catch {
      setMessage("Nao foi possivel conectar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title="Confirme seu email"
      subtitle="Solicite um novo link para ativar sua conta."
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field-input mt-2"
          />
        </label>
        <button disabled={busy} className="primary-button">
          {busy ? "Enviando..." : "Reenviar confirmacao"}
        </button>
        <p role="status">{message}</p>
        <Link href="/login" className="block text-cyan-200">
          Voltar ao login
        </Link>
      </form>
    </AuthLayout>
  );
}
