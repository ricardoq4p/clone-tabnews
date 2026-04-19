import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        setError(data?.message || data?.error || "Nao foi possivel concluir o cadastro.");
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setSuccess("Cadastro realizado. Voce sera redirecionado para o login em instantes.");

      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch {
      setError("Erro de conexao com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crie sua conta e entre no fluxo sem atrito."
      subtitle="Cadastro mais claro, consistente com o login e com mensagens de feedback mais cuidadas."
      footer={
        <p className="text-center text-sm text-slate-400">
          Ja tem conta? {" "}
          <Link href="/login" className="font-medium text-cyan-200 transition hover:text-cyan-100">
            Entrar
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Criar conta</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Comece agora</h2>
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
          <span className="mb-2 block">Nome</span>
          <input
            type="text"
            placeholder="Como voce quer aparecer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field-input"
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Email</span>
          <input
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field-input"
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Senha</span>
          <input
            type="password"
            placeholder="Crie uma senha segura"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field-input"
          />
        </label>

        <button type="submit" disabled={loading} className="primary-button w-full">
          {loading ? "Criando conta..." : "Cadastrar"}
        </button>
      </form>
    </AuthLayout>
  );
}
