import { useEffect, useState } from "react";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  // 👤 usuário atual (simulação por enquanto)
  const currentUser = "Ricardo"; // 🔥 troca pra "admin" se quiser testar

  // 🔒 regra de permissão
  const isAuthor = msg.author === currentUser;
  const isAdmin = currentUser === "admin";

  // 🔹 carregar comentários
  useEffect(() => {
    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => setComments(data));
  }, [msg._id]);

  // 🔹 enviar comentário
  const handleComment = async () => {
    if (!comment.trim()) return;

    await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: comment,
        author: currentUser,
        messageId: msg._id,
      }),
    });

    setComment("");

    const res = await fetch(`/api/comments?messageId=${msg._id}`);
    const data = await res.json();
    setComments(data);
  };

  // 🔥 deletar mensagem
  const handleDelete = async () => {
    const confirmDelete = confirm("Deseja excluir essa mensagem?");
    if (!confirmDelete) return;

    await fetch("/api/messages", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: msg._id,
        user: currentUser, // 🔥 envia usuário
      }),
    });

    window.location.reload();
  };

  return (
    <div
      style={{
        marginBottom: "40px",
        padding: "30px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(6px)",
        transition: "0.3s",
      }}
    >
      {/* 📝 mensagem */}
      <p
        style={{ fontSize: "1.25rem", lineHeight: "1.7", marginBottom: "12px" }}
      >
        {msg.content}
      </p>

      <span style={{ opacity: 0.4, fontSize: "0.9rem" }}>— {msg.author}</span>

      {/* 🔥 BOTÃO EXCLUIR (CONDICIONAL) */}
      {(isAuthor || isAdmin) && (
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={handleDelete}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,0,0,0.3)",
              color: "#ff6b6b",
              borderRadius: "20px",
              padding: "5px 12px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Excluir
          </button>
        </div>
      )}

      {/* 💬 contador */}
      <div style={{ marginTop: "10px", opacity: 0.4, fontSize: "0.8rem" }}>
        {comments.length} comentário{comments.length !== 1 && "s"}
      </div>

      {/* ✍️ input */}
      <div style={{ marginTop: "20px" }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escreva um comentário..."
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
            color: "#fff",
            marginBottom: "10px",
            outline: "none",
          }}
        />

        <button
          onClick={handleComment}
          style={{
            padding: "8px 18px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Comentar
        </button>
      </div>

      {/* 📜 comentários */}
      <div style={{ marginTop: "25px" }}>
        {comments.map((c) => (
          <div
            key={c._id}
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              opacity: 0.85,
            }}
          >
            <p style={{ margin: 0 }}>{c.content}</p>
            <small style={{ opacity: 0.5 }}>— {c.author}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
