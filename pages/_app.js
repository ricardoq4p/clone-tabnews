import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import "../styles/globals.css";

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

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <PresenceHeartbeat />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
