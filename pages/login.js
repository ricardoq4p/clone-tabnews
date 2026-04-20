import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha invalidos.");
        return;
      }

      router.replace("/feed");
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Entre, publique e chame a Pantera IA quando quiser."
      subtitle="A comunidade agora pode acionar a inteligencia da casa com @pantera para receber respostas automaticas dentro do proprio feed."
      footer={
        <p className="text-center text-sm text-slate-400">
          Nao tem conta? {" "}
          <Link href="/register" className="font-medium text-cyan-200 transition hover:text-cyan-100">
            Criar conta
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Acessar conta</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Bem-vindo de volta</h2>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field-input"
          />
        </label>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            Esqueci minha senha
          </Link>
        </div>

        <button type="submit" disabled={loading} className="primary-button w-full">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthLayout>
  );
}
