import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import imageCompression from "browser-image-compression";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);

  // 🔒 proteção de rota
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status]);

  // 🔥 carregar avatar do banco
  useEffect(() => {
    if (!session) return;

    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) {
          setAvatar(data.avatar);
        }
      })
      .catch((err) => console.error("Erro ao carregar avatar:", err));
  }, [session]);

  if (status === "loading" || !session) return null;

  // 🚀 upload + compressão
  const handleImage = async (file) => {
    if (!file) return;

    try {
      setUploading(true);

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();
      const imageUrl = data.secure_url;

      // 💾 salvar no banco (ATENÇÃO: users)
      await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      setAvatar(imageUrl);
    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1>Perfil 👤</h1>

      {/* 👤 avatar */}
      <img
        src={
          avatar || `https://ui-avatars.com/api/?name=${session?.user?.name}`
        }
        alt="avatar"
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          objectFit: "cover",
          marginBottom: "20px",
        }}
      />

      {/* 📤 upload */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImage(e.target.files?.[0])}
      />

      {uploading && <p>Enviando...</p>}

      {/* 👤 dados */}
      <p>
        <strong>Nome:</strong> {session.user.name}
      </p>
      <p>
        <strong>Email:</strong> {session.user.email}
      </p>
    </div>
  );
}
