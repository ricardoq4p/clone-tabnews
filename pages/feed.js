import { useEffect, useState } from "react";
import MessageCard from "../components/MessageCard";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Pusher from "pusher-js";

export default function Feed() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userData, setUserData] = useState(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  // 🔒 proteção de rota
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status]);

  // 🔥 buscar usuário
  useEffect(() => {
    if (!session) return;

    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch(() => {});
  }, [session]);

  // 🚀 carregar mensagens + realtime (ANTES DO RETURN)
  useEffect(() => {
    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => setMessages([]));

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("feed");

    // 🟢 nova mensagem
    channel.bind("new-message", (data) => {
      setMessages((prev) => {
        if (!data?._id) return prev;

        const exists = prev.find((m) => m._id === data._id);
        if (exists) return prev;

        return [data, ...prev];
      });
    });

    // 🔴 deletar mensagem
    channel.bind("delete-message", (data) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== data.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("feed");
      pusher.disconnect(); // 🔥 ESSENCIAL
    };
  }, []);

  // ⛔ só depois dos hooks
  if (status === "loading" || !session) return null;

  // 📝 publicar
  const handleSubmit = async () => {
    if (!newMessage.trim()) return;

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Erro ao publicar:", err);
    }
  };

  return (
    <>
      {/* 🔴 HEADER */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <div
          onClick={() => router.push("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <img
            src={
              userData?.avatar ||
              `https://ui-avatars.com/api/?name=${session?.user?.name}`
            }
            alt="avatar"
            style={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />

          <span style={{ color: "#fff", fontWeight: "500" }}>
            {session?.user?.name}
          </span>
        </div>

        <button
          onClick={() => router.push("/profile")}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Perfil
        </button>

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
          {/* título */}
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <h1>Feed ✨</h1>
            <p style={{ opacity: 0.5 }}>Observe. Sinta. Permaneça.</p>
          </div>

          {/* input */}
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

          {/* mensagens */}
          {messages.map((msg) =>
            msg?._id ? <MessageCard key={msg._id} msg={msg} /> : null,
          )}
        </div>
      </div>
    </>
  );
}
