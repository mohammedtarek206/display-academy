"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MediaItem = { id: string; type: "image" | "video"; url: string; title?: string };

export default function MediaSlider({ items, interval = 10000 }: { items: MediaItem[], interval?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    
    // Simple timer based slider, should handle video ending in a real app
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [items, interval]);

  if (items.length === 0) return <div className="w-full h-full glass-card flex items-center justify-center text-slate-400">لا يوجد وسائط للعرض</div>;

  const currentItem = items[currentIndex];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-3xl glass-card">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {currentItem.type === "image" ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${currentItem.url})` }}
            />
          ) : (
            <video 
              src={currentItem.url} 
              className="w-full h-full object-cover"
              autoPlay 
              muted 
              loop 
            />
          )}
          
          {currentItem.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">{currentItem.title}</h2>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
