import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Upload de Avatar</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <br />
      <br />

      <button onClick={handleUpload}>Enviar</button>

      <p>{message}</p>
    </div>
  );
}
