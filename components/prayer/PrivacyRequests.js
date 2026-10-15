import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { requestJson, jsonRequest, formatPrayerDate } from "@/lib/client";
export default function PrivacyRequests() {
  const { data: session } = useSession();
  const [kind, setKind] = useState("export"),
    [details, setDetails] = useState(""),
    [items, setItems] = useState([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (session)
      requestJson("/api/conta/solicitacoes")
        .then((data) => setItems(data.items))
        .catch(() => {});
  }, [session]);
  if (!session)
    return (
      <p>
        <Link href="/login">Entre na sua conta</Link> para registrar uma
        solicitação sobre seus dados.
      </p>
    );
  return (
    <div className="p-panel">
      <form
        className="p-form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            const result = await requestJson(
              "/api/conta/solicitacoes",
              jsonRequest("POST", {
                kind,
                details,
                accountId: session.user.id,
              }),
            );
            setMessage(result.message);
            setDetails("");
            const history = await requestJson("/api/conta/solicitacoes");
            setItems(history.items);
          } catch (error) {
            setMessage(error.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="p-field">
          Como podemos ajudar?
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="export">Quero acessar ou receber meus dados</option>
            <option value="correction">Quero corrigir meus dados</option>
            <option value="exclusion">
              Quero solicitar exclusão dos meus dados
            </option>
          </select>
        </label>
        <label className="p-field">
          Informações adicionais (opcional)
          <textarea
            maxLength={500}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Descreva o pedido sem incluir senhas ou informações sensíveis desnecessárias."
          />
        </label>
        <button className="p-button" disabled={busy}>
          {busy ? "Registrando…" : "Registrar solicitação"}
        </button>
        {message ? (
          <p className="p-notice" role="status">
            {message}
          </p>
        ) : null}
      </form>
      {items.length ? (
        <div className="p-request-history">
          <h3>Suas solicitações recentes</h3>
          <ul>
            {items.map((item) => (
              <li key={item._id}>
                {
                  {
                    export: "Acesso aos dados",
                    exclusion: "Exclusão de dados",
                    correction: "Correção de dados",
                  }[item.kind]
                }{" "}
                · {formatPrayerDate(item.createdAt)} ·{" "}
                {item.status === "pending"
                  ? "Em análise"
                  : "Atendimento registrado"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
