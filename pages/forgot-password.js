import { useState } from "react";
import Link from "next/link";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Nao foi possivel enviar o link de recuperacao.");
        return;
      }

      setSuccess(
        data?.message ||
          "Se existir uma conta com esse email, enviaremos um link para redefinir a senha.",
      );
      setEmail("");
    } catch {
      setError("Erro de conexao com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recupere o acesso sem sair do fluxo."
      subtitle="Digite seu email e enviaremos um link para criar uma nova senha."
      footer={
        <p className="text-center text-sm text-slate-400">
          Lembrou da senha?{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            Voltar para o login
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
          Recuperar senha
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Receba um link por email
        </h2>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Email</span>
          <input
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="field-input"
          />
        </label>

        <button type="submit" disabled={loading} className="primary-button w-full">
          {loading ? "Enviando..." : "Enviar link de recuperacao"}
        </button>
      </form>
    </AuthLayout>
  );
}
