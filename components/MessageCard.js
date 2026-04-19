import { useEffect, useMemo, useState } from "react";
import Pusher from "pusher-js";

export default function MessageCard({ msg }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  if (!msg || !msg._id) return null;

  const isAuthor = false;
  const authorName = msg.userId?.name || msg.author || "Usuario";
  const authorAvatar = useMemo(() => {
    if (msg.userId?.avatar) return msg.userId.avatar;
    if (msg.avatar) return msg.avatar;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0f172a&color=ffffff`;
  }, [authorName, msg.avatar, msg.userId?.avatar]);

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);
    const formattedDate = parsedDate.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const formattedTime = parsedDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    return `${formattedDate} as ${formattedTime}`;
  };

  useEffect(() => {
    fetch(`/api/comments?messageId=${msg._id}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setComments([]));
  }, [msg._id]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("comments");

    channel.bind("new-comment", (data) => {
      if (data?.messageId === msg._id) {
        setComments((prev) => {
          if (prev.find((currentComment) => currentComment._id === data._id)) return prev;
          return [data, ...prev];
        });
      }
    });

    channel.bind("delete-comment", (data) => {
      setComments((prev) => prev.filter((currentComment) => currentComment._id !== data?.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("comments");
      pusher.disconnect();
    };
  }, [msg._id]);

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
    <article className="glass-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={authorAvatar} alt="avatar" className="h-11 w-11 rounded-full object-cover" />
          <div>
            <p className="font-medium text-white">{authorName}</p>
            <p className="text-sm text-slate-500">{formatDate(msg.createdAt)}</p>
          </div>
        </div>

        {isAuthor ? (
          <button onClick={handleDelete} className="secondary-button rounded-full px-4 py-2 text-sm">
            Excluir
          </button>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-wrap text-[1.05rem] leading-7 text-slate-200">
        {msg.content || ""}
      </p>

      <div className="mt-6 rounded-3xl border border-white/8 bg-slate-950/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva um comentario..."
            className="field-input flex-1"
          />
          <button onClick={handleComment} className="primary-button px-5 py-3 sm:w-auto">
            Comentar
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">Ainda nao ha comentarios nesta mensagem.</p>
          ) : (
            comments.map((currentComment) => (
              <div
                key={currentComment._id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <p className="text-sm leading-6 text-slate-200">{currentComment.content}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {currentComment.author} • {formatDate(currentComment.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}
