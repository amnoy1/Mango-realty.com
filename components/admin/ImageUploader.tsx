"use client";

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
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

    const formData = new FormData();
    validFiles.forEach((f) => formData.append("files", f));
    if (propertySlug) formData.append("slug", propertySlug);

    try {
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        body: formData,
      });
      const { urls, error } = await res.json();
      if (error) throw new Error(error);

      const newImages: UploadedImage[] = urls.map((url: string, i: number) => ({
        id: `${Date.now()}-${i}`,
        url,
        name: validFiles[i].name,
      }));

      onChange([...images, ...newImages]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("שגיאה בהעלאת תמונות");
    } finally {
      setUploading(false);
    }
  }, [images, onChange, propertySlug]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const moveImage = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
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

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-gray-100">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />

              {/* Primary badge */}
              {idx === 0 && (
                <span className="absolute top-1 right-1 bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ראשית
                </span>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx - 1)}
                    className="bg-white/90 rounded-full p-1.5 text-gray-700 hover:bg-white transition-colors"
                    title="הזז שמאלה"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="bg-red-500/90 rounded-full p-1.5 text-white hover:bg-red-500 transition-colors"
                  title="מחק תמונה"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx + 1)}
                    className="bg-white/90 rounded-full p-1.5 text-gray-700 hover:bg-white transition-colors"
                    title="הזז ימינה"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
