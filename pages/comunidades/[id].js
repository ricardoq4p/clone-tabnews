import { realtimeEnabled, uploadsEnabled } from "@/lib/integration-policy";
import Image from "next/image";
import LoadMoreButton from "../../components/LoadMoreButton";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Pusher from "pusher-js";
import imageCompression from "browser-image-compression";
import MessageCard from "../../components/MessageCard";

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [invitationEmail, setInvitationEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [communityError, setCommunityError] = useState("");
  const [communityActionId, setCommunityActionId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrivacy, setEditPrivacy] = useState("public");
  const [editAvatar, setEditAvatar] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [router, session, status]);

  useEffect(() => {
    if (!session) return;

    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session || !id) return;

    fetch(`/api/communities/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data?.error || "Nao foi possivel carregar a comunidade.",
          );
        }

        return data;
      })
      .then((data) => setCommunity(data))
      .then(() => setCommunityError(""))
      .catch((error) =>
        setCommunityError(
          error.message || "Nao foi possivel carregar a comunidade.",
        ),
      )
      .finally(() => setCommunityLoading(false));
  }, [id, session]);

  useEffect(() => {
    if (!session || !id) return;

    fetch(`/api/messages?communityId=${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          return [];
        }

        return Array.isArray(data) ? data : [];
      })
      .then((data) => setMessages(data))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [id, session]);

  useEffect(() => {
    if (!id) return;

    if (
      !realtimeEnabled ||
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    )
      return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
    });

    const channel = pusher.subscribe(`private-community-${id}`);

    const reload = () => {
      fetch(`/api/messages?communityId=${id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setMessages(Array.isArray(data) ? data : []))
        .catch(() => {});
      fetch(`/api/communities/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setCommunity)
        .catch(() => {});
    };
    channel.bind("new-message", reload);
    channel.bind("delete-message", reload);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-community-${id}`);
      pusher.disconnect();
    };
  }, [id]);

  const avatarUrl = userData?.avatar || "/sacred/favicon.svg";

  const canPublish = Boolean(community?.joined || community?.isOwner);
  const communityAvatar = community?.avatar || "/sacred/favicon.svg";

  const handleCommunityMembership = async () => {
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

      setCommunity(data);
    } catch (error) {
      setCommunityError(
        error.message || "Nao foi possivel atualizar a comunidade.",
      );
    } finally {
      setCommunityActionId("");
    }
  };

  const handleSubmit = async () => {
    if (!newMessage.trim() || publishing || !community?._id) return;

    try {
      setPublishing(true);
      setPublishError("");

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          communityId: community._id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "Nao foi possivel publicar na comunidade.",
        );
      }

      setMessages((current) =>
        current.some((item) => item._id === data._id)
          ? current
          : [data, ...current],
      );
      setNewMessage("");
    } catch (error) {
      setPublishError(
        error.message || "Nao foi possivel publicar na comunidade.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleCommunityImage = async (file) => {
    if (!file) return;

    try {
      setEditSaving(true);
      setCommunityError("");

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.08,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      if (!uploadsEnabled) return;
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.secure_url) {
        throw new Error("Nao foi possivel enviar a imagem da comunidade.");
      }

      setEditAvatar(data.secure_url);
    } catch (error) {
      setCommunityError(
        error.message || "Nao foi possivel enviar a imagem da comunidade.",
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveCommunity = async () => {
    if (!community?._id || !editName.trim() || editSaving) return;

    try {
      setEditSaving(true);
      setCommunityError("");

      const response = await fetch(`/api/communities/${community._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          privacy: editPrivacy,
          avatar: editAvatar,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || "Nao foi possivel atualizar a comunidade.",
        );
      }

      setCommunity(data);
      setEditOpen(false);
    } catch (error) {
      setCommunityError(
        error.message || "Nao foi possivel atualizar a comunidade.",
      );
    } finally {
      setEditSaving(false);
    }
  };

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="glass-panel rounded-[28px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <button
                onClick={() => router.push("/feed")}
                className="secondary-button rounded-full px-4 py-2 text-sm"
              >
                Voltar ao feed
              </button>
              <div className="mt-5 flex items-center gap-4">
                <Image
                  unoptimized
                  width={128}
                  height={128}
                  src={communityAvatar}
                  alt={community?.name || "Comunidade"}
                  className="h-20 w-20 rounded-[24px] object-cover ring-1 ring-cyan-300/20"
                />
                <div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                    Comunidade
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">
                    {communityLoading
                      ? "Carregando comunidade..."
                      : community?.name}
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                {community?.description ||
                  "Espaco para publicar e conversar sobre o tema desta comunidade."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

              {community?.isOwner ? (
                <button
                  onClick={() => {
                    if (!editOpen) {
                      setEditName(community.name || "");
                      setEditDescription(community.description || "");
                      setEditPrivacy(community.privacy || "public");
                      setEditAvatar(community.avatar || "");
                    }
                    setEditOpen((current) => !current);
                  }}
                  className="secondary-button rounded-full px-4 py-2 text-sm"
                >
                  {editOpen ? "Fechar edicao" : "Editar comunidade"}
                </button>
              ) : null}

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="secondary-button rounded-full px-4 py-2 text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {communityError ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {communityError}
          </div>
        ) : null}

        {editOpen ? (
          <section className="glass-panel mt-6 rounded-[28px] p-5 sm:p-6">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[220px,1fr]">
              <div>
                <p className="text-sm font-medium text-white">
                  Imagem da comunidade
                </p>
                <Image
                  unoptimized
                  width={128}
                  height={128}
                  src={editAvatar || "/sacred/favicon.svg"}
                  alt="Preview da comunidade"
                  className="mt-4 h-28 w-28 rounded-[24px] object-cover ring-1 ring-cyan-300/20"
                />
                <label className="mt-4 block text-sm text-slate-300">
                  <span className="mb-2 block">Trocar imagem</span>
                  <input
                    type="file"
                    disabled={!uploadsEnabled}
                    accept="image/*"
                    onChange={(event) =>
                      handleCommunityImage(event.target.files?.[0])
                    }
                    className="field-input cursor-pointer file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-200"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-white">
                  Editar comunidade
                </p>
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Nome da comunidade"
                  aria-label="Nome da comunidade"
                  className="field-input"
                />
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder="Descricao da comunidade"
                  aria-label="Descrição da comunidade"
                  className="field-input min-h-[120px] resize-y"
                />
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block">Privacidade</span>
                  <select
                    value={editPrivacy}
                    onChange={(event) => setEditPrivacy(event.target.value)}
                    className="field-input"
                  >
                    <option value="public">Publica</option>
                    <option value="private">Privada</option>
                  </select>
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleSaveCommunity}
                    disabled={editSaving}
                    className="primary-button px-5 py-3"
                  >
                    {editSaving ? "Salvando..." : "Salvar alteracoes"}
                  </button>
                  <button
                    onClick={() => setEditOpen(false)}
                    className="secondary-button rounded-full px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[300px,1fr]">
          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="glass-panel rounded-[28px] p-5">
              <p className="text-sm font-medium text-white">
                Sobre a comunidade
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p>
                  <span className="text-slate-500">Criada em:</span>{" "}
                  {community?.createdAt ? formatDate(community.createdAt) : "-"}
                </p>
                <p>
                  <span className="text-slate-500">Membros:</span>{" "}
                  {community?.membersCount ?? 0}
                </p>
                <p>
                  <span className="text-slate-500">Criador:</span>{" "}
                  {community?.ownerName || "-"}
                </p>
                <p>
                  <span className="text-slate-500">Privacidade:</span>{" "}
                  {community?.privacy === "private" ? "Privada" : "Publica"}
                </p>
              </div>

              {community?.isOwner ? (
                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100">
                  Voce criou esta comunidade.
                </div>
              ) : (
                <button
                  onClick={handleCommunityMembership}
                  disabled={!community || communityActionId === community._id}
                  className="primary-button mt-5 w-full justify-center px-4 py-3"
                >
                  {communityActionId === community?._id
                    ? "Salvando..."
                    : community?.joined
                      ? "Sair da comunidade"
                      : "Participar da comunidade"}
                </button>
              )}
            </section>

            <section className="glass-panel rounded-[28px] p-5">
              <p className="text-sm font-medium text-white">Melhor uso</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Publice notas, perguntas e conversas que tenham a ver com o tema
                desta comunidade para manter tudo organizado.
              </p>
            </section>
          </aside>

          <div>
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
                    Publique algo sobre {community?.name || "esta comunidade"}.
                  </p>
                </div>
              </div>

              <textarea
                aria-label="Sua publicação na comunidade"
                placeholder={
                  canPublish
                    ? "Escreva uma nota para a comunidade..."
                    : "Participe da comunidade para publicar."
                }
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                disabled={!canPublish}
                className="field-input min-h-[140px] resize-y disabled:cursor-not-allowed disabled:opacity-60"
              />

              {publishError ? (
                <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {publishError}
                </p>
              ) : null}

              {!canPublish ? (
                <p className="mt-4 text-sm text-slate-500">
                  Entre na comunidade para publicar e interagir com esse espaco.
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Os posts aqui ficam organizados por tema e continuam
                    encontrados depois.
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!canPublish || publishing}
                  className="primary-button px-5 py-3"
                >
                  {publishing ? "Publicando..." : "Publicar na comunidade"}
                </button>
              </div>
            </section>

            <section className="mb-4 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-sm font-medium text-white">
                  Publicacoes da comunidade
                </p>
                <p className="text-sm text-slate-500">
                  {messages.length === 1
                    ? "1 post nesta comunidade"
                    : `${messages.length} posts nesta comunidade`}
                </p>
              </div>
              {messagesLoading ? (
                <span className="text-sm text-slate-500">Atualizando...</span>
              ) : null}
            </section>

            <section className="space-y-4">
              {messagesLoading ? (
                <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
                  Carregando publicacoes...
                </div>
              ) : messages.length === 0 ? (
                <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
                  Ainda nao existem posts nesta comunidade. A primeira
                  publicacao pode ser sua.
                </div>
              ) : (
                messages.map((message) =>
                  message?._id ? (
                    <MessageCard
                      key={message._id}
                      msg={message}
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
        endpoint={`/api/messages?communityId=${id}`}
        onLoad={(data) =>
          setMessages((current) => [
            ...current,
            ...data.filter(
              (item) => !current.some((existing) => existing._id === item._id),
            ),
          ])
        }
      />
      {community?.isOwner && community?.privacy === "private" ? (
        <form
          className="glass-panel mx-auto mt-6 max-w-6xl rounded-3xl p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setInviting(true);
            setCommunityError("");
            try {
              const response = await fetch(`/api/communities/${id}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "approve",
                  email: invitationEmail,
                }),
              });
              const data = await response.json();
              if (!response.ok)
                throw new Error(
                  data.error || "Nao foi possivel adicionar o participante.",
                );
              setCommunity(data);
              setInvitationEmail("");
            } catch (error) {
              setCommunityError(error.message);
            } finally {
              setInviting(false);
            }
          }}
        >
          <label className="block">
            Email do participante com conta verificada
            <input
              type="email"
              required
              value={invitationEmail}
              onChange={(e) => setInvitationEmail(e.target.value)}
              className="field-input mt-2"
            />
          </label>
          <button disabled={inviting} className="primary-button mt-3">
            {inviting ? "Adicionando..." : "Adicionar a comunidade privada"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
