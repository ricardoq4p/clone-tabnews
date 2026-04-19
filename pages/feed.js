import { useEffect, useMemo, useState } from "react";
import MessageCard from "../components/MessageCard";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Pusher from "pusher-js";

export default function Feed() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status, router]);

  useEffect(() => {
    if (!session) return;

    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    setFeedLoading(true);

    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => setMessages([]))
      .finally(() => setFeedLoading(false));

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe("feed");

    channel.bind("new-message", (data) => {
      setMessages((prev) => {
        if (!data?._id) return prev;
        if (prev.find((message) => message._id === data._id)) return prev;
        return [data, ...prev];
      });
    });

    channel.bind("delete-message", (data) => {
      setMessages((prev) => prev.filter((message) => message._id !== data.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("feed");
      pusher.disconnect();
    };
  }, []);

  if (status === "loading" || !session) return null;

  const handleSubmit = async () => {
    if (!newMessage.trim() || publishing) return;

    try {
      setPublishing(true);
      setPublishError("");

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Nao foi possivel publicar a mensagem.");
      }

      setNewMessage("");
    } catch (err) {
      setPublishError(err.message || "Nao foi possivel publicar a mensagem.");
    } finally {
      setPublishing(false);
    }
  };

  const avatarUrl =
    userData?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "User")}&background=0f172a&color=ffffff`;

  const messagesLabel = useMemo(() => {
    if (messages.length === 0) return "Nenhuma publicacao ainda";
    if (messages.length === 1) return "1 publicacao na conversa";
    return `${messages.length} publicacoes na conversa`;
  }, [messages.length]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="glass-panel mb-6 rounded-[28px] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                Feed em tempo real
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Seu espaco de publicacao</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Compartilhe ideias, acompanhe novas mensagens ao vivo e mantenha a conversa fluindo com uma interface mais limpa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push("/profile")}
                className="secondary-button gap-3 rounded-full px-3 py-2"
              >
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="max-w-[120px] truncate text-sm">{session?.user?.name}</span>
              </button>

              <button onClick={() => router.push("/profile")} className="secondary-button rounded-full px-4 py-2 text-sm">
                Perfil
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="secondary-button rounded-full px-4 py-2 text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <section className="glass-panel mb-6 rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <img src={avatarUrl} alt="avatar" className="h-11 w-11 rounded-full object-cover" />
            <div>
              <p className="font-medium text-white">{session?.user?.name}</p>
              <p className="text-sm text-slate-400">O que voce quer compartilhar agora?</p>
            </div>
          </div>

          <textarea
            placeholder="Escreva uma mensagem para a comunidade..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="field-input min-h-[140px] resize-y"
          />

          {publishError ? (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {publishError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">As novas publicacoes aparecem em tempo real para todos.</p>
              <p className="mt-1 text-xs text-slate-600">Dica: escreva com contexto para gerar respostas melhores.</p>
            </div>
            <button onClick={handleSubmit} disabled={publishing} className="primary-button px-5 py-3">
              {publishing ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </section>

        <section className="mb-4 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-medium text-white">Timeline</p>
            <p className="text-sm text-slate-500">{messagesLabel}</p>
          </div>
          {feedLoading ? <span className="text-sm text-slate-500">Atualizando...</span> : null}
        </section>

        <section className="space-y-4">
          {feedLoading ? (
            <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
              Carregando publicacoes...
            </div>
          ) : messages.length === 0 ? (
            <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
              Nenhuma mensagem ainda. Seja a primeira pessoa a publicar.
            </div>
          ) : (
            messages.map((msg) => (msg?._id ? <MessageCard key={msg._id} msg={msg} /> : null))
          )}
        </section>
      </div>
    </div>
  );
}
