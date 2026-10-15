import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { requestJson, formatPrayerDate } from "@/lib/client";
export default function UserProfile() {
  const router = useRouter();
  const { data: session } = useSession();
  const username = router.query.username;
  const [user, setUser] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (typeof username !== "string") return;
    let stopped = false;
    requestJson(`/api/users/${encodeURIComponent(username)}`)
      .then((data) => {
        if (!stopped) {
          setUser(data);
          setError("");
        }
      })
      .catch(() => {
        if (!stopped) setError("Não foi possível encontrar este participante.");
      });
    return () => {
      stopped = true;
    };
  }, [username]);
  return (
    <div className="mx-auto min-h-[65vh] max-w-lg px-5 py-12">
      <section className="glass-panel rounded-3xl p-8 text-center">
        {error ? (
          <p role="status">{error}</p>
        ) : !user || user.username !== username ? (
          <p role="status">Preparando o perfil…</p>
        ) : (
          <>
            <Image
              unoptimized
              src={user.avatar || "/sacred/favicon.svg"}
              alt={`Foto de apresentação de ${user.name || user.username}`}
              width={100}
              height={100}
              className="mx-auto mb-5 rounded-full object-cover"
            />
            <h1 className="text-3xl">{user.name || user.username}</h1>
            <p className="mt-3 text-slate-500">@{user.username}</p>
            {user.createdAt ? (
              <p className="mt-4 text-sm text-slate-500">
                Na comunidade desde{" "}
                {formatPrayerDate(user.createdAt, { year: "numeric" })}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {session?.user?.id === user._id ? (
                <Link href="/profile" className="primary-button px-5 py-3">
                  Cuidar do meu perfil
                </Link>
              ) : null}
              <Link href="/comunidade" className="secondary-button px-5 py-3">
                Voltar à comunidade
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
