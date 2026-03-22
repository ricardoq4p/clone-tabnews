import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const { data: session } = useSession();
  const currentUser = session?.user?.name;

  // 🔒 proteção contra msg undefined
  if (!msg) return null;

  const isAuthor = msg?.author === currentUser;

  // 🔹 carregar comentários
  useEffect(() => {
    if (!msg?._id) return;

    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          console.error("Erro nos comentários:", data);
          setComments([]);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar comentários:", err);
        setComments([]);
      });
  }, [msg?._id]);

  // 🔹 enviar comentário
  const handleComment = async () => {
    if (!comment.trim() || !msg?._id) return;

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
  };

  // 🔥 deletar mensagem
  const handleDelete = async () => {
    const confirmDelete = confirm("Deseja excluir essa mensagem?");
    if (!confirmDelete || !msg?._id) return;

    await fetch("/api/messages", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: msg._id,
      }),
    });

    // melhor prática: não recarregar página
    // mas se quiser manter simples:
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
      {/* 🧠 conteúdo */}
      <p style={{ fontSize: "1.25rem", marginBottom: "12px" }}>
        {msg?.content || "Mensagem vazia"}
      </p>

      {/* 👤 autor */}
      <span style={{ opacity: 0.4 }}>— {msg?.author || "Anônimo"}</span>

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
              <p>{c?.content}</p>
              <small>— {c?.author}</small>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
