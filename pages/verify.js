import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Verify() {
  const router = useRouter();
  const { token } = router.query;
  const [message, setMessage] = useState("Verificando...");

  useEffect(() => {
    if (!token) return;

    fetch(`/api/verify?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);

        // 👉 redireciona após sucesso
        if (data.message.includes("sucesso")) {
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      })
      .catch(() => {
        setMessage("Erro ao verificar. Tente novamente.");
      });
  }, [token]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>{message}</h1>
    </div>
  );
}
