import { useEffect, useState } from "react";
import MessageCard from "../components/MessageCard";
import { signOut, useSession } from "next-auth/react";

export default function Feed() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }, []);

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: newMessage,
      }),
    });

    setNewMessage("");

    const res = await fetch("/api/messages");
    const data = await res.json();
    setMessages(data);
  };

  return (
    <>
      {/* 🔴 HEADER (usuario + sair) */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span style={{ opacity: 0.6 }}>{session?.user?.name}</span>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>

      {/* 🧠 CONTEÚDO */}
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at center, #1a1a1a 0%, #000 100%)",
          color: "#fff",
          padding: "60px 20px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {/* Título */}
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h1 style={{ fontWeight: "400", letterSpacing: "1px" }}>Feed ✨</h1>
            <p style={{ opacity: 0.5 }}>Observe. Sinta. Permaneça.</p>
          </div>

          {/* INPUT */}
          <div style={{ marginBottom: "40px" }}>
            <textarea
              placeholder="Escreva uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                marginBottom: "10px",
                outline: "none",
              }}
            />

            <button
              onClick={handleSubmit}
              style={{
                padding: "10px 20px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Publicar ✨
            </button>
          </div>

          {/* POSTS */}
          {messages.map((msg) => (
            <MessageCard key={msg._id} msg={msg} />
          ))}
        </div>
      </div>
    </>
  );
}
