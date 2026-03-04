import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Sprout,
  Thermometer,
  Droplets,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Edit2,
  Upload,
} from "lucide-react";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";
import AdminLoginModal from "./AdminLoginModal";

interface CropProfile {
  id: string;
  name_ar: string;
  name_en: string;
  min_temp: number;
  max_temp: number;
  min_moisture: number;
  max_moisture: number;
  irrigation_duration_sec: number;
  image_url: string;
}

const initialFormData = {
  name_ar: "",
  name_en: "",
  min_temp: 20,
  max_temp: 30,
  min_moisture: 40,
  max_moisture: 80,
  irrigation_duration_sec: 300,
  image_url: "",
};

export default function CropManagement() {
  const [profiles, setProfiles] = useState<CropProfile[]>([]);
  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const { language, isAdmin } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchProfilesAndActive();

    const sub1 = supabase
      .channel("crops")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crop_profiles" },
        fetchProfilesAndActive,
      )
      .subscribe();
    const sub2 = supabase
      .channel("device")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "device_state" },
        fetchProfilesAndActive,
      )
      .subscribe();

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, []);

  const fetchProfilesAndActive = async () => {
    setLoading(true);
    const { data: crops } = await supabase
      .from("crop_profiles")
      .select("*")
      .order("created_at");
    if (crops) setProfiles(crops);

    const { data: device } = await supabase
      .from("device_state")
      .select("active_crop_id")
      .limit(1)
      .single();
    if (device) setActiveCropId(device.active_crop_id);
    setLoading(false);
  };

  const activateProfile = async (id: string) => {
    await supabase
      .from("device_state")
      .update({ active_crop_id: id })
      .neq("id", "00000000-0000-0000-0000-000000000000");
  };

  const deleteProfile = async (id: string) => {
    if (!isAdmin) {
      setShowAdminModal(true);
      return;
    }
    if (id === activeCropId) return alert("لا يمكن حذف المحصول النشط");
    await supabase.from("crop_profiles").delete().eq("id", id);
  };

  const handleEdit = (profile: CropProfile) => {
    if (!isAdmin) {
      setShowAdminModal(true);
      return;
    }
    setFormData({
      name_ar: profile.name_ar,
      name_en: profile.name_en,
      min_temp: profile.min_temp,
      max_temp: profile.max_temp,
      min_moisture: profile.min_moisture,
      max_moisture: profile.max_moisture,
      irrigation_duration_sec: profile.irrigation_duration_sec,
      image_url: profile.image_url,
    });
    setEditingId(profile.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      alert("Error uploading image");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    setFormData({ ...formData, image_url: data.publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setShowAdminModal(true);
      return;
    }

    if (editingId) {
      await supabase
        .from("crop_profiles")
        .update(formData)
        .eq("id", editingId);
    } else {
      await supabase.from("crop_profiles").insert([formData]);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleAddClick = () => {
    if (!isAdmin) {
      setShowAdminModal(true);
      return;
    }
    if (showForm) {
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
    } else {
      setShowForm(true);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  return (
    <div className="space-y-8">
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.crops}
        </h2>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/30 w-full sm:w-auto"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showForm ? t.cancel : t.add_crop}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-8 rounded-3xl space-y-6 animate-in fade-in slide-in-from-top-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.crop_name} (AR)
              </label>
              <input
                required
                type="text"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.crop_name} (EN)
              </label>
              <input
                required
                type="text"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.temp_range} Min (°C)
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.min_temp}
                onChange={(e) =>
                  setFormData({ ...formData, min_temp: +e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.temp_range} Max (°C)
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.max_temp}
                onChange={(e) =>
                  setFormData({ ...formData, max_temp: +e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.moisture_range} Min (%)
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.min_moisture}
                onChange={(e) =>
                  setFormData({ ...formData, min_moisture: +e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.moisture_range} Max (%)
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.max_moisture}
                onChange={(e) =>
                  setFormData({ ...formData, max_moisture: +e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.irrigation_duration} ({t.seconds})
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.irrigation_duration_sec}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    irrigation_duration_sec: +e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.upload_image}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-black/60 transition-colors text-slate-800 dark:text-white">
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">
                    {uploading ? t.loading : t.upload_image}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-white/20"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {t.save}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profiles.map((profile) => {
          const isActive = profile.id === activeCropId;
          return (
            <div
              key={profile.id}
              className={`glass-panel rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${isActive ? "ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : ""}`}
            >
              <div className="h-48 w-full relative bg-slate-200 dark:bg-slate-800">
                {profile.image_url ? (
                  <img
                    src={profile.image_url}
                    alt={profile.name_en}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sprout className="w-16 h-16 text-slate-400 opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <h3 className="text-2xl font-black text-white">
                    {isRTL ? profile.name_ar : profile.name_en}
                  </h3>
                </div>
                {isActive && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <CheckCircle2 className="w-4 h-4" /> {t.active_now}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Thermometer className="w-5 h-5" /> {t.temp_range}
                  </div>
                  <span
                    className="text-slate-800 dark:text-white bg-slate-100 dark:bg-black/30 px-3 py-1 rounded-lg"
                    dir="ltr"
                  >
                    {profile.min_temp}° - {profile.max_temp}°
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Droplets className="w-5 h-5" /> {t.moisture_range}
                  </div>
                  <span
                    className="text-slate-800 dark:text-white bg-slate-100 dark:bg-black/30 px-3 py-1 rounded-lg"
                    dir="ltr"
                  >
                    {profile.min_moisture}% - {profile.max_moisture}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-5 h-5" /> {t.irrigation_duration}
                  </div>
                  <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-black/30 px-3 py-1 rounded-lg">
                    {profile.irrigation_duration_sec}s
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-white/10 flex gap-2">
                <button
                  onClick={() => activateProfile(profile.id)}
                  disabled={isActive}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default" : "bg-slate-100 dark:bg-white/10 hover:bg-emerald-500 hover:text-white text-slate-800 dark:text-white"}`}
                >
                  {isActive ? t.activated : t.activate_crop}
                </button>
                <button
                  onClick={() => handleEdit(profile)}
                  className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                {!isActive && (
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
