import { useEffect, useState } from "react";
import MessageCard from "../components/MessageCard";

export default function Feed() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

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
        author: "Ricardo",
      }),
    });

    setNewMessage("");

    const res = await fetch("/api/messages");
    const data = await res.json();
    setMessages(data);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at center, #1a1a1a 0%, #000 100%)",
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

        {/* INPUT DE NOVA MENSAGEM */}
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

        {/* MENSAGENS */}
        {messages.map((msg) => (
          <MessageCard key={msg._id} msg={msg} />
        ))}
      </div>
    </div>
  );
}
