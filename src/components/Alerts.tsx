import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";

interface Alert {
  id: string;
  created_at: string;
  type: string;
  message_ar: string;
  message_en: string;
  resolved: boolean;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  useEffect(() => {
    fetchAlerts();
    const sub = supabase
      .channel("alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        fetchAlerts,
      )
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAlerts(data);
    setLoading(false);
  };

  const resolveAlert = async (id: string) => {
    await supabase.from("alerts").update({ resolved: true }).eq("id", id);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
          {t.alerts_log}
        </h2>
        <div className="flex items-center justify-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 w-full sm:w-auto">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-bold text-red-600 dark:text-red-400">
            {t.unresolved} ({alerts.filter((a) => !a.resolved).length})
          </span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center">
          <div className="p-6 bg-emerald-500/20 rounded-full mb-6">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-3">
            {t.system_stable}
          </h3>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            {t.no_alerts}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <ul className="divide-y divide-white/10">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`p-4 sm:p-6 transition-all hover:bg-white/5 dark:hover:bg-black/10 ${!alert.resolved ? "bg-red-500/5" : ""}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                  <div
                    className={`flex items-start gap-3 sm:gap-5 ${isRTL ? "flex-row-reverse text-right" : ""} w-full`}
                  >
                    <div
                      className={`p-3 sm:p-4 rounded-2xl shadow-inner shrink-0 ${!alert.resolved ? "bg-red-500/20 text-red-500" : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-500"}`}
                    >
                      {alert.type === "CRITICAL" ? (
                        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                      ) : (
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-base sm:text-xl font-bold mb-1 sm:mb-2 line-clamp-2 ${!alert.resolved ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}
                      >
                        {isRTL ? alert.message_ar : alert.message_en}
                      </p>
                      <div
                        className={`flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <span className="flex items-center gap-1 bg-white/20 dark:bg-black/20 px-2 sm:px-3 py-1 rounded-lg">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
                          {format(
                            parseISO(alert.created_at),
                            "yyyy/MM/dd HH:mm",
                          )}
                        </span>
                        <span className="px-2 sm:px-3 py-1 rounded-lg bg-white/20 dark:bg-black/20 uppercase tracking-wider">
                          {alert.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="shrink-0 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 text-sm sm:text-base"
                    >
                      {t.mark_resolved}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
