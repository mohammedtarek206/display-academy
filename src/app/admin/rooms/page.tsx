"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Room, Trainer } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import ImageUpload from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const EMPTY: Partial<Room> = { name:"", capacity:20, status:"available", image_url:"", description:"", trainer_id:null };

export default function RoomsPage() {
  const supabase = createClient();
  const [data, setData] = useState<(Room & { trainer?: Pick<Trainer,"id"|"name">|null })[]>([]);
  const [trainers, setTrainers] = useState<Pick<Trainer,"id"|"name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Room>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("rooms").select("*, trainer:trainers(id,name)").order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    supabase.from("trainers").select("id,name").then(({ data: t }) => setTrainers(t ?? []));
    const ch = supabase.channel("rooms-rt").on("postgres_changes",{ event:"*", schema:"public", table:"rooms" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  const filtered = data.filter(r =>
    (!search || r.name.toLowerCase().includes(search.toLowerCase()))
    && (!filterStatus || r.status === filterStatus)
  );

  const F = (k: keyof Room, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (r: Room) => { setForm({ ...r }); setEditId(r.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError("اسم القاعة مطلوب"); return; }
    setSaving(true); setError(null);
    const payload = { name:form.name, capacity:Number(form.capacity)||20, status:form.status??"available", image_url:form.image_url||null, description:form.description||null, trainer_id:form.trainer_id||null };
    let e;
    if (editId) { const r = await supabase.from("rooms").update(payload).eq("id", editId); e = r.error; }
    else { const r = await supabase.from("rooms").insert(payload); e = r.error; }
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("rooms").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const setStatus = async (r: Room, status: Room["status"]) => {
    await supabase.from("rooms").update({ status }).eq("id", r.id); load();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  type RoomRow = Room & { trainer?: Pick<Trainer,"id"|"name">|null };

  const columns: Column<RoomRow>[] = [
    { key:"name", label:"القاعة", sortable:true, render:(_,r)=>(
      <div className="flex items-center gap-3">
        {r.image_url ? <Image src={r.image_url} alt={r.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">{r.name[0]}</div>}
        <div><div className="font-semibold text-slate-900 dark:text-white">{r.name}</div><div className="text-xs text-slate-400">{r.description||"—"}</div></div>
      </div>
    )},
    { key:"capacity", label:"السعة", render:v=>(
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
        <Users className="w-4 h-4" /> {String(v)} مقعد
      </div>
    )},
    { key:"trainer", label:"المدرب المسؤول", render:(_,r)=><span className="text-sm">{(r as RoomRow).trainer?.name||"—"}</span> },
    { key:"status", label:"الحالة", render:(_,r)=>(
      <select value={r.status} onChange={e=>setStatus(r, e.target.value as Room["status"])}
        className={`px-2 py-1 rounded-lg text-xs font-bold focus:outline-none ${r.status==="available"?"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300":r.status==="occupied"?"bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300":"bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"}`}>
        <option value="available">متاحة</option>
        <option value="occupied">مشغولة</option>
        <option value="maintenance">صيانة</option>
      </select>
    )},
  ];

  const statusCounts = { available: data.filter(r=>r.status==="available").length, occupied: data.filter(r=>r.status==="occupied").length, maintenance: data.filter(r=>r.status==="maintenance").length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة القاعات</h2>
          <p className="text-slate-500 mt-1">إجمالي: <strong>{data.length}</strong> قاعة</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:bg-purple-600 transition-colors">
          <Plus className="w-5 h-5" /> إضافة قاعة
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{l:"متاحة",k:"available",c:"emerald"},{l:"مشغولة",k:"occupied",c:"rose"},{l:"صيانة",k:"maintenance",c:"amber"}].map(s=>(
          <div key={s.k} className={`px-5 py-4 rounded-xl bg-${s.c}-50 dark:bg-${s.c}-500/10 border border-${s.c}-200 dark:border-${s.c}-500/20 flex items-center justify-between`}>
            <span className={`font-semibold text-sm text-${s.c}-700 dark:text-${s.c}-300`}>{s.l}</span>
            <span className={`text-2xl font-black text-${s.c}-700 dark:text-${s.c}-300`}>{statusCounts[s.k as keyof typeof statusCounts]}</span>
          </div>
        ))}
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="ابحث باسم القاعة..."
        filters={[{ label:"الحالة", value:filterStatus, onChange:setFilterStatus, options:[{label:"متاحة",value:"available"},{label:"مشغولة",value:"occupied"},{label:"صيانة",value:"maintenance"}] }]} />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="لا توجد قاعات مطابقة"
        rowActions={r=>(
          <>
            <button onClick={()=>openEdit(r)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="w-4 h-4" /></button>
            <button onClick={()=>setDeleteTarget(r)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل القاعة":"إضافة قاعة جديدة"} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <ImageUpload bucket="room-photos" folder="rooms" currentUrl={form.image_url} onUpload={url=>F("image_url",url)} label="صورة القاعة" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>اسم القاعة *</label>
            <input type="text" value={form.name??""} onChange={e=>F("name",e.target.value)} className={inputCls} placeholder="قاعة الخوارزمي" />
          </div>
          <div>
            <label className={labelCls}>السعة الاستيعابية</label>
            <input type="number" min={1} value={form.capacity??20} onChange={e=>F("capacity",Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>الحالة</label>
            <select value={form.status??"available"} onChange={e=>F("status",e.target.value)} className={inputCls}>
              <option value="available">متاحة</option>
              <option value="occupied">مشغولة</option>
              <option value="maintenance">صيانة</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>المدرب المسؤول</label>
            <select value={form.trainer_id??""} onChange={e=>F("trainer_id",e.target.value||null)} className={inputCls}>
              <option value="">— بدون مدرب —</option>
              {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>وصف القاعة</label>
            <textarea rows={2} value={form.description??""} onChange={e=>F("description",e.target.value)} className={inputCls+" resize-none"} />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editId?"حفظ التعديلات":"إضافة القاعة"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="حذف القاعة" message={`هل أنت متأكد من حذف القاعة "${deleteTarget?.name}"؟`} />
    </div>
  );
}
