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
        setError("Email ou senha inválidos");
      } else {
        router.replace("/feed");
      }
    } catch (err) {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Entrar">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded-lg hover:opacity-80 transition disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm mt-4 text-center">
        Não tem conta?{" "}
        <Link href="/register" className="text-blue-500 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
