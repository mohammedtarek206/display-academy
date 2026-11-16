"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trainer, Room, Course } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import ImageUpload from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const EMPTY: Partial<Trainer> = { name:"", specialization:"", phone:"", email:"", image_url:"", bio:"", is_active:true };

export default function TrainersPage() {
  const supabase = createClient();
  const [data, setData] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Pick<Room,"id"|"name">[]>([]);
  const [courses, setCourses] = useState<Pick<Course,"id"|"name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trainer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Trainer>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("trainers").select("*").order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    supabase.from("rooms").select("id,name").then(({ data: r }) => setRooms(r ?? []));
    supabase.from("courses").select("id,name").then(({ data: c }) => setCourses(c ?? []));
    const ch = supabase.channel("trainers-rt").on("postgres_changes",{ event:"*", schema:"public", table:"trainers" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  const filtered = data.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || (t.specialization??'').toLowerCase().includes(q))
      && (filterActive === "" || String(t.is_active) === filterActive);
  });

  const F = (k: keyof Trainer, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (t: Trainer) => { setForm({ ...t }); setEditId(t.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError("اسم المدرب مطلوب"); return; }
    setSaving(true); setError(null);
    const payload = { name:form.name, specialization:form.specialization||null, phone:form.phone||null, email:form.email||null, image_url:form.image_url||null, bio:form.bio||null, is_active:form.is_active??true };
    let e;
    if (editId) { const r = await supabase.from("trainers").update(payload).eq("id", editId); e = r.error; }
    else { const r = await supabase.from("trainers").insert(payload); e = r.error; }
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("trainers").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const toggleActive = async (t: Trainer) => {
    await supabase.from("trainers").update({ is_active: !t.is_active }).eq("id", t.id);
    load();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const columns: Column<Trainer>[] = [
    { key:"name", label:"المدرب", sortable:true, render:(_,t)=>(
      <div className="flex items-center gap-3">
        {t.image_url ? <Image src={t.image_url} alt={t.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">{t.name[0]}</div>}
        <div><div className="font-semibold text-slate-900 dark:text-white">{t.name}</div><div className="text-xs text-slate-400">{t.specialization||"—"}</div></div>
      </div>
    )},
    { key:"phone", label:"الهاتف", render:v=><span className="font-mono text-sm">{String(v||"—")}</span> },
    { key:"email", label:"البريد", render:v=><span className="text-sm text-slate-500">{String(v||"—")}</span> },
    { key:"is_active", label:"الحالة", render:(_,t)=>(
      <button onClick={()=>toggleActive(t)} className="focus:outline-none">
        <StatusBadge status={t.is_active} />
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة المدربين</h2>
          <p className="text-slate-500 mt-1">إجمالي: <strong>{data.length}</strong> مدرب</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors">
          <Plus className="w-5 h-5" /> إضافة مدرب
        </motion.button>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="ابحث بالاسم أو التخصص..."
        filters={[{ label:"الحالة", value:filterActive, onChange:setFilterActive, options:[{label:"نشط",value:"true"},{label:"معطّل",value:"false"}] }]} />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="لا يوجد مدربون مطابقون"
        rowActions={t=>(
          <>
            <button onClick={()=>openEdit(t)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="w-4 h-4" /></button>
            <button onClick={()=>setDeleteTarget(t)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل بيانات مدرب":"إضافة مدرب جديد"} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <ImageUpload bucket="trainer-photos" folder="trainers" currentUrl={form.image_url} onUpload={url=>F("image_url",url)} label="صورة المدرب" />
          </div>
          {([["name","الاسم الكامل *","text"],["specialization","التخصص","text"],["phone","رقم الهاتف","tel"],["email","البريد الإلكتروني","email"]] as const).map(([k,l,t])=>(
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input type={t} value={(form as Record<string,unknown>)[k] as string ?? ""} onChange={e=>F(k as keyof Trainer, e.target.value)} className={inputCls} />
            </div>
          ))}
          <div className="col-span-2">
            <label className={labelCls}>نبذة عن المدرب</label>
            <textarea rows={3} value={form.bio??""} onChange={e=>F("bio",e.target.value)} className={inputCls+" resize-none"} />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active??true} onChange={e=>F("is_active",e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="mr-3 text-sm font-semibold text-slate-700 dark:text-slate-300">مدرب نشط</span>
            </label>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editId?"حفظ التعديلات":"إضافة المدرب"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="حذف المدرب" message={`هل أنت متأكد من حذف المدرب "${deleteTarget?.name}"؟`} />
    </div>
  );
}
