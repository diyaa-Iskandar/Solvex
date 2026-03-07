import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  Waves,
  Sprout,
  ThermometerSun,
  Lightbulb,
} from "lucide-react";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";

interface TelemetryData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  water_level: boolean;
  created_at: string;
}

interface DeviceState {
  pump_on: boolean;
  valve_on: boolean;
  fan_on: boolean;
  heater_on: boolean;
  light_on: boolean;
  system_mode: string;
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  useEffect(() => {
    fetchLatestData();

    const telemetrySubscription = supabase
      .channel("telemetry_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry" },
        (payload) => {
          setTelemetry(payload.new as TelemetryData);
        },
      )
      .subscribe();

    const deviceStateSubscription = supabase
      .channel("device_state_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "device_state" },
        (payload) => {
          setDeviceState(payload.new as DeviceState);
        },
      )
      .subscribe();

    return () => {
      telemetrySubscription.unsubscribe();
      deviceStateSubscription.unsubscribe();
    };
  }, []);

  const fetchLatestData = async () => {
    setLoading(true);
    const { data: tData } = await supabase
      .from("telemetry")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (tData) setTelemetry(tData);

    const { data: dData } = await supabase
      .from("device_state")
      .select("*")
      .limit(1)
      .single();

    if (dData) setDeviceState(dData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
          {t.dashboard}
        </h2>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-300">
            {t.system_mode}
          </span>
          <span
            className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-inner border ${deviceState?.system_mode === "AUTO" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"}`}
          >
            {deviceState?.system_mode === "AUTO" ? t.auto : t.manual}
          </span>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <SensorCard
          title={t.temperature}
          value={telemetry ? `${telemetry.temperature.toFixed(1)}°C` : "--"}
          icon={<Thermometer className="w-10 h-10 text-orange-500" />}
          status={telemetry && telemetry.temperature > 35 ? "danger" : "normal"}
          isRTL={isRTL}
          t={t}
        />
        <SensorCard
          title={t.humidity}
          value={telemetry ? `${telemetry.humidity.toFixed(1)}%` : "--"}
          icon={<Droplets className="w-10 h-10 text-blue-500" />}
          isRTL={isRTL}
          t={t}
        />
        <SensorCard
          title={t.soil_moisture}
          value={telemetry ? `${telemetry.soil_moisture.toFixed(1)}%` : "--"}
          icon={<Wind className="w-10 h-10 text-emerald-500" />}
          status={
            telemetry && telemetry.soil_moisture < 30 ? "warning" : "normal"
          }
          isRTL={isRTL}
          t={t}
        />
        <SensorCard
          title={t.water_level}
          value={telemetry ? (telemetry.water_level ? t.full : t.empty) : "--"}
          icon={
            <AlertTriangle
              className={`w-10 h-10 ${telemetry && !telemetry.water_level ? "text-red-500" : "text-slate-400"}`}
            />
          }
          status={telemetry && !telemetry.water_level ? "danger" : "normal"}
          isRTL={isRTL}
          t={t}
        />
      </div>

      {/* Device Status */}
      <div className="glass-panel p-5 sm:p-8 rounded-3xl">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6">
          {t.device_status}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          <DeviceStatusCard
            title={t.pump}
            isOn={deviceState?.pump_on}
            icon={<Waves className="w-8 h-8" />}
            t={t}
          />
          <DeviceStatusCard
            title={t.valve}
            isOn={deviceState?.valve_on}
            icon={<Sprout className="w-8 h-8" />}
            t={t}
          />
          <DeviceStatusCard
            title={t.fan}
            isOn={deviceState?.fan_on}
            icon={<Wind className="w-8 h-8" />}
            t={t}
          />
          <DeviceStatusCard
            title={t.heater}
            isOn={deviceState?.heater_on}
            icon={<ThermometerSun className="w-8 h-8" />}
            t={t}
          />
          <DeviceStatusCard
            title={t.light}
            isOn={deviceState?.light_on}
            icon={<Lightbulb className="w-8 h-8" />}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

function SensorCard({
  title,
  value,
  icon,
  status = "normal",
  isRTL,
  t,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  status?: "normal" | "warning" | "danger";
  isRTL: boolean;
  t: any;
}) {
  const statusStyles = {
    normal: "",
    warning: "shadow-[0_10px_30px_-5px_rgba(251,191,36,0.3)] dark:shadow-[0_0_15px_rgba(251,191,36,0.2)]",
    danger: "shadow-[0_10px_30px_-5px_rgba(248,113,113,0.3)] dark:shadow-[0_0_15px_rgba(248,113,113,0.2)]",
  };

  return (
    <div
      className={`glass-panel p-4 sm:p-6 rounded-3xl flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 hover:-translate-y-1 ${statusStyles[status]}`}
    >
      <div className={`flex items-center gap-3 sm:gap-4 min-w-0 flex-1`}>
        <div className={`p-3 sm:p-4 rounded-2xl shrink-0 ${
          title === t.temperature ? "bg-[#FFEFE5] dark:bg-orange-500/20 text-[#FF8A4C]" :
          title === t.humidity ? "bg-[#E6F0FF] dark:bg-blue-500/20 text-[#4C8AFF]" :
          title === t.soil_moisture ? "bg-[#E5F7ED] dark:bg-emerald-500/20 text-[#00B85C]" :
          "bg-[#FFE5E5] dark:bg-red-500/20 text-[#FF4C4C]"
        }`}>
          {React.cloneElement(icon as React.ReactElement, {
            className: `w-6 h-6 sm:w-8 sm:h-8 ${((icon as React.ReactElement).props.className || '').replace(/\bw-\d+\b/g, '').replace(/\bh-\d+\b/g, '').replace(/text-\w+-\d+/g, '')}`
          })}
        </div>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-300 font-bold truncate">
          {title}
        </p>
      </div>
      <p
        className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight shrink-0"
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

function DeviceStatusCard({
  title,
  isOn,
  icon,
  t,
}: {
  title: string;
  isOn?: boolean;
  icon: React.ReactNode;
  t: any;
}) {
  return (
    <div
      className={`p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center space-y-3 sm:space-y-4 transition-all duration-300 ${isOn ? "bg-emerald-500 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.6)] text-white" : "bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] text-slate-800 dark:bg-black/20 dark:text-white dark:border dark:border-white/10"}`}
    >
      <div
        className={`p-3 sm:p-4 rounded-full transition-all duration-300 ${isOn ? "bg-white/20 text-white" : "bg-slate-50 dark:bg-slate-800/50 text-slate-400"}`}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-6 h-6 sm:w-8 sm:h-8 ${((icon as React.ReactElement).props.className || '').replace(/\bw-\d+\b/g, '').replace(/\bh-\d+\b/g, '')}`
        })}
      </div>
      <span className={`font-bold text-sm sm:text-lg text-center line-clamp-1 w-full px-1 ${isOn ? "text-white" : "text-slate-900 dark:text-white"}`}>
        {title}
      </span>
      <span
        className={`text-xs sm:text-sm font-black px-3 py-1 sm:px-4 sm:py-1.5 rounded-full ${isOn ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
      >
        {isOn ? t.on : t.off}
      </span>
    </div>
  );
}
