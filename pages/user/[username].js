import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function UserProfile() {
  const router = useRouter();
  const { username } = router.query;

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!username) return;

    fetch(`/api/users/${username}`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [username]);

  if (!user) return <p>Carregando...</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "320px",
        }}
      >
        <img
          src={user.avatar_url}
          width={100}
          style={{
            borderRadius: "50%",
            marginBottom: "15px",
          }}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${user.username}`;
          }}
        />

        <h1 style={{ marginBottom: "10px" }}>{user.username}</h1>

        <p style={{ color: "#666", marginBottom: "15px" }}>
          {user.bio || "Sem bio ainda"}
        </p>
        <button
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#0070f3",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Editar perfil
        </button>

        <p style={{ color: "#999", fontSize: "14px" }}>
          Membro desde: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}
