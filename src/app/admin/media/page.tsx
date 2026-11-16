"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GalleryImage, Video } from "@/lib/types";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon, Play, PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function MediaPage() {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingImg, setLoadingImg] = useState(true);
  const [loadingVid, setLoadingVid] = useState(true);
  const [deleteImg, setDeleteImg] = useState<GalleryImage | null>(null);
  const [deletingImg, setDeletingImg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"images"|"videos">("images");

  const loadImages = useCallback(async () => {
    setLoadingImg(true);
    const { data } = await supabase.from("gallery_images").select("*").order("display_order");
    setImages(data ?? []);
    setLoadingImg(false);
  }, [supabase]);

  const loadVideos = useCallback(async () => {
    setLoadingVid(true);
    const { data } = await supabase.from("videos").select("*").order("display_order");
    setVideos(data ?? []);
    setLoadingVid(false);
  }, [supabase]);

  useEffect(() => {
    loadImages(); loadVideos();
    const ch1 = supabase.channel("media-images-rt").on("postgres_changes",{ event:"*", schema:"public", table:"gallery_images" }, loadImages).subscribe();
    const ch2 = supabase.channel("media-videos-rt").on("postgres_changes",{ event:"*", schema:"public", table:"videos" }, loadVideos).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [loadImages, loadVideos, supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const path = `gallery/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("academy-media").upload(path, file, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("academy-media").getPublicUrl(path);
        await supabase.from("gallery_images").insert({ url: publicUrl, title: file.name.replace(/\.[^/.]+$/, ""), display_order: images.length, is_active: true });
      }
    }
    setUploading(false); loadImages();
    e.target.value = "";
  };

  const toggleImage = async (img: GalleryImage) => {
    await supabase.from("gallery_images").update({ is_active: !img.is_active }).eq("id", img.id); loadImages();
  };

  const deleteImage = async () => {
    if (!deleteImg) return;
    setDeletingImg(true);
    await supabase.from("gallery_images").delete().eq("id", deleteImg.id);
    setDeletingImg(false); setDeleteImg(null); loadImages();
  };

  const toggleVideo = async (v: Video) => {
    await supabase.from("videos").update({ is_active: !v.is_active }).eq("id", v.id); loadVideos();
  };

  const moveVideo = async (v: Video, dir: -1 | 1) => {
    const newOrder = v.display_order + dir;
    const swap = videos.find(x => x.display_order === newOrder);
    if (!swap) return;
    await supabase.from("videos").update({ display_order: newOrder }).eq("id", v.id);
    await supabase.from("videos").update({ display_order: v.display_order }).eq("id", swap.id);
    loadVideos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة الوسائط</h2>
          <p className="text-slate-500 mt-1">الصور: <strong>{images.length}</strong> • الفيديوهات: <strong>{videos.length}</strong></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
        {[{k:"images",l:"الصور",icon:ImageIcon},{k:"videos",l:"الفيديوهات",icon:Play}].map(({k,l,icon:Icon})=>(
          <button key={k} onClick={()=>setActiveTab(k as "images"|"videos")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab===k?"bg-white dark:bg-slate-800 shadow text-primary":"text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <Icon className="w-4 h-4" />{l}
          </button>
        ))}
      </div>

      {activeTab === "images" && (
        <div className="space-y-4">
          {/* Upload Button */}
          <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors ${uploading?"bg-primary/70":"bg-primary hover:bg-primary/90"} text-white shadow-lg shadow-primary/30`}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الرفع...</> : <><Plus className="w-4 h-4" />رفع صور</>}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>

          {loadingImg ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ImageIcon className="w-16 h-16 opacity-30 mb-4" /><p>لا توجد صور بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, i) => (
                <motion.div key={img.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.03}}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all ${img.is_active?"border-emerald-500/50":"border-slate-300 dark:border-slate-700 opacity-50"}`}>
                  <Image src={img.url} alt={img.title||""} width={200} height={150} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={()=>toggleImage(img)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm" title={img.is_active?"إخفاء":"إظهار"}>
                      {img.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={()=>setDeleteImg(img)} className="p-2 bg-rose-500/80 hover:bg-rose-500 rounded-lg text-white">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!img.is_active && (
                    <div className="absolute top-1 right-1 bg-slate-900/80 text-slate-300 text-xs px-2 py-0.5 rounded">مخفي</div>
                  )}
                  {img.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-2">
                      <p className="text-white text-xs truncate">{img.title}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "videos" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3 rounded-xl">
            ⚠️ رفع الفيديوهات يتم بواسطة المبرمج فقط. يمكنك التحكم في التفعيل والترتيب فقط.
          </p>
          {loadingVid ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Play className="w-16 h-16 opacity-30 mb-4" /><p>لا توجد فيديوهات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...videos].sort((a,b)=>a.display_order-b.display_order).map((v) => (
                <div key={v.id} className={`flex items-center gap-4 p-4 rounded-xl border ${v.is_active?"border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5":"border-slate-200 dark:border-slate-800"}`}>
                  <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{v.title||"فيديو بدون عنوان"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{v.type?.toUpperCase()} • ترتيب: {v.display_order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>moveVideo(v,-1)} disabled={v.display_order===0} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">▲</button>
                    <button onClick={()=>moveVideo(v,1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">▼</button>
                    <button onClick={()=>toggleVideo(v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${v.is_active?"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300":"bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                      {v.is_active ? <><PlayCircle className="w-4 h-4" />تشغيل</> : <><StopCircle className="w-4 h-4" />إيقاف</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteImg} onClose={()=>setDeleteImg(null)} onConfirm={deleteImage} loading={deletingImg}
        title="حذف الصورة" message="هل أنت متأكد من حذف هذه الصورة؟" />
    </div>
  );
}
