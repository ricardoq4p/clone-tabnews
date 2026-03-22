import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [avatar, setAvatar] = useState("");

  const { data: session } = useSession();
  const currentUser = session?.user?.name;

  // 🛑 proteção total
  if (!msg || !msg._id) return null;

  const isAuthor = msg?.author === currentUser;

  // 🔥 avatar
  useEffect(() => {
    if (!msg?.username) return;

    fetch(`/api/users/${msg.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar_url) setAvatar(data.avatar_url);
      })
      .catch(() => {});
  }, [msg?.username]);

  // 🔹 carregar comentários
  useEffect(() => {
    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setComments([]));
  }, [msg._id]);

  // 🚀 REALTIME
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("comments");

    // 🟢 novo comentário
    channel.bind("new-comment", (data) => {
      if (data?.messageId === msg._id) {
        setComments((prev) => {
          if (prev.find((c) => c._id === data._id)) return prev;
          return [data, ...prev];
        });
      }
    });

    // 🔴 delete comentário
    channel.bind("delete-comment", (data) => {
      setComments((prev) => prev.filter((c) => c._id !== data?.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("comments");
      pusher.disconnect();
    };
  }, [msg._id]);

  // 📝 comentar
  const handleComment = async () => {
    if (!comment.trim()) return;

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
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  // 🗑️ deletar mensagem
  const handleDelete = async () => {
    if (!confirm("Deseja excluir?")) return;

    try {
      await fetch("/api/messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: msg._id }),
      });
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
      {/* 👤 header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={
            avatar || `https://ui-avatars.com/api/?name=${msg.author || "User"}`
          }
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <span style={{ opacity: 0.7 }}>{msg.author || "Usuário"}</span>
      </div>

      {/* 💬 conteúdo */}
      <p style={{ fontSize: "1.2rem", marginTop: "15px" }}>
        {msg.content || ""}
      </p>

      {/* 🗑️ excluir */}
      {isAuthor && (
        <button onClick={handleDelete} style={{ marginTop: "10px" }}>
          Excluir
        </button>
      )}

      {/* ✍️ comentar */}
      <div style={{ marginTop: "15px" }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentar..."
        />
        <button onClick={handleComment}>Comentar</button>
      </div>

      {/* 💬 lista */}
      <div style={{ marginTop: "10px" }}>
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
