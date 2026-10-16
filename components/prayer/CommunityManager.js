import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";

export default function CommunityManager() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedId = selected?._id;
  const generation = useRef(0),
    pending = useRef(false),
    dialog = useRef(null);
  const load = useCallback(async () => {
    const gen = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const result = await requestJson(
        `/api/admin/comunidades?${new URLSearchParams({ q, privacy, sort, page: String(page) })}`,
      );
      if (gen !== generation.current) return;
      if (page > result.pages) {
        setPage(result.pages);
        return;
      }
      setData(result);
    } catch (err) {
      if (gen === generation.current) {
        setError(err.message);
        setData(null);
      }
    } finally {
      if (gen === generation.current) setLoading(false);
    }
  }, [q, privacy, sort, page]);
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => {
      clearTimeout(timer);
      generation.current += 1;
    };
  }, [load]);
  useEffect(() => {
    if (selectedId) dialog.current?.showModal();
  }, [selectedId]);
  function close() {
    if (pending.current) return;
    dialog.current?.close();
    setSelected(null);
  }
  async function uploadImage(file) {
    if (!file || pending.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Escolha uma imagem JPG, PNG ou WebP.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.08,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      );
      const result = await requestJson(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!result.secure_url)
        throw new Error("Não foi possível enviar a imagem.");
      setSelected((current) => ({ ...current, avatar: result.secure_url }));
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestJson(
        `/api/communities/${selected._id}`,
        mode === "delete"
          ? { method: "DELETE" }
          : jsonRequest("PATCH", {
              name: selected.name,
              description: selected.description,
              privacy: selected.privacy,
              avatar: selected.avatar,
            }),
      );
      pending.current = false;
      close();
      setNotice(
        mode === "delete"
          ? "Comunidade excluída. Os registros relacionados foram preservados."
          : "Comunidade atualizada.",
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section aria-label="Gerenciar comunidades" aria-busy={loading}>
      <div className="p-admin-stat-grid">
        {[
          ["Total de comunidades", data?.total],
          ["Públicas", data?.publicCount],
          ["Privadas", data?.privateCount],
        ].map(([label, value]) => (
          <div className="p-panel" key={label}>
            <strong>{value ?? "—"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="p-community-filters p-panel">
        <label className="p-field">
          Pesquisar por nome
          <input
            type="search"
            maxLength={60}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="p-field">
          Privacidade
          <select
            value={privacy}
            onChange={(e) => {
              setPrivacy(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas</option>
            <option value="public">Pública</option>
            <option value="private">Privada</option>
          </select>
        </label>
        <label className="p-field">
          Ordenar
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="name">Nome</option>
          </select>
        </label>
      </div>
      {notice && (
        <p className="p-notice" role="status">
          {notice}
        </p>
      )}
      {error && !selected && (
        <p className="p-error" role="alert">
          {error}{" "}
          <button className="p-button" onClick={load}>
            Tentar novamente
          </button>
        </p>
      )}
      {loading ? (
        <p className="p-loading" role="status">
          Carregando comunidades…
        </p>
      ) : (
        data && (
          <>
            <p>{data.filtered} comunidade(s) encontrada(s)</p>
            {!data.items.length && (
              <p className="p-empty">Nenhuma comunidade encontrada.</p>
            )}
            <div className="p-community-list">
              {data.items.map((item) => (
                <article className="p-panel p-community-card" key={item._id}>
                  {item.avatar ? (
                    <Image
                      unoptimized
                      src={item.avatar}
                      alt=""
                      width={56}
                      height={56}
                    />
                  ) : (
                    <span className="p-community-avatar" aria-hidden="true">
                      {item.name.slice(0, 1)}
                    </span>
                  )}
                  <div className="p-community-details">
                    <h2>{item.name}</h2>
                    <p>{item.description || "Sem descrição."}</p>
                    <p>
                      Criador: {item.ownerName} · {item.membersCount} membro(s)
                    </p>
                    <p>
                      {item.privacy === "private" ? "Privada" : "Pública"} ·
                      Criada em{" "}
                      {item.createdAt
                        ? formatPrayerDate(item.createdAt, { year: "numeric" })
                        : "data indisponível"}
                    </p>
                  </div>
                  <div className="p-community-actions">
                    <a
                      className="p-button p-button-secondary"
                      href={`/comunidades/${item._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visualizar<span className="sr-only"> (nova aba)</span>
                    </a>
                    <button
                      className="p-button p-button-secondary"
                      onClick={() => {
                        setError("");
                        setMode("edit");
                        setSelected({ ...item });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="p-button p-community-danger"
                      onClick={() => {
                        setError("");
                        setMode("delete");
                        setSelected({ ...item });
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <nav
              className="p-community-actions"
              aria-label="Paginação de comunidades"
            >
              <button
                className="p-button p-button-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span>
                Página {page} de {data.pages}
              </span>
              <button
                className="p-button p-button-secondary"
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </button>
            </nav>
            <p className="p-notice">
              A visualização respeita as permissões atuais: comunidades privadas
              exigem participação. A administração permanece aberta nesta aba.
            </p>
          </>
        )
      )}
      <dialog
        className="p-community-dialog"
        ref={dialog}
        aria-labelledby="community-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          if (!pending.current) setSelected(null);
        }}
      >
        {selected && (
          <form onSubmit={submit}>
            <h2 id="community-dialog-title">
              {mode === "delete" ? "Excluir comunidade" : "Editar comunidade"}
            </h2>
            {mode === "delete" ? (
              <>
                <p>
                  Confirmar a exclusão de <strong>{selected.name}</strong>?
                </p>
                <p>
                  A comunidade ficará indisponível e sairá das listagens. As
                  publicações e seus comentários ficarão inacessíveis pelos
                  fluxos da comunidade. Comunidade, vínculos de membros,
                  publicações e comentários serão preservados no banco; nenhum
                  usuário será apagado. Não há restauração pelo painel.
                </p>
              </>
            ) : (
              <>
                <label className="p-field">
                  Nome
                  <input
                    autoFocus
                    required
                    maxLength={60}
                    value={selected.name}
                    disabled={busy}
                    onChange={(e) =>
                      setSelected({ ...selected, name: e.target.value })
                    }
                  />
                </label>
                <label className="p-field">
                  Descrição
                  <textarea
                    maxLength={220}
                    value={selected.description}
                    disabled={busy}
                    onChange={(e) =>
                      setSelected({ ...selected, description: e.target.value })
                    }
                  />
                </label>
                <label className="p-field">
                  Imagem da comunidade
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={
                      busy ||
                      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
                      !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                    }
                    onChange={(e) => uploadImage(e.target.files?.[0])}
                  />
                  <small>
                    JPG, PNG ou WebP. A imagem atual é mantida se você não
                    escolher outra.
                  </small>
                  {(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
                    !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) && (
                    <small>
                      O envio de imagens está indisponível neste ambiente.
                    </small>
                  )}
                </label>
                {selected.avatar && (
                  <>
                    <Image
                      unoptimized
                      src={selected.avatar}
                      alt="Imagem atual da comunidade"
                      width={80}
                      height={80}
                    />
                    <button
                      type="button"
                      className="p-button p-button-secondary"
                      disabled={busy}
                      onClick={() => setSelected({ ...selected, avatar: "" })}
                    >
                      Remover imagem
                    </button>
                  </>
                )}
                <label className="p-field">
                  Privacidade
                  <select
                    value={selected.privacy}
                    disabled={busy}
                    onChange={(e) =>
                      setSelected({ ...selected, privacy: e.target.value })
                    }
                  >
                    <option value="public">Pública</option>
                    <option value="private">Privada</option>
                  </select>
                </label>
              </>
            )}
            {error && (
              <p className="p-error" role="alert">
                {error}
              </p>
            )}
            <div className="p-community-actions">
              <button
                type="button"
                autoFocus={mode === "delete"}
                className="p-button p-button-secondary"
                disabled={busy}
                onClick={close}
              >
                Cancelar
              </button>
              <button
                className={`p-button ${mode === "delete" ? "p-community-danger" : ""}`}
                disabled={busy}
              >
                {busy
                  ? "Processando…"
                  : mode === "delete"
                    ? "Confirmar exclusão"
                    : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  );
}
