import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const { data: session } = useSession();
  const currentUser = session?.user?.name;

  // 🔒 proteção TOTAL contra msg inválido
  if (!msg || !msg._id) return null;

  const isAuthor = msg.author === currentUser;

  // 🔹 carregar comentários
  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      try {
        if (!msg?._id) return;

        const res = await fetch(`/api/comments?messageId=${msg._id}`);
        const data = await res.json();

        if (isMounted) {
          if (Array.isArray(data)) {
            setComments(data);
          } else {
            setComments([]);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar comentários:", err);
        if (isMounted) setComments([]);
      }
    };

    fetchComments();

    return () => {
      isMounted = false; // 🔥 evita crash ao deletar
    };
  }, [msg._id]);

  // 🔹 enviar comentário
  const handleComment = async () => {
    if (!comment.trim() || !msg?._id) return;

    try {
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

      // recarregar comentários
      const res = await fetch(`/api/comments?messageId=${msg._id}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setComments(data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  // 🔥 deletar mensagem (SEM reload)
  const handleDelete = async () => {
    const confirmDelete = confirm("Deseja excluir essa mensagem?");
    if (!confirmDelete || !msg?._id) return;

    try {
      await fetch("/api/messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: msg._id,
        }),
      });

      // ❌ SEM reload
      // o Pusher vai cuidar da remoção em tempo real
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
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
      {/* 🧠 conteúdo */}
      <p style={{ fontSize: "1.25rem", marginBottom: "12px" }}>
        {msg.content || "Mensagem vazia"}
      </p>

      {/* 👤 autor */}
      <span style={{ opacity: 0.4 }}>— {msg.author || "Anônimo"}</span>

      {/* 🔥 botão excluir */}
      {isAuthor && (
        <div style={{ marginTop: "10px" }}>
          <button onClick={handleDelete}>Excluir</button>
        </div>
      )}

      {/* 💬 comentário */}
      <div style={{ marginTop: "20px" }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escreva um comentário..."
        />

        <button onClick={handleComment}>Comentar</button>
      </div>

      {/* 📜 lista de comentários */}
      <div style={{ marginTop: "20px" }}>
        {comments?.map((c) =>
          c?._id ? (
            <div key={c._id}>
              <p>{c.content}</p>
              <small>— {c.author}</small>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
