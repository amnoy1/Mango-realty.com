"use client";

import * as React from "react";
import { useRef, useState, useCallback } from "react";

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
  name: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  propertySlug?: string;
}

export default function ImageUploader({ images, onChange, propertySlug }: ImageUploaderProps) {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragReorderIndex, setDragReorderIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > 10 * 1024 * 1024) return false;
      return true;
    });

    if (!validFiles.length) return;
    if (images.length + validFiles.length > 20) {
      alert("מקסימום 20 תמונות לנכס");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: get signed upload URLs from our API (tiny JSON request, no file data)
      const signRes = await fetch("/api/admin/upload-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filenames: validFiles.map((f) => f.name),
          slug: propertySlug,
        }),
      });

      let signJson: { uploads?: { signedUrl: string; path: string; publicUrl: string }[]; errors?: string[]; error?: string };
      try {
        signJson = await signRes.json();
      } catch {
        throw new Error(`שגיאת שרת ${signRes.status}`);
      }

      if (!signRes.ok || signJson.error) {
        throw new Error(signJson.error || `שגיאת שרת ${signRes.status}`);
      }

      const uploads = signJson.uploads ?? [];

      // Step 2: upload each file directly to Supabase (bypasses Vercel body size limit)
      const uploadErrors: string[] = [];
      const newImages: UploadedImage[] = [];

      await Promise.all(
        uploads.map(async (slot, i) => {
          const file = validFiles[i];
          if (!file) return;

          const putRes = await fetch(slot.signedUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type || "image/jpeg" },
          });

          if (!putRes.ok) {
            uploadErrors.push(`${file.name}: HTTP ${putRes.status}`);
            return;
          }

          newImages[i] = {
            id: `${Date.now()}-${i}`,
            url: slot.publicUrl,
            name: file.name,
          };
        })
      );

      const succeeded = newImages.filter(Boolean);
      if (succeeded.length === 0) {
        throw new Error(uploadErrors.join("; ") || "כל ההעלאות נכשלו");
      }

      onChange([...images, ...succeeded]);

      const allErrors = [...(signJson.errors ?? []), ...uploadErrors];
      if (allErrors.length) {
        setUploadError(`חלק מהתמונות נכשלו: ${allErrors.join("; ")}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      setUploadError(msg);
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [images, onChange, propertySlug]);

  /* ── File drop zone ── */
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragReorderIndex === null) setIsDraggingFiles(true);
  };

  const handleFileDragLeave = () => setIsDraggingFiles(false);

  /* ── Image reorder drag ── */
  const handleImgDragStart = (e: React.DragEvent, idx: number) => {
    setDragReorderIndex(idx);
    e.dataTransfer.effectAllowed = "move";
    // Prevent the file drop zone from firing
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleImgDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(idx);
  };

  const handleImgDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragReorderIndex !== null && dragReorderIndex !== idx) {
      const next = [...images];
      const [item] = next.splice(dragReorderIndex, 1);
      next.splice(idx, 0, item);
      onChange(next);
    }
    setDragReorderIndex(null);
    setDropTargetIndex(null);
  };

  const handleImgDragEnd = () => {
    setDragReorderIndex(null);
    setDropTargetIndex(null);
  };

  const removeImage = (id: string) => onChange(images.filter((img) => img.id !== id));

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleFileDrop}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDraggingFiles
            ? "border-[#F5A623] bg-orange-50"
            : "border-gray-300 hover:border-[#F5A623] hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-[#F5A623]">
            <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">מעלה תמונות...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-gray-600">גרור תמונות לכאן או לחץ לבחירה</span>
            <span className="text-xs text-gray-400">JPG, PNG, WebP עד 10MB | מקסימום 20 תמונות</span>
          </div>
        )}
      </div>

      {/* Error banner */}
      {uploadError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-medium">שגיאה בהעלאה: </span>{uploadError}
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="mr-auto text-red-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Thumbnails with drag-to-reorder */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 text-right">
            גרור תמונות לשינוי סדר · התמונה הראשונה תוצג כתמונה ראשית
          </p>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => handleImgDragStart(e, idx)}
                onDragOver={(e) => handleImgDragOver(e, idx)}
                onDrop={(e) => handleImgDrop(e, idx)}
                onDragEnd={handleImgDragEnd}
                className={[
                  "relative group rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                  dragReorderIndex === idx ? "opacity-40 scale-95 shadow-inner" : "",
                  dropTargetIndex === idx && dragReorderIndex !== idx
                    ? "ring-2 ring-[#F5A623] ring-offset-2 scale-[1.02]"
                    : "",
                ].join(" ")}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                {/* Primary badge */}
                {idx === 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    ראשית
                  </span>
                )}

                {/* Order number */}
                <span className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[10px] font-medium w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx + 1}
                </span>

                {/* Drag grip (top-left) */}
                <div className="absolute top-1.5 left-1.5 bg-black/50 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                  </svg>
                </div>

                {/* Delete button */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    className="bg-red-500 rounded-full p-1.5 text-white hover:bg-red-600 transition-colors shadow"
                    title="מחק תמונה"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
