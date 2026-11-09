import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import Icon from "./prayer/Icon";
import { uploadsEnabled } from "@/lib/integration-policy";
import {
  ALLOWED_BLOG_COVER_MIME_TYPES,
  DEFAULT_BLOG_COVER_IMAGE,
  MAX_BLOG_COVER_FILE_SIZE_BYTES,
  RECOMMENDED_BLOG_COVER_HEIGHT,
  RECOMMENDED_BLOG_COVER_WIDTH,
  hasValidImageMagicBytes,
  validateBlogCoverDimensions,
} from "@/lib/blogs";

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readFileHeaderBytes(file) {
  try {
    const slice = typeof file.slice === "function" ? file.slice(0, 16) : file;
    if (slice && typeof slice.arrayBuffer === "function") {
      const buffer = await slice.arrayBuffer();
      return new Uint8Array(buffer);
    }
    if (typeof FileReader !== "undefined") {
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(
            reader.result instanceof ArrayBuffer
              ? new Uint8Array(reader.result)
              : null,
          );
        };
        reader.onerror = () => resolve(null);
        reader.readAsArrayBuffer(slice);
      });
    }
  } catch {
    return null;
  }
  return null;
}

function measureImageDimensions(objectUrl) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.Image) {
      return resolve({
        decodable: true,
        width: RECOMMENDED_BLOG_COVER_WIDTH,
        height: RECOMMENDED_BLOG_COVER_HEIGHT,
      });
    }
    const img = new window.Image();
    img.onload = () =>
      resolve({
        decodable: true,
        width: img.naturalWidth || img.width || RECOMMENDED_BLOG_COVER_WIDTH,
        height:
          img.naturalHeight || img.height || RECOMMENDED_BLOG_COVER_HEIGHT,
      });
    img.onerror = () =>
      resolve({
        decodable: false,
        width: 0,
        height: 0,
      });
    img.src = objectUrl;
  });
}

export default function BlogCoverUploader({
  value = "",
  onChange,
  disabled = false,
  label = "Imagem de capa do blog",
  id = "blog-cover-uploader",
  helperText = `Proporção horizontal recomendada de aproximadamente ${RECOMMENDED_BLOG_COVER_WIDTH} × ${RECOMMENDED_BLOG_COVER_HEIGHT} pixels (JPG, PNG ou WebP, máx. 5 MB).`,
}) {
  const [localPreview, setLocalPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [dimensionsLabel, setDimensionsLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const activeBlobUrlRef = useRef("");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const canUploadToCloud = Boolean(uploadsEnabled && cloudName && uploadPreset);

  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  const handleTriggerFileSelect = () => {
    if (disabled || uploading) return;
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";
    setError("");
    setUploadSuccess(false);

    // 1. Validação do tipo MIME permitido
    if (!ALLOWED_BLOG_COVER_MIME_TYPES.includes(file.type)) {
      setError("Formato não permitido. Envie uma imagem JPG, PNG ou WebP.");
      return;
    }

    // 2. Validação do tamanho máximo (5 MB)
    if (file.size > MAX_BLOG_COVER_FILE_SIZE_BYTES) {
      setError("A imagem de capa deve ter no máximo 5 MB.");
      return;
    }

    // 3. Validação do conteúdo real do arquivo (magic bytes)
    const headerBytes = await readFileHeaderBytes(file);
    if (
      headerBytes &&
      headerBytes.length >= 12 &&
      !hasValidImageMagicBytes(headerBytes, file.type)
    ) {
      setError(
        "O conteúdo real do arquivo não corresponde a uma imagem JPG, PNG ou WebP válida.",
      );
      return;
    }

    // 4. Decodificação e validação de dimensões e proporção horizontal
    let objectUrl = "";
    try {
      if (
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
      ) {
        objectUrl = URL.createObjectURL(file);
        const measured = await measureImageDimensions(objectUrl);
        if (!measured.decodable) {
          URL.revokeObjectURL(objectUrl);
          setError("Arquivo de imagem corrompido ou ilegível.");
          return;
        }
        const dimValidation = validateBlogCoverDimensions(
          measured.width,
          measured.height,
        );
        if (!dimValidation.ok) {
          URL.revokeObjectURL(objectUrl);
          setError(dimValidation.error);
          return;
        }
        setDimensionsLabel(`${measured.width} × ${measured.height} px`);
      }
    } catch {
      /* fallback gracioso em ambientes de teste sem URL.createObjectURL */
    }

    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
    }
    activeBlobUrlRef.current = objectUrl;
    setLocalPreview(objectUrl);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    if (!canUploadToCloud) {
      setError("O envio de imagens está indisponível neste ambiente.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.45,
        maxWidthOrHeight: RECOMMENDED_BLOG_COVER_WIDTH,
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
          data?.error?.message || "Não foi possível enviar a imagem de capa.",
        );
      }

      setUploadSuccess(true);
      if (typeof onChange === "function") {
        onChange(data.secure_url);
      }
    } catch (err) {
      setError(
        err.message || "Erro ao enviar a imagem de capa. Tente novamente.",
      );
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
    setDimensionsLabel("");
    setError("");
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (typeof onChange === "function") {
      onChange("");
    }
  };

  const hasCustomCover = Boolean(localPreview || value);
  const displayCoverUrl = localPreview || value || DEFAULT_BLOG_COVER_IMAGE;

  return (
    <div className="pl-blog-cover-uploader">
      <div className="pl-blog-cover-uploader-head">
        <label htmlFor={id} className="pl-blog-cover-label">
          <Icon name="image" size={16} />
          <span>{label}</span>
        </label>
        <span className="pl-blog-cover-badge">
          {hasCustomCover ? "Capa personalizada" : "Capa padrão"}
        </span>
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

      <div className="pl-blog-cover-preview-frame">
        <Image
          unoptimized
          src={displayCoverUrl}
          alt="Pré-visualização da capa"
          width={RECOMMENDED_BLOG_COVER_WIDTH}
          height={RECOMMENDED_BLOG_COVER_HEIGHT}
          className="pl-blog-cover-preview-img"
        />
      </div>

      <div className="pl-blog-cover-uploader-meta">
        <p className="pl-blog-cover-helper">{helperText}</p>
        {(fileName || dimensionsLabel || fileSize) && (
          <p className="pl-blog-cover-file-info">
            {[fileName, dimensionsLabel, fileSize].filter(Boolean).join(" · ")}
          </p>
        )}
        {uploading ? (
          <p role="status" aria-live="polite" className="pl-blog-cover-status">
            Otimizando e enviando imagem de capa…
          </p>
        ) : uploadSuccess ? (
          <p
            role="status"
            aria-live="polite"
            className="pl-blog-cover-status is-success"
          >
            <Icon name="check" size={14} /> Imagem de capa pronta para salvar.
          </p>
        ) : null}
      </div>

      <div className="p-actions pl-blog-cover-actions">
        <button
          type="button"
          onClick={handleTriggerFileSelect}
          disabled={disabled || uploading}
          className="p-button p-button-outline"
        >
          <Icon name="upload" size={15} />
          <span>
            {hasCustomCover ? "Substituir imagem" : "Enviar imagem de capa"}
          </span>
        </button>

        {hasCustomCover ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="p-button p-button-outline"
          >
            <Icon name="close" size={15} />
            <span>Remover imagem</span>
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="p-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
