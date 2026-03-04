import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";
import { X, Lock, LogIn } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { language, setAdmin } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("password")
        .eq("id", 1)
        .single();

      if (error) throw error;

      if (data && data.password === password) {
        setAdmin(true);
        onClose();
      } else {
        setError(t.incorrect_password);
      }
    } catch (err) {
      console.error(err);
      setError(t.incorrect_password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">
            {t.admin_login}
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
              {t.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/20 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>{t.login}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
