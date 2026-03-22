import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [avatar, setAvatar] = useState("");

  const { data: session } = useSession();
  const currentUser = session?.user?.name;

  if (!msg) return null;

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
    if (!msg?._id) return;

    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      });
  }, [msg?._id]);

  // 🚀 REALTIME
  useEffect(() => {
    if (!msg?._id) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("comments");

    // 🟢 novo comentário
    channel.bind("new-comment", (data) => {
      if (data.messageId === msg._id) {
        setComments((prev) => {
          if (prev.find((c) => c._id === data._id)) return prev;
          return [data, ...prev];
        });
      }
    });

    // 🔴 deletar comentário
    channel.bind("delete-comment", (data) => {
      setComments((prev) => prev.filter((c) => c._id !== data.id));
    });

    return () => {
      pusher.unsubscribe("comments");
      pusher.disconnect();
    };
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
    <div style={{ marginBottom: 40, padding: 30 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <img
          src={avatar || `https://ui-avatars.com/api/?name=${msg.author}`}
          style={{ width: 40, height: 40, borderRadius: "50%" }}
        />
        <span>{msg.author}</span>
      </div>

      <p>{msg.content}</p>

      {isAuthor && <button onClick={handleDelete}>Excluir</button>}

      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentar..."
      />
      <button onClick={handleComment}>Comentar</button>

      <div>
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
