import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import Icon from "./Icon";
import { realtimeEnabled } from "@/lib/integration-policy";

const timeAgo = (value) => {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value)) / 1000),
  );
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
};

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const root = useRef(null);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const refreshCount = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch("/api/notifications/unread-count");
      if (!response.ok)
        throw new Error("Não foi possível atualizar as notificações.");
      const data = await response.json();
      setCount(Number(data.count) || 0);
    } catch {
      // The current value stays visible; a later poll or user action retries.
    }
  }, [session?.user?.id]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications?limit=8");
      if (!response.ok)
        throw new Error("Não foi possível carregar as notificações.");
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      await refreshCount();
    } catch (loadError) {
      setError(
        loadError.message || "Não foi possível carregar as notificações.",
      );
    } finally {
      setLoading(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return undefined;
    const initialRefresh = window.setTimeout(refreshCount, 0);
    const poll = () => {
      if (document.visibilityState === "visible") refreshCount();
    };
    const interval = window.setInterval(poll, 60000);
    document.addEventListener("visibilitychange", poll);
    let pusher;
    let channel;
    if (
      realtimeEnabled &&
      process.env.NEXT_PUBLIC_PUSHER_KEY &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
        },
      });
      channel = pusher.subscribe(`private-user-${session.user.id}`);
      channel.bind("notifications-changed", () => {
        refreshCount();
        if (openRef.current) loadItems();
      });
    }
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(initialRefresh);
      document.removeEventListener("visibilitychange", poll);
      if (channel) {
        channel.unbind_all();
        pusher.unsubscribe(channel.name);
        pusher.disconnect();
      }
    };
  }, [status, session?.user?.id, refreshCount, loadItems]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== "authenticated") return null;

  const markRead = async (item) => {
    if (item.readAt) return;
    setItems((current) =>
      current.map((entry) =>
        entry._id === item._id
          ? { ...entry, readAt: new Date().toISOString() }
          : entry,
      ),
    );
    setCount((current) => Math.max(0, current - 1));
    try {
      const response = await fetch(`/api/notifications/${item._id}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("read failed");
    } catch {
      setItems((current) =>
        current.map((entry) =>
          entry._id === item._id ? { ...entry, readAt: null } : entry,
        ),
      );
      refreshCount();
    }
  };

  const markAllRead = async () => {
    const oldItems = items;
    setItems((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt || new Date().toISOString(),
      })),
    );
    setCount(0);
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("read failed");
    } catch {
      setItems(oldItems);
      refreshCount();
    }
  };

  return (
    <div className="p-notification" ref={root}>
      <button
        type="button"
        className="p-account p-notification-trigger"
        aria-label={count ? `Notificações, ${count} não lidas` : "Notificações"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadItems();
        }}
      >
        <Icon name="bell" size={17} />
        <span className="p-notification-label">Notificações</span>
        {count > 0 ? (
          <span className="p-notification-badge">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <section
          className="p-notification-panel"
          role="dialog"
          aria-label="Notificações recentes"
        >
          <div className="p-notification-panel-head">
            <h2>Notificações</h2>
            {count ? (
              <button type="button" onClick={markAllRead}>
                Marcar todas como lidas
              </button>
            ) : null}
          </div>
          {loading && !items.length ? (
            <p className="p-notification-state" role="status">
              Carregando…
            </p>
          ) : null}
          {error ? (
            <div className="p-notification-state" role="alert">
              {error}
              <button type="button" onClick={loadItems}>
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!loading && !error && !items.length ? (
            <p className="p-notification-state">
              Tudo em paz por aqui. Quando houver novidades, elas aparecerão
              aqui.
            </p>
          ) : null}
          <ul className="p-notification-list">
            {items.map((item) => (
              <li
                key={item._id}
                className={item.readAt ? "is-read" : "is-unread"}
              >
                <Link
                  href={
                    item.href ||
                    (item.targetType === "candle"
                      ? `/minhas-velas?candle=${item.targetId}`
                      : item.targetType === "community"
                        ? `/comunidades/${item.targetId}`
                        : item.communityId
                          ? `/comunidades/${item.communityId}#message-${item.targetId}`
                          : `/feed#message-${item.targetId}`)
                  }
                  onClick={() => markRead(item)}
                >
                  <Icon
                    name={
                      item.type === "community_invite"
                        ? "people"
                        : item.type.includes("prayer")
                          ? "heart"
                          : "message"
                    }
                    size={17}
                  />
                  <span>
                    <span className="p-notification-message">
                      {item.message}
                    </span>
                    <time dateTime={item.createdAt}>
                      {timeAgo(item.createdAt)}
                    </time>
                  </span>
                  {!item.readAt ? (
                    <span
                      className="p-notification-dot"
                      aria-label="Não lida"
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          <Link className="p-notification-all" href="/notificacoes">
            Ver todas as notificações
          </Link>
        </section>
      ) : null}
    </div>
  );
}
