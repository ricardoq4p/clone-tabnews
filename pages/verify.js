import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { requestJson } from "@/lib/client";
export default function Verify() {
  const router = useRouter();
  const token = router.query.token;
  const [message, setMessage] = useState("Conferindo seu link de confirmação…");
  useEffect(() => {
    if (typeof token !== "string" || !token) return;
    let stopped = false,
      timer;
    const controller = new AbortController();
    requestJson(`/api/verify?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!stopped) {
          setMessage(data.message || "Conta confirmada.");
          timer = setTimeout(() => router.replace("/login"), 2000);
        }
      })
      .catch((error) => {
        if (!stopped && error.name !== "AbortError") setMessage(error.message);
      });
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [token, router]);
  return (
    <AuthLayout>
      <h2 className="mb-5">Confirmação de email</h2>
      <p role="status" className="p-muted">
        {typeof token === "string" && token
          ? message
          : "Abra o link recebido no seu email ou solicite uma nova confirmação."}
      </p>
      <div className="p-form-stack mt-6">
        <Link className="p-button" href="/login">
          Ir para o login
        </Link>
        <Link className="p-inline-link" href="/resend-verification">
          Solicitar outro link
        </Link>
      </div>
    </AuthLayout>
  );
}
