"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, Room, Trainer, Course } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import ImageUpload from "@/components/admin/ImageUpload";
import { Plus, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

type SR = Student & { room?: Pick<Room,"id"|"name"> | null; trainer?: Pick<Trainer,"id"|"name"> | null; course?: Pick<Course,"id"|"name"> | null };
const EMPTY: Partial<Student> = { name:"", code:"", phone:"", email:"", image_url:"", current_room_id:null, current_trainer_id:null, current_course_id:null, subscription_status:"active" };

export default function StudentsPage() {
  const supabase = createClient();
  const [data, setData] = useState<SR[]>([]);
  const [rooms, setRooms] = useState<Pick<Room,"id"|"name">[]>([]);
  const [trainers, setTrainers] = useState<Pick<Trainer,"id"|"name">[]>([]);
  const [courses, setCourses] = useState<Pick<Course,"id"|"name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SR | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Student>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("students")
      .select("*, room:rooms(id,name), trainer:trainers(id,name), course:courses(id,name)")
      .order("created_at", { ascending: false });
    setData((rows as SR[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    supabase.from("rooms").select("id,name").then(({ data: r }) => setRooms(r ?? []));
    supabase.from("trainers").select("id,name").then(({ data: t }) => setTrainers(t ?? []));
    supabase.from("courses").select("id,name").then(({ data: c }) => setCourses(c ?? []));
    const ch = supabase.channel("students-rt").on("postgres_changes",{ event:"*", schema:"public", table:"students" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  const filtered = data.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.phone??'').includes(q))
      && (!filterStatus || s.subscription_status === filterStatus)
      && (!filterRoom || s.current_room_id === filterRoom);
  });

  const F = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (s: SR) => { setForm({ ...s }); setEditId(s.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.code?.trim()) { setError("الاسم والكود مطلوبان"); return; }
    setSaving(true); setError(null);
    const payload = { name:form.name, code:form.code, phone:form.phone||null, email:form.email||null, image_url:form.image_url||null, current_room_id:form.current_room_id||null, current_trainer_id:form.current_trainer_id||null, current_course_id:form.current_course_id||null, subscription_status:form.subscription_status??"active" };
    const { error: e } = editId ? await supabase.from("students").update(payload).eq("id", editId) : await supabase.from("students").insert(payload);
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("students").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const exportCsv = () => {
    const rows = [["الاسم","الكود","الهاتف","الحالة","القاعة","المدرب","المادة"], ...filtered.map(s=>[s.name,s.code,s.phone??"",s.subscription_status,s.room?.name??"",s.trainer?.name??"",s.course?.name??""])];
    const blob = new Blob(["\uFEFF"+rows.map(r=>r.join(",")).join("\n")], { type:"text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.csv"; a.click();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const columns: Column<SR>[] = [
    { key:"name", label:"الطالب", sortable:true, render:(_,s)=>(
      <div className="flex items-center gap-3">
        {s.image_url ? <Image src={s.image_url} alt={s.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{s.name[0]}</div>}
        <div><div className="font-semibold text-slate-900 dark:text-white">{s.name}</div><div className="text-xs text-slate-400">{s.code}</div></div>
      </div>
    )},
    { key:"phone", label:"الهاتف", render:v=><span className="font-mono text-sm">{String(v||"—")}</span> },
    { key:"room", label:"القاعة", render:(_,s)=>s.room?<span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">{s.room.name}</span>:<span className="text-slate-400">—</span> },
    { key:"trainer", label:"المدرب", render:(_,s)=><span>{s.trainer?.name||"—"}</span> },
    { key:"subscription_status", label:"الحالة", render:v=><StatusBadge status={v as "active"|"inactive"|"suspended"} /> },
    { key:"registration_date", label:"التسجيل", sortable:true, render:v=><span className="text-xs text-slate-400">{v?new Date(String(v)).toLocaleDateString("ar-SA"):"—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة الطلاب</h2>
          <p className="text-slate-500 mt-1">إجمالي: <strong>{data.length}</strong> طالب</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5" /> إضافة طالب
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{l:"نشط",f:"active",c:"emerald"},{l:"غير نشط",f:"inactive",c:"slate"},{l:"موقوف",f:"suspended",c:"amber"}].map(s=>(
          <div key={s.f} className={`px-5 py-4 rounded-xl bg-${s.c}-50 dark:bg-${s.c}-500/10 flex items-center justify-between border border-${s.c}-200 dark:border-${s.c}-500/20`}>
            <span className={`font-semibold text-sm text-${s.c}-700 dark:text-${s.c}-300`}>{s.l}</span>
            <span className={`text-2xl font-black text-${s.c}-700 dark:text-${s.c}-300`}>{data.filter(x=>x.subscription_status===s.f).length}</span>
          </div>
        ))}
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="ابحث بالاسم أو الكود أو الهاتف..."
        filters={[
          { label:"الحالة", value:filterStatus, onChange:setFilterStatus, options:[{label:"نشط",value:"active"},{label:"غير نشط",value:"inactive"},{label:"موقوف",value:"suspended"}] },
          { label:"القاعة", value:filterRoom, onChange:setFilterRoom, options:rooms.map(r=>({label:r.name,value:r.id})) },
        ]}>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors">
          <Download className="w-4 h-4" /> تصدير CSV
        </button>
      </SearchFilter>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="لا يوجد طلاب مطابقون"
        rowActions={s=>(
          <>
            <button onClick={()=>openEdit(s)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
            <button onClick={()=>setDeleteTarget(s)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل بيانات طالب":"إضافة طالب جديد"} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <ImageUpload bucket="student-photos" folder="students" currentUrl={form.image_url} onUpload={url=>F("image_url",url)} label="صورة الطالب" />
          </div>
          {([["name","الاسم الكامل *","text","أحمد محمد"],["code","كود الطالب *","text","STU-0001"],["phone","رقم الهاتف","tel","05xxxxxxxx"],["email","البريد الإلكتروني","email","student@email.com"]] as const).map(([k,l,t,p])=>(
            <div key={k}>
              <label className={labelCls}>{l}</label>
              <input type={t} placeholder={p} value={(form as Record<string,unknown>)[k] as string ?? ""} onChange={e=>F(k as keyof Student, e.target.value)} className={inputCls} />
            </div>
          ))}
          <div>
            <label className={labelCls}>القاعة</label>
            <select value={form.current_room_id??""} onChange={e=>F("current_room_id",e.target.value||null)} className={inputCls}>
              <option value="">— بدون قاعة —</option>
              {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>المدرب</label>
            <select value={form.current_trainer_id??""} onChange={e=>F("current_trainer_id",e.target.value||null)} className={inputCls}>
              <option value="">— بدون مدرب —</option>
              {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>المادة</label>
            <select value={form.current_course_id??""} onChange={e=>F("current_course_id",e.target.value||null)} className={inputCls}>
              <option value="">— بدون مادة —</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>حالة الاشتراك</label>
            <select value={form.subscription_status??"active"} onChange={e=>F("subscription_status",e.target.value)} className={inputCls}>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editId?"حفظ التعديلات":"إضافة الطالب"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="حذف الطالب" message={`هل أنت متأكد من حذف الطالب "${deleteTarget?.name}"؟`} />
    </div>
  );
}
