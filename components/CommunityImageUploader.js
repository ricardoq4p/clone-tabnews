import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import Icon from "./prayer/Icon";
import { uploadsEnabled } from "@/lib/integration-policy";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function testImageDecodable(objectUrl) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.Image) return resolve(true);
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = objectUrl;
  });
}

export default function CommunityImageUploader({
  value = "",
  onChange,
  disabled = false,
  label = "Imagem da comunidade",
  id = "community-image-uploader",
}) {
  const [localPreview, setLocalPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const activeBlobUrlRef = useRef("");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const canUploadToCloud = Boolean(uploadsEnabled && cloudName && uploadPreset);

  // Limpa o blob URL quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  const handleButtonClick = () => {
    if (disabled || uploading) return;
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reseta o input para permitir selecionar o mesmo arquivo se desejado
    event.target.value = "";
    setError("");
    setUploadSuccess(false);

    // 1. Validação de tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Formato não suportado. Escolha uma imagem JPG, PNG ou WebP.");
      return;
    }

    // 2. Validação de tamanho
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    // 3. Validação de decodificação e criação de prévia local imediata
    let objectUrl = "";
    try {
      objectUrl = URL.createObjectURL(file);
      const isDecodable = await testImageDecodable(objectUrl);
      if (!isDecodable) {
        URL.revokeObjectURL(objectUrl);
        setError("Arquivo de imagem corrompido ou inválido.");
        return;
      }
    } catch {
      // Fallback gracioso se createObjectURL falhar
    }

    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
    }
    activeBlobUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    // 4. Verificação de suporte a upload na infraestrutura
    if (!canUploadToCloud) {
      setError("O envio de imagens está indisponível neste ambiente.");
      return;
    }

    // 5. Compressão e envio para Cloudinary
    try {
      setUploading(true);
      setError("");

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.08,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.secure_url) {
        throw new Error(
          data?.error?.message ||
            "Não foi possível enviar a imagem da comunidade.",
        );
      }

      setUploadSuccess(true);
      if (typeof onChange === "function") {
        onChange(data.secure_url);
      }
    } catch (err) {
      setError(err.message || "Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = "";
    }
    setLocalPreview("");
    setFileName("");
    setFileSize("");
    setError("");
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (typeof onChange === "function") {
      onChange("");
    }
  };

  const currentDisplayUrl = localPreview || value;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-300 font-mono flex items-center gap-2"
        >
          <Icon name="image" size={16} />
          <span>{label}</span>
        </label>
        {fileSize && (
          <span className="text-xs text-slate-400 font-mono">{fileSize}</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {currentDisplayUrl ? (
        <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-cyan-300/30 bg-slate-900">
            <Image
              unoptimized
              src={currentDisplayUrl}
              alt="Prévia da comunidade"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {fileName ? (
              <p
                className="text-xs font-mono text-slate-200 truncate"
                title={fileName}
              >
                {fileName}
              </p>
            ) : (
              <p className="text-xs font-mono text-slate-400">
                Imagem selecionada
              </p>
            )}

            {uploading ? (
              <p
                role="status"
                aria-live="polite"
                className="text-xs font-mono text-amber-300 flex items-center gap-1.5"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Otimizando e enviando...
              </p>
            ) : uploadSuccess ? (
              <p
                role="status"
                aria-live="polite"
                className="text-xs font-mono text-emerald-400 flex items-center gap-1"
              >
                <Icon name="check" size={14} /> Imagem pronta
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={disabled || uploading}
                className="p-button p-button-outline text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Substituir imagem da comunidade"
              >
                <Icon name="upload" size={13} />
                <span>Substituir</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="p-button p-button-outline text-xs px-3 py-1.5 text-red-300 hover:text-red-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Remover imagem da comunidade"
              >
                <Icon name="close" size={13} />
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={disabled || uploading}
              className="p-button p-button-outline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Escolher arquivo de imagem para a comunidade"
            >
              <Icon name="upload" size={16} />
              <span>Escolher arquivo</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Nenhum arquivo selecionado
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Formatos aceitos: JPG, PNG ou WebP (máx. 5 MB).
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="p-error text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
