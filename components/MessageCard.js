import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [avatar, setAvatar] = useState("");

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // 🛑 proteção
  if (!msg || !msg._id) return null;

  // ⚠️ se você não usa userId no message, pode remover isso depois
  const isAuthor = false;

  // 🕒 FORMATAR DATA
  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    const data = d.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const hora = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    return `${data} às ${hora}`;
  };

  // 🔥 AVATAR (USANDO AUTHOR)
  useEffect(() => {
    setAvatar(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        msg?.author || "User",
      )}`,
    );
  }, [msg]);

  // 🔹 carregar comentários
  useEffect(() => {
    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setComments([]));
  }, [msg._id]);

  // 🚀 REALTIME (Pusher)
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("comments");

    channel.bind("new-comment", (data) => {
      if (data?.messageId === msg._id) {
        setComments((prev) => {
          if (prev.find((c) => c._id === data._id)) return prev;
          return [data, ...prev];
        });
      }
    });

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

  // 🗑️ deletar mensagem (desativado por enquanto)
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
          src={avatar}
          alt="avatar"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <div>
          {/* ✅ AQUI ESTÁ A CORREÇÃO */}
          <span style={{ opacity: 0.7 }}>{msg.author || "Usuário"}</span>

          {/* 🕒 DATA */}
          <div style={{ fontSize: "12px", opacity: 0.5 }}>
            {formatDate(msg.createdAt)}
          </div>
        </div>
      </div>

      {/* 💬 conteúdo */}
      <p style={{ fontSize: "1.2rem", marginTop: "15px" }}>
        {msg.content || ""}
      </p>

      {/* 🗑️ excluir (opcional depois) */}
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
            <small>
              — {c.author} • {formatDate(c.createdAt)}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
