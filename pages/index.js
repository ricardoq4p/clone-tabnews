import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

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
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #1a1a1a 0%, #000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Entrar ✨</h2>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            color: "#fff",
            outline: "none",
          }}
        />

        {/* SENHA */}
        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            color: "#fff",
            outline: "none",
          }}
        />

        {/* ERRO */}
        {error && (
          <p style={{ color: "#ff6b6b", marginBottom: "10px" }}>{error}</p>
        )}

        {/* BOTÃO */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Entrar
        </button>

        {/* LINK */}
        <p style={{ marginTop: "20px", textAlign: "center", opacity: 0.6 }}>
          Não tem conta?{" "}
          <Link href="/register" style={{ color: "#fff" }}>
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
