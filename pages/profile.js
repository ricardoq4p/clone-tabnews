import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import imageCompression from "browser-image-compression";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [session, status]);

  if (!session) return null;

  const handleImage = async (file) => {
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

      await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      setAvatar(imageUrl);
    } catch (err) {
      console.error(err);
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

      <img
        src={avatar || "https://via.placeholder.com/120"}
        alt="avatar"
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          objectFit: "cover",
          marginBottom: "20px",
        }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImage(e.target.files[0])}
      />

      {uploading && <p>Enviando...</p>}

      <p>
        <strong>Nome:</strong> {session.user.name}
      </p>
      <p>
        <strong>Email:</strong> {session.user.email}
      </p>
    </div>
  );
}
