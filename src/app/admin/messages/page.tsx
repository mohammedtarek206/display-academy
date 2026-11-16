"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WelcomeMessage } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const EMPTY: Partial<WelcomeMessage> = { text:"", is_active:true, scheduled_time:null, display_on_screen:"all" };

export default function MessagesPage() {
  const supabase = createClient();
  const [data, setData] = useState<WelcomeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WelcomeMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<WelcomeMessage>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("welcome_messages").select("*").order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const ch = supabase.channel("msgs-rt").on("postgres_changes",{ event:"*", schema:"public", table:"welcome_messages" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  const F = (k: keyof WelcomeMessage, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (m: WelcomeMessage) => { setForm({ ...m }); setEditId(m.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.text?.trim()) { setError("نص الرسالة مطلوب"); return; }
    setSaving(true); setError(null);
    const payload = { text:form.text, is_active:form.is_active??true, scheduled_time:form.scheduled_time||null, display_on_screen:form.display_on_screen||"all" };
    let e;
    if (editId) { const r = await supabase.from("welcome_messages").update(payload).eq("id",editId); e = r.error; }
    else { const r = await supabase.from("welcome_messages").insert(payload); e = r.error; }
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("welcome_messages").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const toggleActive = async (m: WelcomeMessage) => {
    await supabase.from("welcome_messages").update({ is_active: !m.is_active }).eq("id", m.id); load();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
  const screenLabel: Record<string,string> = { all:"جميع الشاشات", main:"الشاشة الرئيسية", rooms:"شاشة القاعات", activities:"شاشة الأنشطة" };

  const columns: Column<WelcomeMessage>[] = [
    { key:"text", label:"نص الرسالة", sortable:true, render:(_,m)=>(
      <div className="flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="font-medium text-slate-900 dark:text-white line-clamp-2">{m.text}</p>
      </div>
    )},
    { key:"display_on_screen", label:"الشاشة", render:v=><span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-semibold">{screenLabel[String(v)]||String(v)}</span> },
    { key:"scheduled_time", label:"الجدولة", render:v=><span className="text-xs text-slate-400">{v?new Date(String(v)).toLocaleString("ar-SA"):"دائم"}</span> },
    { key:"is_active", label:"الحالة", render:(_,m)=>(
      <button onClick={()=>toggleActive(m)}>
        {m.is_active
          ? <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><ToggleRight className="w-5 h-5"/>مفعّل</span>
          : <span className="flex items-center gap-1 text-slate-400 text-xs font-bold"><ToggleLeft className="w-5 h-5"/>معطّل</span>}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">رسائل الترحيب</h2>
          <p className="text-slate-500 mt-1">النشطة: <strong>{data.filter(m=>m.is_active).length}</strong> من {data.length}</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:bg-pink-600 transition-colors">
          <Plus className="w-5 h-5" /> إضافة رسالة
        </motion.button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="لا توجد رسائل ترحيب"
        rowActions={m=>(
          <>
            <button onClick={()=>openEdit(m)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="w-4 h-4"/></button>
            <button onClick={()=>setDeleteTarget(m)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4"/></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل الرسالة":"إضافة رسالة جديدة"} size="md">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>نص الرسالة *</label>
            <textarea rows={4} value={form.text??""} onChange={e=>F("text",e.target.value)} className={inputCls+" resize-none"} placeholder="مرحباً بكم في أكاديميتنا..." />
          </div>
          <div>
            <label className={labelCls}>تظهر على</label>
            <select value={form.display_on_screen??"all"} onChange={e=>F("display_on_screen",e.target.value)} className={inputCls}>
              <option value="all">جميع الشاشات</option>
              <option value="main">الشاشة الرئيسية فقط</option>
              <option value="rooms">شاشة القاعات فقط</option>
              <option value="activities">شاشة الأنشطة فقط</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>وقت الجدولة (اختياري)</label>
            <input type="datetime-local" value={form.scheduled_time?.slice(0,16)??""} onChange={e=>F("scheduled_time",e.target.value||null)} className={inputCls} />
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={form.is_active??true} onChange={e=>F("is_active",e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            <span className="mr-3 text-sm font-semibold text-slate-700 dark:text-slate-300">تفعيل الرسالة</span>
          </label>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}
            {editId?"حفظ التعديلات":"إضافة الرسالة"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="حذف الرسالة" message="هل أنت متأكد من حذف هذه الرسالة؟" />
    </div>
  );
}
