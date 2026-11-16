"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lecture, Room, Trainer, Course } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Plus, Pencil, Trash2, Loader2, PlayCircle, StopCircle, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const EMPTY: Partial<Lecture> = { room_id:"", trainer_id:null, course_id:null, start_time:"", end_time:"", students_count:0, is_active:false };

export default function SchedulesPage() {
  const supabase = createClient();
  const [data, setData] = useState<(Lecture & { room?:Pick<Room,"id"|"name">|null; trainer?:Pick<Trainer,"id"|"name">|null; course?:Pick<Course,"id"|"name">|null })[]>([]);
  const [rooms, setRooms] = useState<Pick<Room,"id"|"name">[]>([]);
  const [trainers, setTrainers] = useState<Pick<Trainer,"id"|"name">[]>([]);
  const [courses, setCourses] = useState<Pick<Course,"id"|"name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lecture | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Lecture>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("lectures").select("*, room:rooms(id,name), trainer:trainers(id,name), course:courses(id,name)").order("start_time", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    supabase.from("rooms").select("id,name").then(({ data }) => setRooms(data ?? []));
    supabase.from("trainers").select("id,name").then(({ data }) => setTrainers(data ?? []));
    supabase.from("courses").select("id,name").then(({ data }) => setCourses(data ?? []));
  }, [load, supabase]);

  const filtered = data.filter(l =>
    (!search || l.course?.name.toLowerCase().includes(search.toLowerCase()) || l.room?.name.toLowerCase().includes(search.toLowerCase()))
    && (filterActive === "" || String(l.is_active) === filterActive)
  );

  const F = (k: keyof Lecture, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (l: Lecture) => { setForm({ ...l, start_time: l.start_time.slice(0,16), end_time: l.end_time.slice(0,16) }); setEditId(l.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.room_id) { setError("يرجى اختيار القاعة"); return; }
    if (!form.start_time || !form.end_time) { setError("أوقات البداية والنهاية مطلوبة"); return; }
    
    setSaving(true); setError(null);
    const payload = { 
      room_id:form.room_id, trainer_id:form.trainer_id||null, course_id:form.course_id||null, 
      start_time:new Date(form.start_time).toISOString(), end_time:new Date(form.end_time).toISOString(), 
      students_count:Number(form.students_count)||0, is_active:form.is_active??false 
    };
    
    let e;
    if (editId) { const r = await supabase.from("lectures").update(payload).eq("id", editId); e = r.error; }
    else { const r = await supabase.from("lectures").insert(payload); e = r.error; }
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("lectures").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const toggleActive = async (l: Lecture) => {
    await supabase.from("lectures").update({ is_active: !l.is_active }).eq("id", l.id); load();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const columns: Column<any>[] = [
    { key:"course", label:"المحاضرة", render:(_,l)=>(
      <div>
        <div className="font-bold text-slate-900 dark:text-white">{l.course?.name||"—"}</div>
        <div className="text-xs text-slate-500">القاعة: {l.room?.name||"—"} • المدرب: {l.trainer?.name||"—"}</div>
      </div>
    )},
    { key:"start_time", label:"التوقيت", render:(_,l)=>(
      <div className="text-sm font-medium" dir="ltr">
        {new Date(l.start_time).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})} - {new Date(l.end_time).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})}
        <div className="text-xs text-slate-400 mt-0.5" dir="rtl">{new Date(l.start_time).toLocaleDateString("ar-SA")}</div>
      </div>
    )},
    { key:"students_count", label:"حضور", render:v=><span className="font-bold text-primary">{String(v)} طالب</span> },
    { key:"is_active", label:"الحالة", render:(_,l)=>(
      <button onClick={()=>toggleActive(l)} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-colors ${l.is_active?"bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400":"bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
        {l.is_active ? <><PlayCircle className="w-4 h-4"/>جارية الآن</> : <><StopCircle className="w-4 h-4"/>مجدولة/منتهية</>}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة الجداول والمحاضرات</h2>
          <p className="text-slate-500 mt-1">الجارية حالياً: <strong>{data.filter(l=>l.is_active).length}</strong> محاضرة</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">
          <CalendarDays className="w-5 h-5" /> حجز محاضرة
        </motion.button>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="ابحث باسم المادة أو القاعة..."
        filters={[{ label:"الحالة", value:filterActive, onChange:setFilterActive, options:[{label:"جارية الآن",value:"true"},{label:"منتهية/مجدولة",value:"false"}] }]} />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="لا توجد محاضرات"
        rowActions={l=>(
          <>
            <button onClick={()=>openEdit(l)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="w-4 h-4" /></button>
            <button onClick={()=>setDeleteTarget(l)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل المحاضرة":"حجز محاضرة جديدة"} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>المادة *</label>
              <select value={form.course_id??""} onChange={e=>F("course_id",e.target.value)} className={inputCls}>
                <option value="">— اختر المادة —</option>
                {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>القاعة *</label>
              <select value={form.room_id??""} onChange={e=>F("room_id",e.target.value)} className={inputCls}>
                <option value="">— اختر القاعة —</option>
                {rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>المدرب</label>
              <select value={form.trainer_id??""} onChange={e=>F("trainer_id",e.target.value)} className={inputCls}>
                <option value="">— اختر المدرب —</option>
                {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>وقت البداية *</label>
              <input type="datetime-local" value={form.start_time??""} onChange={e=>F("start_time",e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>وقت النهاية *</label>
              <input type="datetime-local" value={form.end_time??""} onChange={e=>F("end_time",e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>عدد الطلاب الحاضرين</label>
              <input type="number" min={0} value={form.students_count??0} onChange={e=>F("students_count",e.target.value)} className={inputCls} />
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active??false} onChange={e=>F("is_active",e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              <div className="mr-3">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">محاضرة جارية الآن</span>
                <span className="block text-xs text-slate-500 mt-0.5">تفعيل هذا الخيار سيظهر المحاضرة كـ "مشغولة" في شاشات العرض</span>
              </div>
            </label>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}
            {editId?"حفظ التعديلات":"حجز المحاضرة"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="إلغاء الحجز" message="هل أنت متأكد من حذف هذه المحاضرة؟" />
    </div>
  );
}
