import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [avatar, setAvatar] = useState("");

  const { data: session } = useSession();
  const currentUser = session?.user?.name;

  if (!msg) return null;

  const isAuthor = msg?.author === currentUser;

  // 🔥 buscar avatar pelo username
  useEffect(() => {
    if (!msg?.username) return;

    fetch(`/api/users/${msg.username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar_url) {
          setAvatar(data.avatar_url);
        }
      })
      .catch(() => {});
  }, [msg?.username]);

  // 🔹 comentários
  useEffect(() => {
    if (!msg?._id) return;

    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
        else setComments([]);
      });
  }, [msg?._id]);

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
    setComments(Array.isArray(data) ? data : []);
  };

  const handleDelete = async () => {
    if (!confirm("Deseja excluir?")) return;

    await fetch("/api/messages", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: msg._id }),
    });
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
      {/* 🔥 header com avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={avatar || `https://ui-avatars.com/api/?name=${msg.author}`}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />

        <span style={{ opacity: 0.6 }}>{msg.author}</span>
      </div>

      <p style={{ fontSize: "1.25rem", marginTop: "15px" }}>{msg.content}</p>

      {isAuthor && <button onClick={handleDelete}>Excluir</button>}

      <div style={{ marginTop: "15px" }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentar..."
        />
        <button onClick={handleComment}>Comentar</button>
      </div>

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
