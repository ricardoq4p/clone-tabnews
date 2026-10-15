import { useState } from "react";
import { useSession } from "next-auth/react";
import { requestJson, jsonRequest } from "@/lib/client";
export default function ReportButton({ targetType, targetId }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState("privacy"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (!session) return null;
  return (
    <div className="p-report">
      <button
        type="button"
        className="p-report-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "Fechar relato" : "Sinalizar à moderação"}
      </button>
      {open ? (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              const result = await requestJson(
                "/api/denuncias",
                jsonRequest("POST", { targetType, targetId, reason }),
              );
              setMessage(result.message);
            } catch (error) {
              setMessage(error.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Motivo
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="privacy">Exposição de dados pessoais</option>
              <option value="disrespect">Conteúdo desrespeitoso</option>
              <option value="spam">Spam ou uso indevido</option>
              <option value="other">Outro motivo</option>
            </select>
          </label>
          <button disabled={busy} className="p-pray-button">
            {busy ? "Enviando…" : "Enviar relato"}
          </button>
          <p role="status">{message}</p>
        </form>
      ) : null}
    </div>
  );
}
