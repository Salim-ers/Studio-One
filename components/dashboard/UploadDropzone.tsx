"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  label: string;
  hint: string;
  accept?: string;
  multiple?: boolean;
  /** Mode image : réduit et remonte les data URLs pour les animer dans la vidéo. */
  onImagesChange?: (dataUrls: string[]) => void;
  maxImages?: number;
}

/** Réduit une image (max 1400 px) en JPEG data URL, pour tenir dans le stockage. */
async function downscaleToDataUrl(file: File, maxDim = 1400): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Zone d'upload élégante : drag & drop + sélection de fichiers.
 * En mode image, les fichiers sont réduits en data URLs et remontés.
 */
export function UploadDropzone({
  label,
  hint,
  accept,
  multiple = true,
  onImagesChange,
  maxImages = 5,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles((prev) => [...prev, ...incoming.map((f) => f.name)]);

    if (!onImagesChange) return;
    const imageFiles = incoming.filter((f) => f.type.startsWith("image/"));
    const dataUrls = (
      await Promise.all(
        imageFiles.map((f) => downscaleToDataUrl(f).catch(() => ""))
      )
    ).filter(Boolean);
    setImages((prev) => {
      const next = [...prev, ...dataUrls].slice(0, maxImages);
      onImagesChange(next);
      return next;
    });
  }

  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, j) => j !== i));
    if (onImagesChange) {
      setImages((prev) => {
        const next = prev.filter((_, j) => j !== i);
        onImagesChange(next);
        return next;
      });
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-coffee">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-2 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-all duration-200",
          dragging
            ? "border-bronze bg-[#F3E9DC]/60"
            : "border-hairline-strong bg-cream/40 hover:border-bronze/50 hover:bg-cream/70"
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-ivory text-bronze" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 11V3m0 0L4.5 6.5M8 3l3.5 3.5M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-sm font-medium text-coffee">
          Déposez vos fichiers ici ou cliquez pour parcourir
        </span>
        <span className="text-xs text-warm-gray">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
        aria-label={label}
      />

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((name, i) => (
            <li
              key={name + i}
              className="flex items-center justify-between rounded-lg border border-hairline bg-ivory px-4 py-2.5 text-sm text-coffee"
            >
              <span className="flex items-center gap-2 truncate">
                <svg className="shrink-0 text-bronze" width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="truncate">{name}</span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="ml-3 text-xs text-warm-gray transition-colors hover:text-red-700"
                aria-label={`Retirer ${name}`}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      {onImagesChange && images.length > 0 && (
        <p className="mt-2 text-xs text-bronze-deep">
          {images.length} capture{images.length > 1 ? "s" : ""} prête
          {images.length > 1 ? "s" : ""} à être animée
          {images.length > 1 ? "s" : ""} dans la vidéo.
        </p>
      )}
    </div>
  );
}
