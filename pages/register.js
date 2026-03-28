import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // ✅ aqui no topo
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

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      console.log("STATUS:", res.status);
      console.log("RESPONSE:", data);

      if (!res.ok) {
        setError(data?.message || data?.error || "Erro ao cadastrar");
        return;
      }

      // ✅ sucesso
      setName("");
      setEmail("");
      setPassword("");

      setSuccess(
        "Cadastro realizado! Verifique seu email para confirmar. Redirecionando para tela de login...",
      );

      setTimeout(() => {
        router.push("/login");
      }, 12000);
    } catch (err) {
      console.error("ERRO NO FETCH:", err);
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Criar Conta">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-3 border rounded-lg"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border rounded-lg"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border rounded-lg"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded-lg"
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <p className="text-sm mt-4 text-center">
        Já tem conta?{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
