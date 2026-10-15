import { realtimeEnabled } from "@/lib/integration-policy";
import Pusher from "pusher-js";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import MessageCard from "@/components/MessageCard";
import { requestJson, jsonRequest } from "@/lib/client";
const categories = [
  { id: "", title: "Todas as partilhas" },
  { id: "prayer", title: "Pedidos de oração" },
  { id: "testimony", title: "Testemunhos" },
  { id: "reflection", title: "Reflexões" },
];
export default function Comunidade() {
  const { data: session } = useSession();
  const [category, setCategory] = useState(""),
    [messages, setMessages] = useState([]),
    [communities, setCommunities] = useState([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [content, setContent] = useState(""),
    [postType, setPostType] = useState("prayer"),
    [publishing, setPublishing] = useState(false),
    [postError, setPostError] = useState("");
  const scope = `${category}:${session?.user?.id || "visitor"}`;
  const [loadedScope, setLoadedScope] = useState(null),
    [communityScope, setCommunityScope] = useState(null);
  const currentMessages = loadedScope === scope ? messages : [];
  const currentCommunities =
    communityScope === (session?.user?.id || "visitor") ? communities : [];
  const generation = useRef(0);
  const load = useCallback(
    async (before) => {
      const gen = ++generation.current;
      const query = new URLSearchParams();
      if (category) query.set("category", category);
      if (before) query.set("before", before);
      return requestJson(`/api/messages?${query}`)
        .then((result) => {
          if (gen !== generation.current) return;
          setError("");
          setLoadedScope(scope);
          setMessages((old) =>
            before
              ? [
                  ...old,
                  ...result.filter(
                    (item) => !old.some((current) => current._id === item._id),
                  ),
                ]
              : result,
          );
        })
        .catch((err) => {
          if (gen === generation.current) {
            setError(err.message);
            if (!before) setMessages([]);
          }
        })
        .finally(() => {
          if (gen === generation.current) setBusy(false);
        });
    },
    [category, scope],
  );
  useEffect(() => {
    let stopped = false;
    load();
    requestJson("/api/communities")
      .then((data) => {
        if (!stopped) {
          setCommunities(Array.isArray(data) ? data : []);
          setCommunityScope(session?.user?.id || "visitor");
        }
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, [load, session?.user?.id]);
  useEffect(() => {
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
    const channels = [
      pusher.subscribe("feed"),
      ...(session
        ? communities.map((item) =>
            pusher.subscribe(`private-community-${item._id}`),
          )
        : []),
    ];
    const reload = () => load();
    channels.forEach((channel) => {
      channel.bind("new-message", reload);
      channel.bind("delete-message", reload);
    });
    return () => {
      channels.forEach((channel) => channel.unbind_all());
      pusher.disconnect();
    };
  }, [load, communities, session]);
  async function publish(event) {
    event.preventDefault();
    setPublishing(true);
    setPostError("");
    try {
      await requestJson(
        "/api/messages",
        jsonRequest("POST", {
          content,
          category: postType,
          accountId: session.user.id,
        }),
      );
      setContent("");
      await load();
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPublishing(false);
    }
  }
  return (
    <PrayerLayout title="Comunidade de oração">
      <div className="p-container">
        <div className="p-page-head">
          <div className="p-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>Comunidade
          </div>
          <p className="p-eyebrow">NA FÉ, NINGUÉM CAMINHA SOZINHO</p>
          <h1>
            Um coração que partilha.
            <br />
            <em>Uma comunidade que acolhe.</em>
          </h1>
          <p>
            Pedidos de oração, gratidão e reflexão. Aqui, cada partilha é um
            convite à caridade, ao respeito e à comunhão.
          </p>
        </div>
        <div className="p-community-layout">
          <section>
            <div className="p-panel p-composer">
              {session ? (
                <form onSubmit={publish} className="p-form-stack">
                  <label className="p-field">
                    O que você deseja partilhar?
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={5000}
                      required
                      placeholder="Uma intenção, uma graça recebida, uma reflexão que ilumina o caminho…"
                    />
                  </label>
                  <div className="p-composer-bottom">
                    <label>
                      Tipo de partilha
                      <select
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                      >
                        <option value="prayer">Pedido de oração</option>
                        <option value="testimony">Testemunho</option>
                        <option value="reflection">Reflexão católica</option>
                      </select>
                    </label>
                    <button
                      className="p-button"
                      disabled={publishing || !content.trim()}
                    >
                      {publishing
                        ? "Partilhando…"
                        : "Partilhar com a comunidade"}
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  <p className="p-muted">
                    Esta partilha será pública. Para uma intenção privada ou
                    anônima, visite a{" "}
                    <Link href="/capelinha" className="p-inline-link">
                      Capelinha
                    </Link>
                    .
                  </p>
                  {postError ? (
                    <p className="p-error" role="alert">
                      {postError}
                    </p>
                  ) : null}
                </form>
              ) : (
                <div className="p-join-community">
                  <Icon name="people" size={27} />
                  <div>
                    <h2>Há lugar para a sua história.</h2>
                    <p>
                      Entre para partilhar e registrar que rezou pelas intenções
                      de outras pessoas.
                    </p>
                  </div>
                  <Link href="/login" className="p-button">
                    Fazer parte
                  </Link>
                </div>
              )}
            </div>
            <div className="p-tabs" role="group" aria-label="Filtrar partilhas">
              {categories.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                >
                  {item.title}
                </button>
              ))}
            </div>
            {error ? (
              <div className="p-notice" role="status">
                <p>{error}</p>
                <button className="p-inline-button" onClick={() => load()}>
                  Tentar novamente
                </button>
              </div>
            ) : null}
            {busy && !currentMessages.length ? (
              <p className="p-loading" role="status">
                Reunindo as partilhas…
              </p>
            ) : !currentMessages.length && !error ? (
              <div className="p-empty">
                <Icon name="leaf" size={30} />
                <h2>Uma comunidade também começa no silêncio.</h2>
                <p>
                  Se desejar, seja a primeira pessoa a partilhar neste espaço.
                </p>
              </div>
            ) : null}
            <div className="p-social">
              {currentMessages.map((message) => (
                <MessageCard
                  key={message._id}
                  msg={message}
                  onDeleted={(id) =>
                    setMessages((old) => old.filter((item) => item._id !== id))
                  }
                />
              ))}
            </div>
            {currentMessages.length > 0 && currentMessages.length % 50 === 0 ? (
              <div className="p-load">
                <button
                  className="p-button p-button-outline"
                  disabled={busy}
                  onClick={() => load(currentMessages.at(-1)._id)}
                >
                  Partilhas anteriores
                </button>
              </div>
            ) : null}
          </section>
          <aside className="p-community-aside">
            <section className="p-panel">
              <Icon name="cross" size={24} />
              <h2>Partilhe com caridade.</h2>
              <p>
                Respeite a história de cada pessoa. Preserve a privacidade,
                evite julgamentos e acolha quem precisa de oração.
              </p>
              <Link href="/sobre" className="p-text-link">
                Nosso jeito de caminhar
                <Icon name="arrow" size={14} />
              </Link>
            </section>
            <section className="p-panel">
              <p className="p-eyebrow">COMUNIDADES DE ORAÇÃO</p>
              <h2>Encontre sua companhia.</h2>
              {currentCommunities.length ? (
                <ul>
                  {currentCommunities.slice(0, 8).map((item) => (
                    <li key={item._id}>
                      <Link href={`/comunidades/${item._id}`}>
                        <Icon
                          name={item.privacy === "private" ? "lock" : "people"}
                          size={17}
                        />
                        <span>
                          {item.name}
                          <small>{item.membersCount} participantes</small>
                        </span>
                        <Icon name="arrow" size={14} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Os grupos disponíveis aparecerão aqui quando a comunidade
                  estiver conectada.
                </p>
              )}
              <Link
                className="p-button p-button-outline"
                href={session ? "/feed" : "/login"}
              >
                Criar ou explorar comunidades
              </Link>
            </section>
            <section className="p-community-prayer">
              <Icon name="rosary" size={29} />
              <p>
                Antes de responder,
                <br />
                <em>que tal uma oração?</em>
              </p>
              <Link className="p-text-link" href="/rosario">
                Rezar o Rosário
                <Icon name="arrow" size={15} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </PrayerLayout>
  );
}
