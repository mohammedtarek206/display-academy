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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"1vh" }}>
      <h2 style={{
        fontSize:"1.8vw", fontWeight:900, color:"#fff", margin:0,
        display:"flex", alignItems:"center", gap:"0.6vw",
        flexShrink:0,
      }}>
        <span style={{ width:"0.4vw", height:"2.5vw", background:"linear-gradient(180deg,#3b82f6,#8b5cf6)", borderRadius:"99px", display:"inline-block" }} />
        حالة القاعات
      </h2>

      <div style={{
        flex:1, overflowY:"auto", display:"flex", flexDirection:"column",
        gap:"0.8vh", paddingBottom:"6vh", paddingLeft:"0.3vw",
      }}
        className="custom-scrollbar"
      >
        {rooms.length === 0 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"rgba(255,255,255,0.3)", fontSize:"1.2vw" }}>
            لا توجد قاعات
          </div>
        )}
        {rooms.map((room, idx) => {
          const occupied = room.status === "occupied";
          return (
            <motion.div
              key={room.id}
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: idx * 0.08 }}
              style={{
                borderRadius:"1vw",
                borderRight: `0.4vw solid ${occupied ? "#f43f5e" : "#10b981"}`,
                background: occupied ? "rgba(244,63,94,0.08)" : "rgba(16,185,129,0.08)",
                backdropFilter:"blur(12px)",
                border:`1px solid ${occupied ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.2)"}`,
                borderRightWidth:"0.4vw",
                padding:"1.2vh 1vw",
                position:"relative", overflow:"hidden",
                flexShrink:0,
              }}
            >
              {/* Glow */}
              <div style={{
                position:"absolute", left:"-2vw", top:"-2vw",
                width:"6vw", height:"6vw", borderRadius:"50%",
                background: occupied ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.15)",
                filter:"blur(20px)",
              }} />

              <div style={{ position:"relative", zIndex:1 }}>
                {/* Room Name + Badge */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: occupied ? "0.8vh" : 0 }}>
                  <h3 style={{ fontSize:"1.5vw", fontWeight:800, color:"#fff", margin:0 }}>{room.name}</h3>
                  <span style={{
                    fontSize:"0.9vw", fontWeight:700, padding:"0.3vh 0.8vw", borderRadius:"99px",
                    background: occupied ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.2)",
                    color: occupied ? "#fda4af" : "#6ee7b7",
                    border: `1px solid ${occupied ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.3)"}`,
                  }}>
                    {occupied ? "🔴 مشغولة" : "🟢 متاحة"}
                  </span>
                </div>

                {occupied && (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5vh" }}>
                      <span style={{ fontSize:"1.2vw", fontWeight:700, color:"#fff" }}>{room.course || "—"}</span>
                      <span style={{ fontSize:"1vw", background:"rgba(255,255,255,0.1)", padding:"0.2vh 0.6vw", borderRadius:"0.5vw", color:"#cbd5e1" }}>{room.trainer}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:"0.5vh" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.4vw", color:"#fda4af", fontSize:"1vw" }}>
                        <Clock style={{ width:"1.2vw", height:"1.2vw" }} />
                        <span>باقي {room.remainingTime}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.4vw", color:"#6ee7b7", fontSize:"1vw" }}>
                        <Users style={{ width:"1.2vw", height:"1.2vw" }} />
                        <span>{room.studentsCount} طالب</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
