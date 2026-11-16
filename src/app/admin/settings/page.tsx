"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AcademySettings } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
import { Save, Loader2, Building2, Phone, Mail, Globe, Facebook, Instagram } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const supabase = createClient();
  const [form, setForm] = useState<Partial<AcademySettings>>({
    name:"أكاديمية العرض", primary_color:"#2563eb", secondary_color:"#7c3aed",
    phone:"", email:"", website:"", facebook:"", instagram:"", twitter:"", logo_url:""
  });
  const [settingsId, setSettingsId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("academy_settings").select("*").limit(1).single();
    if (data) { setForm(data); setSettingsId(data.id); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const F = (k: keyof AcademySettings, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (settingsId) {
      await supabase.from("academy_settings").update(payload).eq("id", settingsId);
    } else {
      await supabase.from("academy_settings").insert(payload);
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelCls = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">الإعدادات العامة</h2>
          <p className="text-slate-500 mt-1">إعدادات الأكاديمية التي تظهر على جميع الشاشات</p>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all ${saved?"bg-emerald-500":"bg-primary hover:bg-primary/90"} shadow-lg disabled:opacity-70`}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
        </motion.button>
      </div>

      {/* Academy Identity */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <h3 className="text-lg font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary"/>هوية الأكاديمية</h3>
        <ImageUpload bucket="academy-media" folder="logos" currentUrl={form.logo_url} onUpload={url=>F("logo_url",url)} label="شعار الأكاديمية" />
        <div>
          <label className={labelCls}>اسم الأكاديمية</label>
          <input value={form.name??""} onChange={e=>F("name",e.target.value)} className={inputCls} placeholder="أكاديمية العرض" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>اللون الرئيسي</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color??"#2563eb"} onChange={e=>F("primary_color",e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
              <input value={form.primary_color??""} onChange={e=>F("primary_color",e.target.value)} className={inputCls+" flex-1"} />
            </div>
          </div>
          <div>
            <label className={labelCls}>اللون الثانوي</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.secondary_color??"#7c3aed"} onChange={e=>F("secondary_color",e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
              <input value={form.secondary_color??""} onChange={e=>F("secondary_color",e.target.value)} className={inputCls+" flex-1"} />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2"><Phone className="w-5 h-5 text-primary"/>معلومات التواصل</h3>
        {[
          { k:"phone", l:"رقم الهاتف", icon:Phone, ph:"05xxxxxxxx", t:"tel" },
          { k:"email", l:"البريد الإلكتروني", icon:Mail, ph:"info@academy.com", t:"email" },
          { k:"website", l:"الموقع الإلكتروني", icon:Globe, ph:"https://academy.com", t:"url" },
        ].map(({k,l,icon:Icon,ph,t})=>(
          <div key={k}>
            <label className={labelCls}>{l}</label>
            <div className="relative">
              <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type={t} placeholder={ph} value={(form as Record<string,unknown>)[k] as string ?? ""} onChange={e=>F(k as keyof AcademySettings,e.target.value)} className={inputCls+" pr-10"} />
            </div>
          </div>
        ))}
      </div>

      {/* Social Media */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-primary"/>مواقع التواصل الاجتماعي</h3>
        {[
          { k:"facebook", l:"Facebook", icon:Facebook, ph:"https://facebook.com/..." },
          { k:"instagram", l:"Instagram", icon:Instagram, ph:"https://instagram.com/..." },
          { k:"twitter", l:"Twitter / X", icon:Globe, ph:"https://twitter.com/..." },
        ].map(({k,l,icon:Icon,ph})=>(
          <div key={k}>
            <label className={labelCls}>{l}</label>
            <div className="relative">
              <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="url" placeholder={ph} value={(form as Record<string,unknown>)[k] as string ?? ""} onChange={e=>F(k as keyof AcademySettings,e.target.value)} className={inputCls+" pr-10"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
