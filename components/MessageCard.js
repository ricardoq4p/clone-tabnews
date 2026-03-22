import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const { data: session } = useSession();
  const currentUser = session?.user?.name;

  const isAuthor = msg.author === currentUser;

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
      }}
    >
      <p style={{ fontSize: "1.25rem", marginBottom: "12px" }}>{msg.content}</p>

      <span style={{ opacity: 0.4 }}>— {msg.author}</span>

      {/* 🔥 botão só aparece pro autor */}
      {isAuthor && (
        <div style={{ marginTop: "10px" }}>
          <button onClick={handleDelete}>Excluir</button>
        </div>
      )}

      {/* 💬 input de comentário */}
      <div style={{ marginTop: "20px" }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escreva um comentário..."
        />

        <button onClick={handleComment}>Comentar</button>
      </div>

      {/* 📜 comentários */}
      <div style={{ marginTop: "20px" }}>
        {comments.map((c) => (
          <div key={c._id}>
            <p>{c.content}</p>
            <small>— {c.author}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
