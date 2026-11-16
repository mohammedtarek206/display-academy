"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  bucket: string;
  folder?: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  className?: string;
  label?: string;
}

export default function ImageUpload({
  bucket,
  folder = "",
  currentUrl,
  onUpload,
  className = "",
  label = "رفع صورة",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("الملف يجب أن يكون صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${folder ? folder + "/" : ""}${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("فشل رفع الصورة: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setPreview(data.publicUrl);
    onUpload(data.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>

      {preview ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 group">
          <Image src={preview} alt="preview" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm transition-colors"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-rose-500/80 hover:bg-rose-500 rounded-lg text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 hover:bg-primary/5"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">اسحب الصورة هنا أو انقر للاختيار</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP (حد أقصى 5 ميجابايت)</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
    </div>
  );
}
