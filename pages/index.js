import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res.error) {
      setError("Email ou senha inválidos");
    } else {
      router.push("/feed");
    }
  };

  return (
    <AuthLayout title="Entrar ✨">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
        />

        <button
          type="submit"
          className="w-full p-3 rounded-lg border border-white/20 text-white bg-white/5 hover:bg-white/10 transition"
        >
          Entrar
        </button>
      </form>

      <p className="text-sm mt-4 text-center text-gray-400">
        Não tem conta?{" "}
        <Link
          href="/register"
          className="text-gray-300 hover:text-white underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
