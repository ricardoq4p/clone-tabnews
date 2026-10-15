import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { requestJson, jsonRequest } from "@/lib/client";
import Icon from "./Icon";
export default function PrayerButton({
  endpoint,
  initialCount = 0,
  initialPrayed = false,
}) {
  const { data: session } = useSession();
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const prayed = result?.prayed || initialPrayed,
    count = result?.supportCount ?? initialCount;
  async function pray() {
    setBusy(true);
    setError("");
    try {
      setResult(
        await requestJson(
          endpoint,
          jsonRequest("PUT", { accountId: session.user.id }),
        ),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="p-intercession">
      {session ? (
        <button
          className={`p-pray-button ${prayed ? "is-prayed" : ""}`}
          disabled={busy || prayed}
          onClick={pray}
        >
          <Icon name={prayed ? "check" : "heart"} size={16} />
          {busy
            ? "Registrando…"
            : prayed
              ? "Você rezou por esta intenção"
              : "Rezei por esta intenção"}
        </button>
      ) : (
        <Link className="p-pray-button" href="/login">
          <Icon name="heart" size={16} />
          Entre para registrar sua oração
        </Link>
      )}
      <span>
        {count === 1
          ? "1 pessoa unida em oração"
          : `${count} pessoas unidas em oração`}
      </span>
      {error ? (
        <p className="p-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
