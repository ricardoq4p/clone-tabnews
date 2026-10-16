import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import RosaryEditor from "@/components/prayer/RosaryEditor";
import CommunityManager from "@/components/prayer/CommunityManager";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";
const tabs = [
  { id: "estatisticas", title: "Visão geral" },
  { id: "velas", title: "Velas" },
  { id: "denuncias", title: "Relatos" },
  { id: "message", title: "Publicações" },
  { id: "comment", title: "Comentários" },
  { id: "participantes", title: "Participantes" },
  { id: "comunidades", title: "Comunidades" },
  { id: "rosario", title: "Rosário" },
  { id: "auditoria", title: "Auditoria" },
  { id: "solicitacoes", title: "Privacidade" },
];
export default function Administracao() {
  const { data: session, status } = useSession();
  const allowed = session?.user?.role === "superadmin";
  const [tab, setTab] = useState("estatisticas"),
    [data, setData] = useState(null),
    [next, setNext] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [selected, setSelected] = useState(null);
  const generation = useRef(0);
  const load = useCallback(
    async (before) => {
      const gen = ++generation.current;
      if (!allowed || ["rosario", "comunidades"].includes(tab)) return;
      const endpoint = ["message", "comment"].includes(tab)
        ? `/api/admin/publicacoes?type=${tab}`
        : `/api/admin/${tab}`;
      return requestJson(
        `${endpoint}${before ? `${endpoint.includes("?") ? "&" : "?"}before=${before}` : ""}`,
      )
        .then((result) => {
          if (gen !== generation.current) return;
          setError("");
          setData((old) =>
            before
              ? { ...result, items: [...old.items, ...result.items] }
              : result,
          );
          setNext(result.next);
        })
        .catch((err) => {
          if (gen !== generation.current) return;
          setError(err.message);
        })
        .finally(() => {
          if (gen === generation.current) setBusy(false);
        });
    },
    [allowed, tab],
  );
  useEffect(() => {
    load();
    return () => {
      generation.current += 1;
    };
  }, [load]);
  function needsReason() {
    if (!reason.trim()) {
      setError("Descreva o motivo antes de revisar ou alterar um registro.");
      return false;
    }
    return true;
  }
  async function review(type, id) {
    if (!needsReason()) return;
    const gen = generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await requestJson(
        `/api/admin/revisao?${new URLSearchParams({ type, id, reason })}`,
      );
      if (gen !== generation.current) return;
      setSelected({ ...result.item, type });
    } catch (err) {
      if (gen === generation.current) setError(err.message);
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  }
  async function action(url, payload) {
    if (!needsReason()) return;
    const gen = generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await requestJson(
        url,
        jsonRequest("PATCH", { ...payload, reason }),
      );
      if (gen !== generation.current) return;
      setNotice(result.message);
      setSelected(null);
      await load();
    } catch (err) {
      if (gen === generation.current) setError(err.message);
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  }
  async function removeContent(item) {
    if (!needsReason() || !["message", "comment"].includes(item.type)) return;
    if (
      !window.confirm(
        item.type === "message"
          ? "Excluir definitivamente esta publicação e todos os seus comentários? Esta ação não pode ser desfeita."
          : "Excluir definitivamente este comentário? Esta ação não pode ser desfeita.",
      )
    )
      return;
    const gen = generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await requestJson(
        "/api/admin/excluir",
        jsonRequest("DELETE", {
          type: item.type,
          id: item._id,
          reason,
          accountId: session.user.id,
        }),
      );
      if (gen !== generation.current) return;
      setSelected(null);
      setNotice(result.message);
      await load();
    } catch (err) {
      if (gen === generation.current) setError(err.message);
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  }
  return (
    <PrayerLayout title="Administração">
      <div className="p-container p-admin">
        <div className="p-page-head">
          <p className="p-eyebrow">CUIDAR DESTA CASA</p>
          <h1>Administração e acolhimento.</h1>
          <p>
            Modere com responsabilidade, preserve a privacidade e mantenha o
            conteúdo fiel à tradição da Igreja.
          </p>
        </div>
        {status === "loading" ? (
          <p className="p-loading">Verificando acesso…</p>
        ) : !allowed ? (
          <div className="p-empty">
            <Icon name="shield" size={30} />
            <h2>Um espaço reservado.</h2>
            <p>Esta área exige uma conta administrativa autorizada.</p>
            <Link href="/login" className="p-button">
              Acessar minha conta
            </Link>
          </div>
        ) : (
          <>
            <div
              className="p-tabs"
              role="group"
              aria-label="Áreas de administração"
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={item.id === tab}
                  onClick={() => {
                    generation.current += 1;
                    setTab(item.id);
                    setData(null);
                    setSelected(null);
                    setError("");
                    setNotice("");
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
            {notice ? (
              <p className="p-notice" role="status">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="p-error">
                {error}
              </p>
            ) : null}
            {tab === "comunidades" ? (
              <CommunityManager />
            ) : tab === "rosario" ? (
              <div className="p-panel">
                <RosaryEditor />
              </div>
            ) : (
              <>
                {tab === "estatisticas" ? (
                  <>
                    <div className="p-admin-stat-grid">
                      {[
                        {
                          id: "users",
                          label: "Participantes cadastrados",
                          icon: "people",
                        },
                        {
                          id: "activeCandles",
                          label: "Velas acesas agora",
                          icon: "candle",
                        },
                        {
                          id: "prayers",
                          label: "Gestos de intercessão registrados",
                          icon: "heart",
                        },
                        {
                          id: "rosaries",
                          label: "Roteiros atuais concluídos",
                          icon: "rosary",
                        },
                        {
                          id: "reports",
                          label: "Relatos aguardando revisão",
                          icon: "shield",
                        },
                        {
                          id: "candles",
                          label: "Velas no histórico",
                          icon: "clock",
                        },
                      ].map((item) => (
                        <div className="p-panel" key={item.id}>
                          <Icon name={item.icon} size={24} />
                          <strong>{data ? data[item.id] : "—"}</strong>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="p-notice">
                      Estatísticas agregadas para cuidar da comunidade. Não são
                      medidas da fé ou da vida de oração de ninguém.
                    </p>
                  </>
                ) : (
                  <>
                    {["message", "comment"].includes(tab) ? (
                      <p className="p-notice">
                        Informe o motivo e escolha “Revisar conteúdo” para
                        ocultar, restaurar ou excluir definitivamente uma
                        publicação ou comentário.
                      </p>
                    ) : null}
                    <label className="p-field p-admin-reason">
                      Motivo da revisão ou da ação
                      <textarea
                        maxLength={500}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Descreva a necessidade de moderação ou atendimento…"
                      />
                      <small>
                        O motivo e a ação serão registrados. Não inclua dados
                        sensíveis desnecessários.
                      </small>
                    </label>
                    {selected ? (
                      <section className="p-panel p-review-panel">
                        <p className="p-eyebrow">
                          ACESSO REGISTRADO NA AUDITORIA
                        </p>
                        <h2>Conteúdo em revisão</h2>
                        <p className="p-review-content">{selected.content}</p>
                        <p className="p-muted">
                          Visibilidade: {selected.visibility} · Estado:{" "}
                          {selected.status || "published"}
                        </p>
                        <div className="p-actions">
                          <button
                            className="p-button"
                            disabled={busy}
                            onClick={() =>
                              action("/api/admin/moderar", {
                                type: selected.type,
                                id: selected._id,
                                action: "hide",
                              })
                            }
                          >
                            Recolher da área pública
                          </button>
                          <button
                            className="p-button p-button-outline"
                            disabled={busy}
                            onClick={() =>
                              action("/api/admin/moderar", {
                                type: selected.type,
                                id: selected._id,
                                action: "restore",
                              })
                            }
                          >
                            Restaurar visibilidade
                          </button>
                          {["message", "comment"].includes(selected.type) ? (
                            <button
                              className="p-button p-button-outline"
                              disabled={busy}
                              onClick={() => removeContent(selected)}
                            >
                              Excluir definitivamente
                            </button>
                          ) : null}
                          <button
                            className="p-inline-button"
                            onClick={() => setSelected(null)}
                          >
                            Fechar revisão
                          </button>
                        </div>
                      </section>
                    ) : null}
                    <div className="p-admin-records">
                      {data?.items?.map((item) => (
                        <article key={item._id} className="p-panel">
                          <div>
                            <p className="p-eyebrow">
                              {item.visibility ||
                                item.targetType ||
                                (tab === "participantes" ? item.role : tab)}
                            </p>
                            <h2>
                              {item.name ||
                                {
                                  privacy: "Privacidade",
                                  disrespect: "Conteúdo desrespeitoso",
                                  spam: "Uso indevido",
                                  other: "Outro relato",
                                }[item.reason] ||
                                item.action ||
                                (tab === "solicitacoes"
                                  ? {
                                      export: "Pedido de acesso",
                                      exclusion: "Pedido de exclusão",
                                      correction: "Pedido de correção",
                                    }[item.kind]
                                  : "Registro da comunidade")}
                            </h2>
                            <p className="p-muted">
                              {item.email ||
                                item.details ||
                                item.reason ||
                                item.status ||
                                "published"}
                            </p>
                            <p className="p-muted">
                              {formatPrayerDate(item.createdAt, {
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {item.expiresAt
                                ? ` · Vence em ${formatPrayerDate(item.expiresAt, { hour: "2-digit", minute: "2-digit" })}`
                                : ""}
                            </p>
                          </div>
                          <div className="p-admin-record-actions">
                            {tab === "velas" ? (
                              <button
                                className="p-button p-button-outline"
                                disabled={busy}
                                onClick={() => review("candle", item._id)}
                              >
                                Revisar intenção
                              </button>
                            ) : ["message", "comment"].includes(tab) ? (
                              <button
                                className="p-button p-button-outline"
                                disabled={busy}
                                onClick={() => review(tab, item._id)}
                              >
                                Revisar conteúdo
                              </button>
                            ) : tab === "denuncias" ? (
                              <>
                                <button
                                  className="p-button p-button-outline"
                                  disabled={busy}
                                  onClick={() =>
                                    review(item.targetType, item.targetId)
                                  }
                                >
                                  Revisar conteúdo
                                </button>
                                <button
                                  className="p-inline-button"
                                  disabled={busy}
                                  onClick={() =>
                                    action("/api/admin/denuncias", {
                                      id: item._id,
                                    })
                                  }
                                >
                                  Concluir relato
                                </button>
                              </>
                            ) : tab === "participantes" ? (
                              <button
                                className="p-button p-button-outline"
                                disabled={busy || item._id === session.user.id}
                                onClick={() =>
                                  action("/api/admin/participantes", {
                                    id: item._id,
                                    action: item.disabledAt
                                      ? "enable"
                                      : "disable",
                                  })
                                }
                              >
                                {item.disabledAt
                                  ? "Reativar conta"
                                  : "Suspender acesso"}
                              </button>
                            ) : tab === "solicitacoes" ? (
                              <button
                                className="p-button p-button-outline"
                                disabled={busy}
                                onClick={() =>
                                  action("/api/admin/solicitacoes", {
                                    id: item._id,
                                  })
                                }
                              >
                                Registrar atendimento concluído
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                    {!busy && data?.items?.length === 0 ? (
                      <div className="p-empty">
                        <Icon name="check" size={28} />
                        <h2>Nenhum registro nesta fila.</h2>
                        <p>
                          Novos registros aparecerão aqui quando precisarem de
                          cuidado.
                        </p>
                      </div>
                    ) : null}
                    {next ? (
                      <button
                        className="p-button p-button-outline"
                        disabled={busy}
                        onClick={() => load(next)}
                      >
                        Carregar mais registros
                      </button>
                    ) : null}
                  </>
                )}
                {busy ? (
                  <p className="p-loading" role="status">
                    Carregando com cuidado…
                  </p>
                ) : null}
              </>
            )}
            <p className="p-admin-legacy">
              <Link className="p-inline-link" href="/admin">
                Abrir painel anterior
              </Link>{" "}
              · Funções anteriores preservadas; prefira a moderação sem exclusão
              deste painel.
            </p>
          </>
        )}
      </div>
    </PrayerLayout>
  );
}
