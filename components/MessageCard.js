import { canDeleteContent } from "@/lib/permissions";
import { realtimeEnabled } from "@/lib/integration-policy";
import Image from "next/image";
import Link from "next/link";
import PrayerButton from "./prayer/PrayerButton";
import ReportButton from "./prayer/ReportButton";
import LoadMoreButton from "./LoadMoreButton";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

export default function MessageCard({ msg, onDeleted }) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const commentRequestId = useRef(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const messageId = msg?._id || null;

  const canDeleteMessage = canDeleteContent(msg, session);
  const authorName = msg.userId?.name || msg.author || "Usuario";
  const authorAvatar =
    msg.userId?.avatar || msg.avatar || "/sacred/favicon.svg";

  const commentsCountLabel = commentsOpen
    ? `${comments.length} ${
        comments.length === 1 ? "comentario" : "comentarios"
      }`
    : "Comentários";

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
    if (!messageId || !commentsOpen) {
      return;
    }

    fetch(`/api/comments?messageId=${messageId}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [messageId, msg.communityId, commentsOpen]);

  useEffect(() => {
    if (
      !messageId ||
      !commentsOpen ||
      !realtimeEnabled ||
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      return undefined;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
    });

    const channel = pusher.subscribe(
      msg.communityId ? `private-community-${msg.communityId}` : "comments",
    );

    const reload = () =>
      fetch(`/api/comments?messageId=${messageId}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setComments(Array.isArray(data) ? data : []))
        .catch(() => {});
    channel.bind("new-comment", reload);
    channel.bind("delete-comment", reload);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channel.name);
      pusher.disconnect();
    };
  }, [messageId, msg.communityId, commentsOpen]);

  if (!msg || !messageId) return null;

  const handleComment = async (e) => {
    e.preventDefault();

    if (!comment.trim() || commentSubmitting) return;

    try {
      setCommentSubmitting(true);
      setCommentError("");
      commentRequestId.current ||= crypto.randomUUID();

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": commentRequestId.current,
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

      const created = await response.json();
      setComments((current) =>
        current.some((item) => item._id === created._id)
          ? current
          : [created, ...current],
      );
      setComment("");
      commentRequestId.current = null;
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
      onDeleted?.(msg._id);
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
      setComments((current) =>
        current.filter((item) => item._id !== commentId),
      );
    } catch (err) {
      setCommentError(err.message || "Nao foi possivel excluir o comentario.");
    } finally {
      setDeletingCommentId("");
    }
  };

  return (
    <article
      id={`message-${messageId}`}
      className="glass-panel rounded-[28px] p-5 sm:p-6"
    >
      <div className="p-post-kind">
        {
          {
            prayer: "Pedido de oração",
            testimony: "Testemunho",
            reflection: "Reflexão católica",
            general: "Partilha da comunidade",
          }[msg.category || "general"]
        }
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            unoptimized
            width={128}
            height={128}
            src={authorAvatar}
            alt="avatar"
            className="h-11 w-11 rounded-full object-cover"
          />
          <div>
            <p className="font-medium text-white">{authorName}</p>
            <p className="text-sm text-slate-500">
              {formatDate(msg.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            {commentsCountLabel}
          </span>
          {canDeleteMessage ? (
            <button
              onClick={handleDelete}
              aria-label="Excluir publicação"
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

        {session ? (
          <form
            onSubmit={handleComment}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva um comentário…"
              aria-label="Seu comentário"
              maxLength={5000}
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
        ) : (
          <p className="text-xs text-slate-500">
            <Link href="/login" className="p-inline-link">
              Entre na sua conta
            </Link>{" "}
            para comentar com a comunidade.
          </p>
        )}

        {commentError ? (
          <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {commentError}
          </p>
        ) : null}

        {commentsOpen ? (
          <div className="mt-4 space-y-3">
            {commentsLoading ? (
              <p className="text-sm text-slate-500">
                Carregando comentarios...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ainda nao ha comentarios nesta mensagem.
              </p>
            ) : (
              comments.map((currentComment) => {
                const currentCommentAuthor =
                  currentComment.author ||
                  currentComment.userId?.name ||
                  "Usuario";
                const currentCommentAvatar =
                  currentComment.avatar ||
                  currentComment.userId?.avatar ||
                  "/sacred/favicon.svg";
                const canDeleteComment = canDeleteContent(
                  currentComment,
                  session,
                );

                return (
                  <div
                    key={currentComment._id}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Image
                          unoptimized
                          width={128}
                          height={128}
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
                          aria-label="Excluir comentário"
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
                    <ReportButton
                      targetType="comment"
                      targetId={currentComment._id}
                    />
                  </div>
                );
              })
            )}
          </div>
        ) : null}
        <LoadMoreButton
          items={comments}
          endpoint={`/api/comments?messageId=${messageId}`}
          onLoad={(data) =>
            setComments((current) => [
              ...current,
              ...data.filter(
                (item) =>
                  !current.some((existing) => existing._id === item._id),
              ),
            ])
          }
        />
      </div>
      <div className="p-post-footer">
        <PrayerButton
          endpoint={`/api/messages/${messageId}/oracao`}
          initialCount={msg.supportCount}
          initialPrayed={msg.prayed}
        />
        <ReportButton targetType="message" targetId={messageId} />
      </div>
    </article>
  );
}
