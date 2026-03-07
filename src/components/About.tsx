import React from "react";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";
import { Sprout, Leaf, Droplets, Sun, Wind } from "lucide-react";

export default function About() {
  const { language } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  return (
    <div className="space-y-8">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute -bottom-32 left-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-500/30">
            <Sprout className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">
            {t.about_title}
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {t.about_desc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard 
          icon={<Leaf className="w-8 h-8 text-emerald-500" />}
          title={language === "ar" ? "نمو مستدام" : "Sustainable Growth"}
          desc={language === "ar" ? "بيئة مثالية تضمن أفضل إنتاجية للنباتات." : "Perfect environment ensuring optimal plant yield."}
        />
        <FeatureCard 
          icon={<Droplets className="w-8 h-8 text-blue-500" />}
          title={language === "ar" ? "توفير الموارد" : "Resource Efficiency"}
          desc={language === "ar" ? "استهلاك ذكي للمياه والطاقة لتقليل الهدر." : "Smart water and energy consumption to reduce waste."}
        />
        <FeatureCard 
          icon={<Sun className="w-8 h-8 text-amber-500" />}
          title={language === "ar" ? "تحكم ذكي" : "Smart Control"}
          desc={language === "ar" ? "أتمتة كاملة لجميع الأجهزة والمستشعرات." : "Full automation of all devices and sensors."}
        />
        <FeatureCard 
          icon={<Wind className="w-8 h-8 text-teal-500" />}
          title={language === "ar" ? "مراقبة دقيقة" : "Precise Monitoring"}
          desc={language === "ar" ? "بيانات حية ومباشرة لحالة الصوبة على مدار الساعة." : "Live, real-time data on greenhouse status 24/7."}
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );
}
