import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import { notificationHref } from "@/lib/validation";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (cursor = null) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/notifications?limit=20${cursor ? `&before=${encodeURIComponent(cursor)}` : ""}`,
      );
      if (!response.ok)
        throw new Error("Não foi possível carregar as notificações.");
      const data = await response.json();
      setItems((current) =>
        cursor ? [...current, ...data.items] : data.items,
      );
      setNext(data.next);
    } catch (loadError) {
      setError(
        loadError.message || "Não foi possível carregar as notificações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status !== "authenticated") return undefined;
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [status, router, load]);

  const markRead = async (item) => {
    if (item.readAt) return;
    setItems((current) =>
      current.map((entry) =>
        entry._id === item._id
          ? { ...entry, readAt: new Date().toISOString() }
          : entry,
      ),
    );
    await fetch(`/api/notifications/${item._id}`, {
      method: "PATCH",
      keepalive: true,
    });
  };

  return (
    <PrayerLayout title="Notificações">
      <section className="p-container p-notifications-page">
        <p className="p-eyebrow">Sua casa de oração</p>
        <h1>Notificações</h1>
        <p className="p-notifications-intro">
          Acompanhe com tranquilidade as interações relacionadas a você.
        </p>
        {error ? (
          <p role="alert" className="p-notification-state">
            {error}
            <button type="button" onClick={() => load()}>
              Tentar novamente
            </button>
          </p>
        ) : null}
        {!loading && !error && !items.length ? (
          <p className="p-notification-state">
            Tudo em paz por aqui. Quando houver novidades, elas aparecerão aqui.
          </p>
        ) : null}
        <ul className="p-notification-list p-notifications-history">
          {items.map((item) => (
            <li
              key={item._id}
              className={item.readAt ? "is-read" : "is-unread"}
            >
              <Link
                href={item.href || notificationHref(item)}
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
                  size={19}
                />
                <span>
                  <span className="p-notification-message">{item.message}</span>
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </time>
                </span>
                {!item.readAt ? (
                  <span className="p-notification-dot" aria-label="Não lida" />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        {loading ? (
          <p className="p-notification-state" role="status">
            Carregando…
          </p>
        ) : null}
        {next ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => load(next)}
            className="p-button"
          >
            Carregar mais
          </button>
        ) : null}
      </section>
    </PrayerLayout>
  );
}
