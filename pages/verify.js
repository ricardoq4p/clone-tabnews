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
      });
  }, [token]);

  return <h1>{message}</h1>;
}
