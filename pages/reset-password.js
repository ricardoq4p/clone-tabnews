import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import AuthLayout from "../components/AuthLayout";

export default function ResetPassword() {
  const router = useRouter();
  const token = useMemo(() => String(router.query.token || ""), [router.query.token]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Link invalido ou incompleto.");
      return;
    }

    if (password.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Nao foi possivel redefinir a senha.");
        return;
      }

      setSuccess(data?.message || "Senha atualizada com sucesso.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erro de conexao com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crie uma nova senha e volte para a conversa."
      subtitle="Use uma senha segura para recuperar o acesso a sua conta."
      footer={
        <p className="text-center text-sm text-slate-400">
          Voltar para o{" "}
          <Link
            href="/login"
            className="font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            login
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Nova senha</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Redefina seu acesso</h2>
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
          <span className="mb-2 block">Nova senha</span>
          <input
            type="password"
            placeholder="Digite sua nova senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="field-input"
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Confirmar senha</span>
          <input
            type="password"
            placeholder="Repita sua nova senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            className="field-input"
          />
        </label>

        <button type="submit" disabled={loading} className="primary-button w-full">
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </AuthLayout>
  );
}
