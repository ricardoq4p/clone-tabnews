import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState({
    users: [],
    messages: [],
    comments: [],
    communities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "superadmin") {
      router.push("/feed");
    }
  }, [router, session, status]);

  useEffect(() => {
    if (!session || session.user.role !== "superadmin") return;

    fetch("/api/admin/overview")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error || "Nao foi possivel carregar o painel.");
        }
        return body;
      })
      .then((body) => setData(body))
      .catch((err) => setError(err.message || "Nao foi possivel carregar o painel."))
      .finally(() => setLoading(false));
  }, [session]);

  async function destroy(path, collection, id) {
    try {
      setActionId(id);
      setError("");

      const response = await fetch(path, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || "Nao foi possivel concluir a exclusao.");
      }

      setData((current) => ({
        ...current,
        [collection]: current[collection].filter((item) => item._id !== id),
      }));
    } catch (err) {
      setError(err.message || "Nao foi possivel concluir a exclusao.");
    } finally {
      setActionId("");
    }
  }

  if (status === "loading" || !session || session.user.role !== "superadmin") {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="glass-panel rounded-[28px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                Superadmin
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Painel total do PanteraLab</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Aqui voce consegue moderar usuarios, comunidades, posts e comentarios com acesso total.
              </p>
            </div>
            <button
              onClick={() => router.push("/feed")}
              className="secondary-button rounded-full px-4 py-2 text-sm"
            >
              Voltar ao feed
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="glass-panel rounded-[28px] p-8 text-center text-slate-400">
            Carregando painel admin...
          </div>
        ) : (
          <div className="grid gap-6">
            <section className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Usuarios</h2>
                  <p className="text-sm text-slate-500">{data.users.length} cadastrados</p>
                </div>
              </div>
              <div className="space-y-3">
                {data.users.map((user) => (
                  <article
                    key={user._id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {user.role} - {user.isVerified ? "verificado" : "pendente"} - {formatDate(user.createdAt)}
                      </p>
                    </div>
                    {user._id === session.user.id ? (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        Voce
                      </span>
                    ) : (
                      <button
                        onClick={() => destroy(`/api/admin/users/${user._id}`, "users", user._id)}
                        disabled={actionId === user._id}
                        className="secondary-button rounded-full px-4 py-2 text-sm"
                      >
                        {actionId === user._id ? "Excluindo..." : "Excluir usuario"}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Comunidades</h2>
                <p className="text-sm text-slate-500">{data.communities.length} cadastradas</p>
              </div>
              <div className="space-y-3">
                {data.communities.map((community) => (
                  <article
                    key={community._id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{community.name}</p>
                      <p className="text-sm text-slate-400">{community.description || "Sem descricao."}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {community.privacy} - {community.membersCount} membros - {community.ownerEmail}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        destroy(`/api/communities/${community._id}`, "communities", community._id)
                      }
                      disabled={actionId === community._id}
                      className="secondary-button rounded-full px-4 py-2 text-sm"
                    >
                      {actionId === community._id ? "Excluindo..." : "Excluir comunidade"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Posts recentes</h2>
                <p className="text-sm text-slate-500">{data.messages.length} listados</p>
              </div>
              <div className="space-y-3">
                {data.messages.map((message) => (
                  <article
                    key={message._id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="max-w-3xl">
                      <p className="font-medium text-white">{message.authorName}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{message.content}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {message.authorEmail} - {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        destroy(
                          `/api/messages?id=${message._id}`,
                          "messages",
                          message._id,
                        )
                      }
                      disabled={actionId === message._id}
                      className="secondary-button rounded-full px-4 py-2 text-sm"
                    >
                      {actionId === message._id ? "Excluindo..." : "Excluir post"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Comentarios recentes</h2>
                <p className="text-sm text-slate-500">{data.comments.length} listados</p>
              </div>
              <div className="space-y-3">
                {data.comments.map((comment) => (
                  <article
                    key={comment._id}
                    className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="max-w-3xl">
                      <p className="font-medium text-white">{comment.authorName}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{comment.content}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {comment.authorEmail} - {formatDate(comment.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        destroy(
                          `/api/comments?id=${comment._id}`,
                          "comments",
                          comment._id,
                        )
                      }
                      disabled={actionId === comment._id}
                      className="secondary-button rounded-full px-4 py-2 text-sm"
                    >
                      {actionId === comment._id ? "Excluindo..." : "Excluir comentario"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
