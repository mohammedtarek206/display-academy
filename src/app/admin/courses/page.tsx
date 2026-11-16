"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Course, Trainer } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16"];
const EMPTY: Partial<Course> = { name:"", description:"", color:"#3b82f6", is_active:true };

export default function CoursesPage() {
  const supabase = createClient();
  const [data, setData] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Pick<Trainer,"id"|"name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Course>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    supabase.from("trainers").select("id,name").then(({ data: t }) => setTrainers(t ?? []));
  }, [load, supabase]);

  const filtered = data.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const F = (k: keyof Course, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (c: Course) => { setForm({ ...c }); setEditId(c.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError("اسم المادة مطلوب"); return; }
    setSaving(true); setError(null);
    const payload = { name:form.name, description:form.description||null, color:form.color||"#3b82f6", is_active:form.is_active??true };
    let e;
    if (editId) { const r = await supabase.from("courses").update(payload).eq("id",editId); e = r.error; }
    else { const r = await supabase.from("courses").insert(payload); e = r.error; }
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("courses").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const toggleActive = async (c: Course) => {
    await supabase.from("courses").update({ is_active: !c.is_active }).eq("id", c.id); load();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const columns: Column<Course>[] = [
    { key:"name", label:"المادة", sortable:true, render:(_,c)=>(
      <div className="flex items-center gap-3">
        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: c.color??'#3b82f6' }} />
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
          <div className="text-xs text-slate-400">{c.description||"—"}</div>
        </div>
      </div>
    )},
    { key:"is_active", label:"الحالة", render:(_,c)=>(
      <button onClick={()=>toggleActive(c)}>
        {c.is_active
          ? <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><ToggleRight className="w-5 h-5"/>نشطة</span>
          : <span className="flex items-center gap-1 text-slate-400 text-xs font-bold"><ToggleLeft className="w-5 h-5"/>معطّلة</span>}
      </button>
    )},
    { key:"created_at", label:"تاريخ الإضافة", sortable:true, render:v=><span className="text-xs text-slate-400">{new Date(String(v)).toLocaleDateString("ar-SA")}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة المواد الدراسية</h2>
          <p className="text-slate-500 mt-1">إجمالي: <strong>{data.length}</strong> مادة</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors">
          <Plus className="w-5 h-5" /> إضافة مادة
        </motion.button>
      </div>

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="ابحث باسم المادة..." />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="لا توجد مواد"
        rowActions={c=>(
          <>
            <button onClick={()=>openEdit(c)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="w-4 h-4"/></button>
            <button onClick={()=>setDeleteTarget(c)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4"/></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل المادة":"إضافة مادة جديدة"} size="md">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>اسم المادة *</label>
            <input value={form.name??""} onChange={e=>F("name",e.target.value)} className={inputCls} placeholder="تطوير الويب" />
          </div>
          <div>
            <label className={labelCls}>وصف المادة</label>
            <textarea rows={2} value={form.description??""} onChange={e=>F("description",e.target.value)} className={inputCls+" resize-none"} />
          </div>
          <div>
            <label className={labelCls}>لون المادة</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c=>(
                <button key={c} type="button" onClick={()=>F("color",c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color===c?"border-slate-900 dark:border-white scale-110":"border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={form.color??""} onChange={e=>F("color",e.target.value)} className="w-8 h-8 rounded-full border cursor-pointer" title="لون مخصص" />
            </div>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active??true} onChange={e=>F("is_active",e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              <span className="mr-3 text-sm font-semibold text-slate-700 dark:text-slate-300">مادة نشطة</span>
            </label>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}
            {editId?"حفظ التعديلات":"إضافة المادة"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="حذف المادة" message={`هل أنت متأكد من حذف مادة "${deleteTarget?.name}"؟`} />
    </div>
  );
}
