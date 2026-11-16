"use client";

import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";

type Room = {
  id: string;
  name: string;
  status: "available" | "occupied";
  trainer?: string;
  course?: string;
  studentsCount?: number;
  remainingTime?: string;
};

export default function RoomList({ rooms }: { rooms: Room[] }) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-3xl font-bold text-white mb-2 px-2 flex items-center gap-3">
        <span className="w-2 h-8 bg-primary rounded-full inline-block" />
        حالة القاعات
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20 custom-scrollbar">
        {rooms.map((room, idx) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-2xl border-l-4 glass relative overflow-hidden ${
              room.status === "available" 
                ? "border-l-emerald-500 bg-emerald-500/10" 
                : "border-l-rose-500 bg-rose-500/10"
            }`}
          >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${
              room.status === "available" ? "bg-emerald-500" : "bg-rose-500"
            }`} />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">{room.name}</h3>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                  room.status === "available" 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {room.status === "available" ? "متاحة حالياً" : "مشغولة"}
                </span>
              </div>

              {room.status === "occupied" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-semibold text-lg text-white">{room.course}</span>
                    <span className="text-sm bg-white/10 px-3 py-1 rounded-lg">{room.trainer}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-rose-300">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">باقي {room.remainingTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">{room.studentsCount} طالب</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
