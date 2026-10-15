import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PrayerLayout from "@/components/prayer/Layout";
import Icon from "@/components/prayer/Icon";
import CandleArt from "@/components/prayer/CandleArt";
import CandleCard from "@/components/prayer/CandleCard";
import ChapelScene from "@/components/prayer/ChapelScene";
import styles from "@/styles/Chapel.module.css";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";
export default function Capelinha({ initialView = "public" }) {
  const { data: session, status } = useSession();
  const [view, setView] = useState(initialView),
    [items, setItems] = useState([]),
    [next, setNext] = useState(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [offset, setOffset] = useState(0),
    [clock, setClock] = useState(() => Date.now()),
    [intention, setIntention] = useState(""),
    [visibility, setVisibility] = useState("private"),
    [accepted, setAccepted] = useState(false),
    [creating, setCreating] = useState(false),
    [created, setCreated] = useState(null),
    [formError, setFormError] = useState("");
  const scope = `${view}:${session?.user?.id || "visitor"}`;
  const [loadedScope, setLoadedScope] = useState(null);
  const generation = useRef(0);
  const load = useCallback(
    async (cursor) => {
      const gen = ++generation.current;
      if (view === "history" && !session) {
        return;
      }
      return requestJson(
        `/api/velas${view === "history" ? "/minhas" : ""}${cursor ? `?before=${cursor}` : ""}`,
      )
        .then((result) => {
          if (gen !== generation.current) return;
          setError("");
          setLoadedScope(scope);
          setOffset(new Date(result.serverNow).getTime() - Date.now());
          setClock(Date.now());
          setItems((old) =>
            cursor
              ? [
                  ...old,
                  ...result.items.filter(
                    (item) => !old.some((current) => current._id === item._id),
                  ),
                ]
              : result.items,
          );
          setNext(result.next);
        })
        .catch((err) => {
          if (gen === generation.current) {
            setLoadedScope(scope);
            setError(err.message);
            if (!cursor) setItems([]);
          }
        })
        .finally(() => {
          if (gen === generation.current) setBusy(false);
        });
    },
    [view, session, scope],
  );
  useEffect(() => {
    if (status !== "loading") {
      load();
    }
  }, [load, status]);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const now = clock + offset;
  useEffect(() => {
    const expiry = Math.min(
      ...items
        .filter((item) => new Date(item.expiresAt).getTime() > now)
        .map((item) => new Date(item.expiresAt).getTime()),
    );
    if (!Number.isFinite(expiry)) return;
    const timer = setTimeout(
      () => setClock(Date.now()),
      Math.min(2147483647, Math.max(1, expiry - now)),
    );
    return () => clearTimeout(timer);
  }, [items, now]);
  useEffect(() => {
    function refresh() {
      setClock(Date.now());
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [load]);
  async function light(event) {
    event.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const result = await requestJson(
        "/api/velas",
        jsonRequest("POST", {
          intention,
          visibility,
          privacyAccepted: accepted,
          accountId: session.user.id,
        }),
      );
      setOffset(new Date(result.serverNow).getTime() - Date.now());
      setClock(Date.now());
      setCreated(result.candle);
      setIntention("");
      setAccepted(false);
      await load();
      if (result.candle.visibility === "private") setView("history");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  }
  const visible =
    loadedScope !== scope
      ? []
      : view === "public"
        ? items.filter(
            (item) =>
              new Date(item.expiresAt).getTime() > now &&
              (!item.status || item.status === "active") &&
              item.visibility !== "private",
          )
        : items;
  const updateCandle = (updated) =>
    setItems((old) =>
      old.map((current) => (current._id === updated._id ? updated : current)),
    );
  return (
    <PrayerLayout title="Capelinha Virtual">
      <div className={styles.page}>
        <div className="p-container">
          <div className="p-page-head">
            <div className="p-breadcrumb">
              <Link href="/">Início</Link>
              <span>/</span>Capelinha Virtual
            </div>
            <p className="p-eyebrow">ENTREGAR, CONFIAR, REZAR</p>
            <h1>
              Uma pequena luz.
              <br />
              <em>Uma grande esperança.</em>
            </h1>
            <p>
              Apresente a Deus o que habita seu coração. Cada vela permanece
              simbolicamente acesa por sete dias, acompanhando sua intenção em
              oração.
            </p>
          </div>
        </div>
        <div className={`p-container ${styles.viewControls}`}>
          <div
            className="p-tabs"
            role="group"
            aria-label="Intenções da Capelinha"
          >
            <button
              aria-pressed={view === "public"}
              onClick={() => {
                if (view === "public") load();
                else setView("public");
              }}
            >
              Intenções da comunidade
            </button>
            <button
              aria-pressed={view === "history"}
              onClick={() => {
                if (view === "history") load();
                else setView("history");
              }}
            >
              Minhas velas
            </button>
          </div>
        </div>
        <ChapelScene
          key={scope}
          candles={visible}
          now={now}
          history={view === "history"}
          onUpdate={updateCandle}
          onRefresh={() => load()}
          loading={
            busy || (loadedScope !== scope && !(view === "history" && !session))
          }
        />
        <div className="p-container">
          <div className="p-chapel-layout">
            <section className="p-chapel-intentions">
              <div
                role="region"
                aria-label={
                  view === "public"
                    ? "Intenções públicas"
                    : "Seu histórico de velas"
                }
              >
                {view === "history" && !session && status !== "loading" ? (
                  <div className="p-empty">
                    <Icon name="lock" size={28} />
                    <h2>Seu espaço de oração.</h2>
                    <p>
                      Entre para ver suas velas, inclusive as privadas e as que
                      já completaram sete dias.
                    </p>
                    <Link href="/login" className="p-button">
                      Entrar na minha conta
                    </Link>
                  </div>
                ) : (
                  <>
                    {error ? (
                      <div className="p-notice" role="status">
                        <p>{error}</p>
                        <button
                          className="p-inline-button"
                          onClick={() => load()}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : null}
                    {(busy || loadedScope !== scope) && !visible.length ? (
                      <p className="p-loading" role="status">
                        Preparando a Capelinha…
                      </p>
                    ) : !error && !visible.length ? (
                      <div className="p-empty">
                        <CandleArt small lit={false} />
                        <h2>
                          {view === "history"
                            ? "Sua primeira intenção começa aqui."
                            : "Há lugar para a sua intenção."}
                        </h2>
                        <p>
                          {view === "history"
                            ? "As velas que você acender ficarão neste espaço, respeitando a privacidade escolhida."
                            : "A Capelinha está em silêncio. Se desejar, apresente sua intenção e acenda a primeira vela."}
                        </p>
                      </div>
                    ) : null}
                    <div className="p-candle-grid">
                      {visible.map((item) => (
                        <CandleCard
                          key={item._id}
                          candle={item}
                          now={now}
                          history={view === "history"}
                          onUpdate={(updated) =>
                            setItems((old) =>
                              old.map((current) =>
                                current._id === updated._id ? updated : current,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                    {next ? (
                      <div className="p-load">
                        <button
                          className="p-button p-button-outline"
                          disabled={busy}
                          onClick={() => load(next)}
                        >
                          Ver mais intenções
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </section>
            <aside className="p-chapel-offering">
              <div className="p-panel p-light-form">
                {created ? (
                  <div className="p-light-success" role="status">
                    <CandleArt />
                    <p className="p-eyebrow">SUA VELA ESTÁ ACESA</p>
                    <h2>
                      Uma intenção entregue.
                      <br />
                      Um coração em oração.
                    </h2>
                    <p>
                      {created.visibility === "private"
                        ? "Sua intenção está no seu espaço privado."
                        : created.visibility === "anonymous"
                          ? "Sua intenção foi publicada sem identificar você."
                          : "Sua intenção foi partilhada com a comunidade."}
                    </p>
                    <p>
                      Ela permanecerá acesa até{" "}
                      {formatPrayerDate(created.expiresAt, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      , em Brasília.
                    </p>
                    <button
                      className="p-button"
                      onClick={() => {
                        setView("history");
                        setCreated(null);
                      }}
                    >
                      Ver minhas velas
                    </button>
                    <button
                      className="p-inline-button"
                      onClick={() => setCreated(null)}
                    >
                      Apresentar outra intenção
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-offering-heading">
                      <Icon name="candle" size={26} />
                      <p className="p-eyebrow">UM GESTO DE CONFIANÇA</p>
                      <h2>Acenda sua vela.</h2>
                      <p>Deus conhece o que você traz no coração.</p>
                    </div>
                    {session ? (
                      <form className="p-form-stack" onSubmit={light}>
                        <div className="p-field">
                          <label htmlFor="candle-intention">Sua intenção</label>
                          <textarea
                            id="candle-intention"
                            aria-describedby="candle-intention-help"
                            required
                            maxLength={1200}
                            value={intention}
                            onChange={(e) => setIntention(e.target.value)}
                            placeholder="Pela minha família, por uma graça, em agradecimento…"
                          />
                          <small id="candle-intention-help">
                            {intention.length}/1.200 · Evite nomes completos e
                            informações de saúde que identifiquem outras
                            pessoas.
                          </small>
                        </div>
                        <fieldset className="p-visibility">
                          <legend>Quem pode ver?</legend>
                          {[
                            {
                              value: "private",
                              title: "Privada",
                              detail: "No seu histórico pessoal",
                              icon: "lock",
                            },
                            {
                              value: "anonymous",
                              title: "Anônima",
                              detail: "Texto público, seu nome oculto",
                              icon: "leaf",
                            },
                            {
                              value: "public",
                              title: "Pública",
                              detail: "Texto e seu nome para a comunidade",
                              icon: "people",
                            },
                          ].map((option) => (
                            <label key={option.value}>
                              <input
                                type="radio"
                                name="visibility"
                                value={option.value}
                                checked={visibility === option.value}
                                onChange={() => setVisibility(option.value)}
                              />
                              <Icon name={option.icon} size={17} />
                              <span>
                                <strong>{option.title}</strong>
                                <small>{option.detail}</small>
                              </span>
                            </label>
                          ))}
                        </fieldset>
                        <label className="p-check">
                          <input
                            type="checkbox"
                            required
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                          />
                          <span>
                            Autorizo o PanteraLab a guardar minha intenção e
                            exibi-la conforme a visibilidade escolhida,
                            inclusive as informações religiosas que eu decidir
                            compartilhar. Li as{" "}
                            <Link href="/privacidade" className="p-inline-link">
                              informações de privacidade
                            </Link>{" "}
                            e compreendo a visibilidade escolhida. Intenções
                            privadas podem ser acessadas excepcionalmente pela
                            administração, com registro.
                          </span>
                        </label>
                        <button
                          className="p-button"
                          disabled={creating || !intention.trim() || !accepted}
                        >
                          <Icon name="candle" />
                          {creating
                            ? "Acendendo sua vela…"
                            : "Acender vela por 7 dias"}
                        </button>
                        {formError ? (
                          <p className="p-error" role="alert">
                            {formError}
                          </p>
                        ) : null}
                      </form>
                    ) : (
                      <div className="p-offering-login">
                        <Icon name="candle" size={32} />
                        <p>
                          Entre para acender sua vela, escolher a privacidade e
                          guardar seu histórico.
                        </p>
                        <Link className="p-button" href="/login">
                          Entrar e apresentar intenção
                          <Icon name="arrow" size={16} />
                        </Link>
                        <Link className="p-inline-link" href="/register">
                          Ainda não tenho conta
                        </Link>
                      </div>
                    )}
                  </>
                )}
                <div className="p-symbolic-note">
                  <Icon name="cross" size={15} />
                  <p>
                    A vela é um gesto simbólico de oração. Não substitui a
                    oração pessoal, a Santa Missa ou os sacramentos. Não há
                    cobrança para acendê-la.
                  </p>
                </div>
              </div>
              <div className="p-chapel-meditation">
                <Icon name="leaf" size={20} />
                <p>
                  Antes de acender uma luz,
                  <br />
                  <em>permaneça um instante em oração.</em>
                </p>
                <Link href="/rosario">
                  Rezar o Santo Rosário
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PrayerLayout>
  );
}
