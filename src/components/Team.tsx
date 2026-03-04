import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users, Plus, Trash2, X, Upload } from "lucide-react";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";
import AdminLoginModal from "./AdminLoginModal";

interface TeamMember {
  id: string;
  name_ar: string;
  name_en: string;
  role_ar: string;
  role_en: string;
  image_url: string;
}

const initialFormData = {
  name_ar: "",
  name_en: "",
  role_ar: "",
  role_en: "",
  image_url: "",
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const { language, isAdmin } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchMembers();
    const sub = supabase
      .channel("team")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        fetchMembers,
      )
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at");
    if (data) setMembers(data);
    setLoading(false);
  };

  const deleteMember = async (id: string) => {
    if (!isAdmin) {
      setShowAdminModal(true);
      return;
    }
    await supabase.from("team_members").delete().eq("id", id);
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
    await supabase.from("team_members").insert([formData]);
    setShowForm(false);
    setFormData(initialFormData);
  };

  const handleAddClick = () => {
    if (!isAdmin) {
      setShowAdminModal(true);
      return;
    }
    setShowForm(!showForm);
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
          {t.team}
        </h2>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/30 w-full sm:w-auto"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showForm ? t.cancel : t.add_member}</span>
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
                {t.member_name} (AR)
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
                {t.member_name} (EN)
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
                {t.member_role} (AR)
              </label>
              <input
                required
                type="text"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.role_ar}
                onChange={(e) =>
                  setFormData({ ...formData, role_ar: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {t.member_role} (EN)
              </label>
              <input
                required
                type="text"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                value={formData.role_en}
                onChange={(e) =>
                  setFormData({ ...formData, role_en: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {members.map((member) => (
          <div
            key={member.id}
            className="glass-panel rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 flex flex-col items-center p-8 relative group"
          >
            {isAdmin && (
              <button
                onClick={() => deleteMember(member.id)}
                className="absolute top-4 right-4 p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-emerald-500/30 shadow-xl">
              {member.image_url ? (
                <img
                  src={member.image_url}
                  alt={member.name_en}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <Users className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white text-center mb-2">
              {isRTL ? member.name_ar : member.name_en}
            </h3>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-center text-sm px-4 py-1.5 bg-emerald-500/10 rounded-full">
              {isRTL ? member.role_ar : member.role_en}
            </p>
          </div>
        ))}

        {members.length === 0 && !showForm && (
          <div className="col-span-full glass-panel p-12 rounded-3xl text-center text-slate-500 font-bold text-lg">
            {t.no_team}
          </div>
        )}
      </div>
    </div>
  );
}
