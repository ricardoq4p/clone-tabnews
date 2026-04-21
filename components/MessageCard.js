import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

export default function MessageCard({ msg }) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const messageId = msg?._id || null;

  const messageUserId =
    typeof msg.userId === "string" ? msg.userId : msg.userId?._id;
  const isAuthor = Boolean(messageUserId && session?.user?.id === messageUserId);
  const isSuperadmin = session?.user?.role === "superadmin";
  const canDeleteMessage = isAuthor || isSuperadmin;
  const authorName = msg.userId?.name || msg.author || "Usuario";
  const authorAvatar =
    msg.userId?.avatar ||
    msg.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0f172a&color=ffffff`;

  const commentsCountLabel = `${comments.length} ${
    comments.length === 1 ? "comentario" : "comentarios"
  }`;

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
    if (!messageId) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);

    fetch(`/api/comments?messageId=${messageId}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [messageId]);

  useEffect(() => {
    if (!messageId) {
      return undefined;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("comments");

    channel.bind("new-comment", (data) => {
      if (data?.messageId === messageId) {
        setComments((prev) => {
          if (prev.find((currentComment) => currentComment._id === data._id))
            return prev;
          return [data, ...prev];
        });
      }
    });

    channel.bind("delete-comment", (data) => {
      if (data?.messageId === messageId || !data?.messageId) {
        setComments((prev) =>
          prev.filter((currentComment) => currentComment._id !== data?.id),
        );
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("comments");
      pusher.disconnect();
    };
  }, [messageId]);

  if (!msg || !messageId) return null;

  const handleComment = async (e) => {
    e.preventDefault();

    if (!comment.trim() || commentSubmitting) return;

    try {
      setCommentSubmitting(true);
      setCommentError("");

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: comment,
          messageId: msg._id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Nao foi possivel enviar o comentario.");
      }

      setComment("");
      setCommentsOpen(true);
    } catch (err) {
      setCommentError(err.message || "Nao foi possivel enviar o comentario.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Deseja excluir esta mensagem?")) return;

    try {
      setDeleting(true);
      setCommentError("");

      const response = await fetch("/api/messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: msg._id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Nao foi possivel excluir a mensagem.");
      }
    } catch (err) {
      setCommentError(err.message || "Nao foi possivel excluir a mensagem.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Deseja excluir este comentario?")) return;

    try {
      setDeletingCommentId(commentId);
      setCommentError("");

      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: commentId }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir o comentario.");
      }
    } catch (err) {
      setCommentError(err.message || "Nao foi possivel excluir o comentario.");
    } finally {
      setDeletingCommentId("");
    }
  };

  return (
    <article className="glass-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={authorAvatar}
            alt="avatar"
            className="h-11 w-11 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-white">{authorName}</p>
            <p className="text-sm text-slate-500">{formatDate(msg.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            {commentsCountLabel}
          </span>
          {canDeleteMessage ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="secondary-button rounded-full px-4 py-2 text-sm"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          ) : null}
        </div>
      </div>

      {msg.communityName ? (
        <div className="mt-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
          {msg.communityName}
        </div>
      ) : null}

      <p className="mt-4 whitespace-pre-wrap text-[1.05rem] leading-7 text-slate-200">
        {msg.content || ""}
      </p>

      <div className="mt-6 rounded-3xl border border-white/8 bg-slate-950/30 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Conversa</p>
            <p className="text-xs text-slate-500">
              Responda e acompanhe em tempo real.
            </p>
          </div>
          <button
            onClick={() => setCommentsOpen((currentValue) => !currentValue)}
            className="secondary-button rounded-full px-4 py-2 text-sm"
          >
            {commentsOpen ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <form
          onSubmit={handleComment}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva um comentario..."
            className="field-input flex-1"
          />
          <button
            type="submit"
            disabled={commentSubmitting}
            className="primary-button px-5 py-3 sm:w-auto"
          >
            {commentSubmitting ? "Enviando..." : "Comentar"}
          </button>
        </form>

        {commentError ? (
          <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {commentError}
          </p>
        ) : null}

        {commentsOpen ? (
          <div className="mt-4 space-y-3">
            {commentsLoading ? (
              <p className="text-sm text-slate-500">Carregando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ainda nao ha comentarios nesta mensagem.
              </p>
            ) : (
              comments.map((currentComment) => {
                const currentCommentAuthor =
                  currentComment.author || currentComment.userId?.name || "Usuario";
                const currentCommentAvatar =
                  currentComment.avatar ||
                  currentComment.userId?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentCommentAuthor,
                  )}&background=0f172a&color=ffffff`;
                const currentCommentUserId =
                  typeof currentComment.userId === "string"
                    ? currentComment.userId
                    : currentComment.userId?._id;
                const canDeleteComment =
                  isSuperadmin ||
                  (currentCommentUserId &&
                    currentCommentUserId === session?.user?.id) ||
                  (!currentCommentUserId &&
                    currentComment.author === session?.user?.name);

                return (
                  <div
                    key={currentComment._id}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentCommentAvatar}
                          alt="avatar do comentario"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {currentCommentAuthor}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(currentComment.createdAt)}
                          </p>
                        </div>
                      </div>
                      {canDeleteComment ? (
                        <button
                          onClick={() =>
                            handleDeleteComment(currentComment._id)
                          }
                          disabled={deletingCommentId === currentComment._id}
                          className="secondary-button rounded-full px-3 py-1.5 text-xs"
                        >
                          {deletingCommentId === currentComment._id
                            ? "Excluindo..."
                            : "Excluir"}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      {currentComment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
