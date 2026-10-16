import { useRouter } from "next/router";
import PrayerLayout from "../components/prayer/Layout";
import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import "../styles/globals.css";
import "../styles/prayer.css";
import "../styles/design-system.css";
import "../styles/retro.css";

function PresenceHeartbeat() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return undefined;

    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;

      try {
        await fetch("/api/users/presence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch {
        // Presence is best-effort and should not disturb the app flow.
      }
    };

    ping();

    const intervalId = window.setInterval(ping, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ping();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.id, status, session]);

  return null;
}

function RoutedPage({ Component, pageProps, legacy }) {
  const route = useRouter();
  const { data: session } = useSession();
  return legacy ? (
    <PrayerLayout legacy title="Sua comunidade de oração">
      <Component
        key={`${session?.user?.id || "visitor"}:${session?.user?.role || "guest"}:${route.asPath.split("#")[0]}`}
        {...pageProps}
      />
    </PrayerLayout>
  ) : (
    <Component
      key={`${session?.user?.id || "visitor"}:${session?.user?.role || "guest"}`}
      {...pageProps}
    />
  );
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const legacy = [
    "/feed",
    "/profile",
    "/admin",
    "/comunidades/[id]",
    "/user/[username]",
    "/user/edit",
    "/upload",
  ].includes(router.pathname);
  return (
    <SessionProvider session={pageProps.session}>
      <PresenceHeartbeat />
      <RoutedPage Component={Component} pageProps={pageProps} legacy={legacy} />
    </SessionProvider>
  );
}
