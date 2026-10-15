import { useEffect, useState } from "react";
import { requestJson, jsonRequest } from "@/lib/client";
export default function RosaryEditor() {
  const [content, setContent] = useState(null),
    [note, setNote] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [edition, setEdition] = useState("gozosos");
  useEffect(() => {
    requestJson("/api/admin/rosario")
      .then((result) => setContent(result.content))
      .catch((error) => setMessage(error.message));
  }, []);
  function prayer(id, key, value) {
    setContent((old) => ({
      ...old,
      prayers: { ...old.prayers, [id]: { ...old.prayers[id], [key]: value } },
    }));
  }
  function mystery(id, key, value) {
    setContent((old) => ({
      ...old,
      sets: old.sets.map((set) => ({
        ...set,
        mysteries: set.mysteries.map((item) =>
          item.id === id ? { ...item, [key]: value } : item,
        ),
      })),
    }));
  }
  if (!content)
    return (
      <p className="p-notice" role="status">
        {message || "Carregando edição atual…"}
      </p>
    );
  return (
    <form
      className="p-form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const result = await requestJson(
            "/api/admin/rosario",
            jsonRequest("POST", {
              content,
              expectedVersion: content.version,
              note,
              reviewed,
            }),
          );
          setContent(result.content);
          setMessage(result.message);
          setReviewed(false);
          setNote("");
        } catch (error) {
          setMessage(error.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="p-notice">
        Editar cria uma nova edição. Quem já está rezando mantém o roteiro
        anterior. Revise fidelidade doutrinal, referências e direitos das
        imagens antes de publicar.
      </div>
      <details className="p-editor-section">
        <summary>Orações tradicionais</summary>
        <div className="p-form-stack">
          {Object.entries(content.prayers).map(([id, item]) => (
            <label className="p-field" key={id}>
              {item.title}
              <textarea
                maxLength={2500}
                value={item.text}
                onChange={(event) => prayer(id, "text", event.target.value)}
                required
              />
            </label>
          ))}
        </div>
      </details>
      <label className="p-field">
        Conjunto para editar
        <select
          value={edition}
          onChange={(event) => setEdition(event.target.value)}
        >
          {content.sets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.title}
            </option>
          ))}
        </select>
      </label>
      {content.sets
        .find((set) => set.id === edition)
        .mysteries.map((item, index) => (
          <details key={item.id} className="p-editor-section">
            <summary>
              {index + 1}. {item.title}
            </summary>
            <div className="p-form-stack">
              <label className="p-field">
                Título
                <input
                  maxLength={180}
                  value={item.title}
                  onChange={(event) =>
                    mystery(item.id, "title", event.target.value)
                  }
                  required
                />
              </label>
              <label className="p-field">
                Referência bíblica
                <input
                  maxLength={120}
                  value={item.scripture}
                  onChange={(event) =>
                    mystery(item.id, "scripture", event.target.value)
                  }
                  required
                />
              </label>
              <label className="p-field">
                Meditação
                <textarea
                  maxLength={1500}
                  value={item.meditation}
                  onChange={(event) =>
                    mystery(item.id, "meditation", event.target.value)
                  }
                  required
                />
              </label>
              <label className="p-field">
                Imagem
                <input
                  maxLength={2048}
                  value={item.image}
                  onChange={(event) =>
                    mystery(item.id, "image", event.target.value)
                  }
                  required
                />
                <small>
                  Use a ilustração local existente ou uma imagem do Cloudinary
                  configurado, com direito de uso.
                </small>
              </label>
              <label className="p-field">
                Descrição acessível
                <input
                  maxLength={250}
                  value={item.imageAlt}
                  onChange={(event) =>
                    mystery(item.id, "imageAlt", event.target.value)
                  }
                  required
                />
              </label>
              <label className="p-field">
                Créditos e licença
                <input
                  maxLength={250}
                  value={item.credit}
                  onChange={(event) =>
                    mystery(item.id, "credit", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </details>
        ))}
      <label className="p-field">
        Motivo desta edição
        <textarea
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          required
        />
      </label>
      <label className="p-check">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(event) => setReviewed(event.target.checked)}
          required
        />
        Revisei o conteúdo religioso, a acessibilidade e os direitos de uso das
        imagens.
      </label>
      <button className="p-button" disabled={busy || !reviewed}>
        {busy ? "Publicando edição…" : "Publicar nova edição"}
      </button>
      {message ? (
        <p role="status" className="p-notice">
          {message}
        </p>
      ) : null}
    </form>
  );
}
