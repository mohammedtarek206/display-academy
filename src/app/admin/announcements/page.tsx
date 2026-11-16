"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/lib/types";
import DataTable, { Column } from "@/components/admin/DataTable";
import SearchFilter from "@/components/admin/SearchFilter";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Plus, Pencil, Trash2, Loader2, Megaphone, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";

const EMPTY: Partial<Announcement> = { text:"", color:"#ffffff", speed:"normal", is_active:true, start_date:null, end_date:null };

export default function AnnouncementsPage() {
  const supabase = createClient();
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Announcement>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const ch = supabase.channel("ann-rt").on("postgres_changes",{ event:"*", schema:"public", table:"announcements" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, supabase]);

  const filtered = data.filter(a =>
    (!search || a.text.toLowerCase().includes(search.toLowerCase()))
    && (filterActive === "" || String(a.is_active) === filterActive)
  );

  const F = (k: keyof Announcement, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setModalOpen(true); };
  const openEdit = (a: Announcement) => { setForm({ ...a }); setEditId(a.id); setError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.text?.trim()) { setError("نص الإعلان مطلوب"); return; }
    setSaving(true); setError(null);
    const payload = { text:form.text, color:form.color||"#ffffff", speed:form.speed??"normal", is_active:form.is_active??true, start_date:form.start_date||null, end_date:form.end_date||null };
    let e;
    if (editId) {
      const res = await supabase.from("announcements").update(payload).eq("id", editId);
      e = res.error;
    } else {
      const res = await supabase.from("announcements").insert(payload);
      e = res.error;
    }
    setSaving(false);
    if (e) { setError(e.message); return; }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("announcements").delete().eq("id", deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const toggleActive = async (a: Announcement) => {
    await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id); load();
  };

  const speedLabel = { slow:"بطيء", normal:"عادي", fast:"سريع" };
  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const columns: Column<Announcement>[] = [
    { key:"text", label:"نص الإعلان", sortable:true, render:(_,a)=>(
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full shrink-0 border border-slate-200" style={{ backgroundColor: a.color }} />
        <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{a.text}</p>
      </div>
    )},
    { key:"speed", label:"السرعة", render:v=><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-semibold">{speedLabel[v as keyof typeof speedLabel]}</span> },
    { key:"start_date", label:"البداية", render:v=><span className="text-xs text-slate-400">{v?new Date(String(v)).toLocaleDateString("ar-SA"):"دائم"}</span> },
    { key:"end_date", label:"النهاية", render:v=><span className="text-xs text-slate-400">{v?new Date(String(v)).toLocaleDateString("ar-SA"):"دائم"}</span> },
    { key:"is_active", label:"التفعيل", render:(_,a)=>(
      <button onClick={()=>toggleActive(a)} className="flex items-center gap-1.5 focus:outline-none">
        {a.is_active
          ? <><ToggleRight className="w-6 h-6 text-emerald-500" /><span className="text-xs font-bold text-emerald-500">مفعّل</span></>
          : <><ToggleLeft className="w-6 h-6 text-slate-400" /><span className="text-xs font-bold text-slate-400">معطّل</span></>}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">إدارة الإعلانات</h2>
          <p className="text-slate-500 mt-1">النشطة: <strong>{data.filter(a=>a.is_active).length}</strong> من {data.length}</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors">
          <Plus className="w-5 h-5" /> إضافة إعلان
        </motion.button>
      </div>

      {/* Live preview */}
      {data.filter(a=>a.is_active).length > 0 && (
        <div className="bg-slate-950 rounded-xl p-3 overflow-hidden border border-slate-800">
          <div className="flex items-center gap-3 mb-2"><Megaphone className="w-4 h-4 text-amber-400" /><span className="text-xs text-slate-400 font-semibold">معاينة الشريط الحالي</span></div>
          <div className="overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-ticker text-white font-semibold text-sm" style={{ animationDuration: "20s" }}>
              {data.filter(a=>a.is_active).map(a => `• ${a.text} `).join("          ")}
            </span>
          </div>
        </div>
      )}

      <SearchFilter search={search} onSearchChange={setSearch} placeholder="ابحث في نصوص الإعلانات..."
        filters={[{ label:"الحالة", value:filterActive, onChange:setFilterActive, options:[{label:"مفعّل",value:"true"},{label:"معطّل",value:"false"}] }]} />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="لا توجد إعلانات"
        rowActions={a=>(
          <>
            <button onClick={()=>openEdit(a)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Pencil className="w-4 h-4" /></button>
            <button onClick={()=>setDeleteTarget(a)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      />

      <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editId?"تعديل إعلان":"إضافة إعلان جديد"} size="md">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>نص الإعلان *</label>
            <textarea rows={3} value={form.text??""} onChange={e=>F("text",e.target.value)} className={inputCls+" resize-none"} placeholder="أدخل نص الإعلان هنا..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>لون النص</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color??"#ffffff"} onChange={e=>F("color",e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                <input type="text" value={form.color??"#ffffff"} onChange={e=>F("color",e.target.value)} className={inputCls+" flex-1"} />
              </div>
            </div>
            <div>
              <label className={labelCls}>سرعة الظهور</label>
              <select value={form.speed??"normal"} onChange={e=>F("speed",e.target.value)} className={inputCls}>
                <option value="slow">بطيء</option>
                <option value="normal">عادي</option>
                <option value="fast">سريع</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>تاريخ البداية</label>
              <input type="datetime-local" value={form.start_date?.slice(0,16)??""} onChange={e=>F("start_date",e.target.value||null)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>تاريخ الانتهاء</label>
              <input type="datetime-local" value={form.end_date?.slice(0,16)??""} onChange={e=>F("end_date",e.target.value||null)} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.is_active??true} onChange={e=>F("is_active",e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="mr-3 text-sm font-semibold text-slate-700 dark:text-slate-300">تفعيل الإعلان</span>
            </label>
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg">{error}</p>}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={()=>setModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">إلغاء</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors disabled:opacity-70 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editId?"حفظ التعديلات":"إضافة الإعلان"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting}
        title="حذف الإعلان" message="هل أنت متأكد من حذف هذا الإعلان؟" />
    </div>
  );
}
