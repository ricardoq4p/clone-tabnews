import { useState } from "react";
export default function LoadMoreButton({ items, endpoint, onLoad }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastPage, setLastPage] = useState(null);
  if (
    !items.length ||
    (items.length < 50 && lastPage === null) ||
    lastPage === items.at(-1)._id
  )
    return null;
  async function load() {
    setBusy(true);
    setError("");
    try {
      const before = items.at(-1)._id;
      const response = await fetch(
        `${endpoint}${endpoint.includes("?") ? "&" : "?"}before=${before}`,
      );
      if (!response.ok)
        throw new Error("Nao foi possivel carregar mais itens.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Resposta invalida.");
      onLoad(data);
      if (data.length < 50) setLastPage(data.at(-1)?._id || before);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4">
      <button onClick={load} disabled={busy} className="secondary-button">
        {busy ? "Carregando..." : "Carregar mais"}
      </button>
      <p role="status">{error}</p>
    </div>
  );
}
