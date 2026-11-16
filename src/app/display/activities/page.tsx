"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import TopBar from "@/components/display/TopBar";
import Ticker from "@/components/display/Ticker";
import MediaSlider from "@/components/display/MediaSlider";

export default function ActivitiesDisplay() {
  const supabase = createClient();
  const [mediaItems, setMediaItems] = useState<{id:string; type:"image"|"video"; url:string; title?:string}[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [imgRes, vidRes] = await Promise.all([
      supabase.from("gallery_images").select("*").eq("is_active", true).order("display_order"),
      supabase.from("videos").select("*").eq("is_active", true).order("display_order")
    ]);
    
    const media = [
      ...(imgRes.data || []).map(img => ({ id: img.id, type: "image" as const, url: img.url, title: img.title || undefined })),
      ...(vidRes.data || []).map(vid => ({ id: vid.id, type: "video" as const, url: vid.url, title: vid.title || undefined }))
    ];
    setMediaItems(media);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
    const ch1 = supabase.channel("activities-img-rt").on("postgres_changes", { event: "*", schema: "public", table: "gallery_images" }, loadData).subscribe();
    const ch2 = supabase.channel("activities-vid-rt").on("postgres_changes", { event: "*", schema: "public", table: "videos" }, loadData).subscribe();
      
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [loadData, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-slate-950" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-slate-950 to-purple-900/20 z-0" />
      
      <div className="relative z-10 flex flex-col h-full flex-1">
        <TopBar />
        
        <div className="flex-1 pb-20 flex flex-col">
          <div className="flex items-center gap-4 mb-6 px-4">
            <div className="p-3 bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-500/40">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black text-white drop-shadow-lg">أنشطة وفعاليات الأكاديمية</h2>
          </div>

          <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 mx-4 relative">
             {mediaItems.length > 0 ? (
               <MediaSlider items={mediaItems} interval={10000} />
             ) : (
               <div className="w-full h-full flex items-center justify-center glass-card">
                 <div className="text-center text-white/50">
                   <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                   <p className="text-xl font-bold">لا يوجد وسائط للعرض حالياً</p>
                 </div>
               </div>
             )}
          </div>
        </div>
        
        <Ticker />
      </div>
    </div>
  );
}
