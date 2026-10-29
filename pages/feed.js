import { realtimeEnabled } from "@/lib/integration-policy";
import { resolveNotificationTarget } from "@/lib/validation";
import Image from "next/image";
import LoadMoreButton from "../components/LoadMoreButton";
import { useEffect, useState } from "react";
import MessageCard from "../components/MessageCard";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Pusher from "pusher-js";
import CommunityImageUploader from "../components/CommunityImageUploader";

export default function Feed() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [requestedMessageUnavailable, setRequestedMessageUnavailable] =
    useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communityError, setCommunityError] = useState("");
  const [communityFormOpen, setCommunityFormOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [communityPrivacy, setCommunityPrivacy] = useState("public");
  const [communitySubmitting, setCommunitySubmitting] = useState(false);
  const [communityActionId, setCommunityActionId] = useState("");
  const [communityAvatar, setCommunityAvatar] = useState("");

  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    messageId: requestedMessage,
    commentId: requestedComment,
    hasInvalidMessageParam,
    hasInvalidCommentParam,
  } = resolveNotificationTarget(
    router.query,
    typeof window !== "undefined" ? window.location.search : "",
    (typeof window !== "undefined" ? window.location.hash : "") ||
      router.asPath?.split("#")[1] ||
      "",
  );

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
    if (!session) return;

    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => {
        setCommunities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCommunities([]);
        setCommunityError("Nao foi possivel carregar as comunidades.");
      })
      .finally(() => setCommunitiesLoading(false));
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    if (hasInvalidMessageParam) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setMessages([]);
        setRequestedMessageUnavailable(true);
        setFeedLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const endpoint = requestedMessage
      ? `/api/messages?id=${encodeURIComponent(requestedMessage)}`
      : "/api/messages";

    fetch(endpoint)
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          return { ok: false, items: [] };
        }
        return { ok: true, items: Array.isArray(data) ? data : [] };
      })
      .then(({ ok, items }) => {
        if (cancelled) return;
        setMessages(items);
        setRequestedMessageUnavailable(
          Boolean(requestedMessage && (!ok || items.length === 0)),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([]);
        setRequestedMessageUnavailable(Boolean(requestedMessage));
      })
      .finally(() => {
        if (!cancelled) {
          setFeedLoading(false);
        }
      });

    if (
      !realtimeEnabled ||
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      return () => {
        cancelled = true;
      };
    }
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
    });

    const channel = pusher.subscribe("feed");

    const reload = () =>
      fetch(
        requestedMessage
          ? `/api/messages?id=${encodeURIComponent(requestedMessage)}`
          : "/api/messages",
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) {
            setMessages(Array.isArray(data) ? data : []);
          }
        })
        .catch(() => {});
    channel.bind("new-message", reload);
    channel.bind("delete-message", reload);
    const communityChannels = communities.map((community) => {
      const privateChannel = pusher.subscribe(
        `private-community-${community._id}`,
      );
      privateChannel.bind("new-message", reload);
      privateChannel.bind("delete-message", reload);
      return privateChannel;
    });

    return () => {
      cancelled = true;
      communityChannels.forEach((item) => {
        item.unbind_all();
        pusher.unsubscribe(item.name);
      });
      channel.unbind_all();
      pusher.unsubscribe("feed");
      pusher.disconnect();
    };
  }, [communities, requestedMessage, hasInvalidMessageParam]);

  useEffect(() => {
    if (
      !requestedMessage ||
      !messages.some((item) => item._id === requestedMessage)
    )
      return;
    window.requestAnimationFrame(() =>
      document
        .getElementById(`message-${requestedMessage}`)
        ?.scrollIntoView?.({ block: "start", behavior: "smooth" }),
    );
  }, [messages, requestedMessage]);

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

      const created = await response.json();
      setMessages((current) =>
        current.some((item) => item._id === created._id)
          ? current
          : [created, ...current],
      );
      setNewMessage("");
    } catch (err) {
      setPublishError(err.message || "Nao foi possivel publicar a mensagem.");
    } finally {
      setPublishing(false);
    }
  };

  const avatarUrl = userData?.avatar || "/sacred/favicon.svg";

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || communitySubmitting) return;

    try {
      setCommunitySubmitting(true);
      setCommunityError("");

      const response = await fetch("/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: communityName,
          description: communityDescription,
          avatar: communityAvatar,
          privacy: communityPrivacy,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Nao foi possivel criar a comunidade.");
      }

      setCommunities((current) => [data, ...current]);
      setCommunityName("");
      setCommunityDescription("");
      setCommunityAvatar("");
      setCommunityPrivacy("public");
      setCommunityFormOpen(false);
    } catch (error) {
      setCommunityError(
        error.message || "Nao foi possivel criar a comunidade.",
      );
    } finally {
      setCommunitySubmitting(false);
    }
  };

  const handleCommunityMembership = async (community) => {
    if (!community?._id || communityActionId) return;

    try {
      setCommunityActionId(community._id);
      setCommunityError("");

      const response = await fetch(`/api/communities/${community._id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: community.joined ? "leave" : "join",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "Nao foi possivel atualizar a comunidade.",
        );
      }

      setCommunities((current) =>
        current.map((item) => (item._id === data._id ? data : item)),
      );
    } catch (error) {
      setCommunityError(
        error.message || "Nao foi possivel atualizar a comunidade.",
      );
    } finally {
      setCommunityActionId("");
    }
  };

  const openCommunity = (communityId) => {
    router.push(`/comunidades/${communityId}`);
  };

  let messagesLabel = "Nenhuma publicacao ainda";
  if (requestedMessage || hasInvalidMessageParam) {
    messagesLabel = requestedMessageUnavailable
      ? "Publicação indisponível"
      : "Visualizando publicação selecionada";
  } else if (messages.length === 1) {
    messagesLabel = "1 publicacao na conversa";
  } else if (messages.length > 1) {
    messagesLabel = `${messages.length} publicacoes na conversa`;
  }

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 xl:grid-cols-[280px,1fr]">
          <aside className="xl:self-start">
            <div className="space-y-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:overscroll-contain xl:pr-2">
              <section className="glass-panel rounded-[28px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Comunidades
                </p>

                <button
                  onClick={() => setCommunityFormOpen((current) => !current)}
                  className="primary-button mt-4 w-full justify-center px-4 py-3"
                >
                  Criar comunidade
                </button>

                {communityFormOpen ? (
                  <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-white">
                      Nova comunidade
                    </p>
                    <div className="mt-4 space-y-3">
                      <CommunityImageUploader
                        value={communityAvatar}
                        onChange={setCommunityAvatar}
                        disabled={communitySubmitting}
                        label="Imagem da comunidade"
                        id="create-community-image"
                      />
                      <input
                        type="text"
                        placeholder="Nome da comunidade"
                        aria-label="Nome da comunidade"
                        value={communityName}
                        onChange={(event) =>
                          setCommunityName(event.target.value)
                        }
                        className="field-input"
                      />
                      <textarea
                        placeholder="Descricao curta para apresentar a comunidade"
                        aria-label="Descrição da comunidade"
                        value={communityDescription}
                        onChange={(event) =>
                          setCommunityDescription(event.target.value)
                        }
                        className="field-input min-h-[110px] resize-y"
                      />
                      <label className="block text-sm text-slate-300">
                        <span className="mb-2 block">Privacidade</span>
                        <select
                          value={communityPrivacy}
                          onChange={(event) =>
                            setCommunityPrivacy(event.target.value)
                          }
                          className="field-input"
                        >
                          <option value="public">Publica</option>
                          <option value="private">Privada</option>
                        </select>
                      </label>
                      <button
                        onClick={handleCreateCommunity}
                        disabled={communitySubmitting}
                        className="primary-button w-full justify-center px-4 py-3"
                      >
                        {communitySubmitting
                          ? "Criando..."
                          : "Salvar comunidade"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="glass-panel rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Comunidades em destaque
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {communities.length === 0
                        ? "No momento nao tem comunidades criadas."
                        : "Outras pessoas podem participar ou sair por aqui."}
                    </p>
                  </div>
                </div>

                {communityError ? (
                  <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {communityError}
                  </p>
                ) : null}

                <div className="mt-4 space-y-3">
                  {communitiesLoading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                      Carregando comunidades...
                    </div>
                  ) : communities.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
                      Nenhuma comunidade foi criada ainda. Quem criar a primeira
                      ja aparece aqui em destaque para outras pessoas
                      participarem.
                    </div>
                  ) : (
                    communities.map((community) => (
                      <article
                        key={community._id}
                        onClick={() => openCommunity(community._id)}
                        className="p-feed-community cursor-pointer rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/30 hover:bg-white/[0.05]"
                      >
                        <div className="p-feed-community-heading">
                          <div className="p-feed-community-identity">
                            <Image
                              unoptimized
                              width={128}
                              height={128}
                              src={community.avatar || "/sacred/favicon.svg"}
                              alt={community.name}
                              className="p-feed-community-avatar h-12 w-12 rounded-2xl object-cover"
                            />
                            <div className="p-feed-community-copy">
                              <p className="p-feed-community-name font-medium text-slate-100">
                                {community.name}
                              </p>
                              <p className="p-feed-community-privacy mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                {community.privacy === "private"
                                  ? "Privada"
                                  : "Pública"}
                              </p>
                              <p className="p-feed-community-members">
                                {community.membersCount} membro
                                {community.membersCount === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {community.description ? (
                          <p className="p-feed-community-description mt-3 text-sm leading-6 text-slate-400">
                            {community.description}
                          </p>
                        ) : null}

                        <div className="p-feed-community-footer mt-4 flex items-center justify-between gap-3">
                          <p className="p-feed-community-owner text-xs text-slate-500">
                            Criada por {community.ownerName}
                          </p>

                          {community.isOwner ? (
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                              Sua comunidade
                            </span>
                          ) : (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCommunityMembership(community);
                              }}
                              disabled={communityActionId === community._id}
                              className="secondary-button rounded-full px-4 py-2 text-sm"
                            >
                              {communityActionId === community._id
                                ? "Salvando..."
                                : community.joined
                                  ? "Sair"
                                  : community.privacy === "private"
                                    ? "Participar"
                                    : "Participar"}
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </aside>

          <div>
            <header className="glass-panel mb-6 rounded-[28px] px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                    Feed em tempo real
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">
                    Seu espaco de publicacao
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                    Compartilhe ideias, acompanhe novas mensagens ao vivo e
                    mantenha a conversa fluindo com uma interface mais limpa.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {session?.user?.role === "superadmin" ? (
                    <button
                      onClick={() => router.push("/admin")}
                      className="secondary-button rounded-full px-4 py-2 text-sm"
                    >
                      Admin
                    </button>
                  ) : null}
                  <button
                    onClick={() => router.push("/profile")}
                    className="secondary-button gap-3 rounded-full px-3 py-2"
                  >
                    <Image
                      unoptimized
                      width={128}
                      height={128}
                      src={avatarUrl}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span className="max-w-[120px] truncate text-sm">
                      {session?.user?.name}
                    </span>
                  </button>

                  <button
                    onClick={() => router.push("/profile")}
                    className="secondary-button rounded-full px-4 py-2 text-sm"
                  >
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
                <Image
                  unoptimized
                  width={128}
                  height={128}
                  src={avatarUrl}
                  alt="avatar"
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-white">
                    {session?.user?.name}
                  </p>
                  <p className="text-sm text-slate-400">
                    O que voce quer compartilhar agora?
                  </p>
                </div>
              </div>

              <textarea
                placeholder="Escreva uma mensagem para a comunidade..."
                aria-label="Sua publicação"
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
                  <p className="text-sm text-slate-500">
                    As novas publicacoes aparecem em tempo real para todos.
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Dica: escreva com contexto para gerar respostas melhores.
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={publishing}
                  className="primary-button px-5 py-3"
                >
                  {publishing ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </section>

            <section className="mb-4 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-medium text-white">Timeline</p>
                <p className="text-sm text-slate-500">{messagesLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                {requestedMessage || hasInvalidMessageParam ? (
                  <button
                    type="button"
                    onClick={() => router.push("/feed")}
                    className="secondary-button rounded-full px-4 py-2 text-xs"
                  >
                    Ver todas as publicações
                  </button>
                ) : null}
                {feedLoading ? (
                  <span className="text-sm text-slate-500">Atualizando...</span>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              {feedLoading ? (
                <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
                  Carregando publicacoes...
                </div>
              ) : requestedMessageUnavailable ? (
                <div
                  role="status"
                  className="glass-panel rounded-[28px] p-8 text-center text-slate-400"
                >
                  <p className="text-base font-medium text-white">
                    Esta publicação não está mais disponível ou foi removida.
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    O conteúdo original desta notificação pode ter sido excluído
                    ou você não tem permissão para visualizá-lo.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/feed")}
                    className="secondary-button mt-4 rounded-full px-4 py-2 text-sm"
                  >
                    Ver todas as publicações do feed
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
                  Nenhuma mensagem ainda. Seja a primeira pessoa a publicar.
                </div>
              ) : (
                messages.map((msg) =>
                  msg?._id ? (
                    <MessageCard
                      key={msg._id}
                      msg={msg}
                      focused={msg._id === requestedMessage}
                      highlightedCommentId={
                        msg._id === requestedMessage ? requestedComment : ""
                      }
                      commentUnavailable={
                        msg._id === requestedMessage && hasInvalidCommentParam
                      }
                      onDeleted={(id) =>
                        setMessages((current) =>
                          current.filter((item) => item._id !== id),
                        )
                      }
                    />
                  ) : null,
                )
              )}
            </section>
          </div>
        </div>
      </div>
      <LoadMoreButton
        items={messages}
        endpoint={"/api/messages"}
        onLoad={(data) =>
          setMessages((current) => [
            ...current,
            ...data.filter(
              (item) => !current.some((existing) => existing._id === item._id),
            ),
          ])
        }
      />
    </div>
  );
}
