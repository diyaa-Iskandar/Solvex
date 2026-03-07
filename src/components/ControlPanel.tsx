import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Power,
  Sliders,
  Waves,
  Sprout,
  Wind,
  ThermometerSun,
  Lightbulb,
} from "lucide-react";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";

interface DeviceState {
  id: string;
  pump_on: boolean;
  valve_on: boolean;
  fan_on: boolean;
  heater_on: boolean;
  light_on: boolean;
  system_mode: string;
}

export default function ControlPanel() {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useAppStore();
  const t = translations[language];
  const isRTL = language === "ar";

  useEffect(() => {
    fetchDeviceState();

    const subscription = supabase
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
      subscription.unsubscribe();
    };
  }, []);

  const fetchDeviceState = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("device_state")
      .select("*")
      .limit(1)
      .single();

    if (data) setDeviceState(data);
    setLoading(false);
  };

  const toggleMode = async () => {
    if (!deviceState) return;
    const newMode = deviceState.system_mode === "AUTO" ? "MANUAL" : "AUTO";

    setDeviceState({ ...deviceState, system_mode: newMode });

    await supabase
      .from("device_state")
      .update({ system_mode: newMode, updated_at: new Date().toISOString() })
      .eq("id", deviceState.id);
  };

  const toggleDevice = async (device: keyof DeviceState) => {
    if (!deviceState || deviceState.system_mode === "AUTO") return;

    const newValue = !deviceState[device];
    setDeviceState({ ...deviceState, [device]: newValue });

    await supabase
      .from("device_state")
      .update({ [device]: newValue, updated_at: new Date().toISOString() })
      .eq("id", deviceState.id);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );

  const isManual = deviceState?.system_mode === "MANUAL";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t.control_panel}
          </h2>
          <p className="text-sm sm:text-lg text-slate-700 dark:text-slate-300 mt-2">
            {t.control_desc}
          </p>
        </div>

        <button
          onClick={toggleMode}
          className={`relative inline-flex h-10 w-24 sm:h-12 sm:w-28 items-center rounded-full transition-colors focus:outline-none shadow-inner shrink-0 ${
            isManual ? "bg-amber-500" : "bg-emerald-500"
          }`}
        >
          <span className="sr-only">Toggle Mode</span>
          <span
            className={`inline-block h-8 w-8 sm:h-10 sm:w-10 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              isManual
                ? isRTL
                  ? "-translate-x-1 sm:-translate-x-1"
                  : "translate-x-15 sm:translate-x-17"
                : isRTL
                  ? "-translate-x-15 sm:-translate-x-17"
                  : "translate-x-1 sm:translate-x-1"
            }`}
          />
          <span
            className={`absolute text-xs sm:text-sm font-bold text-white ${isManual ? (isRTL ? "right-3" : "left-3") : isRTL ? "left-3" : "right-3"}`}
          >
            {isManual ? t.manual.split(" ")[0] : t.auto.split(" ")[0]}
          </span>
        </button>
      </div>

      {!isManual && (
        <div className="glass-panel bg-blue-500/10 border-blue-500/30 p-6 rounded-2xl text-blue-800 dark:text-blue-200 font-medium text-lg flex items-center gap-4">
          <div className="p-2 bg-blue-500/20 rounded-full">
            <Sliders className="w-6 h-6" />
          </div>
          {t.auto_warning}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <ControlToggle
          title={t.pump}
          description={t.pump_desc}
          isOn={deviceState?.pump_on || false}
          disabled={!isManual}
          onToggle={() => toggleDevice("pump_on")}
          icon={<Waves className="w-7 h-7" />}
          isRTL={isRTL}
        />
        <ControlToggle
          title={t.valve}
          description={t.valve_desc}
          isOn={deviceState?.valve_on || false}
          disabled={!isManual}
          onToggle={() => toggleDevice("valve_on")}
          icon={<Sprout className="w-7 h-7" />}
          isRTL={isRTL}
        />
        <ControlToggle
          title={t.fan}
          description={t.fan_desc}
          isOn={deviceState?.fan_on || false}
          disabled={!isManual}
          onToggle={() => toggleDevice("fan_on")}
          icon={<Wind className="w-7 h-7" />}
          isRTL={isRTL}
        />
        <ControlToggle
          title={t.heater}
          description={t.heater_desc}
          isOn={deviceState?.heater_on || false}
          disabled={!isManual}
          onToggle={() => toggleDevice("heater_on")}
          icon={<ThermometerSun className="w-7 h-7" />}
          isRTL={isRTL}
        />
        <ControlToggle
          title={t.light}
          description={t.light_desc}
          isOn={deviceState?.light_on || false}
          disabled={!isManual}
          onToggle={() => toggleDevice("light_on")}
          icon={<Lightbulb className="w-7 h-7" />}
          isRTL={isRTL}
        />
      </div>
    </div>
  );
}

function ControlToggle({
  title,
  description,
  isOn,
  disabled,
  onToggle,
  icon,
  isRTL,
}: {
  title: string;
  description: string;
  isOn: boolean;
  disabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  isRTL: boolean;
}) {
  return (
    <div
      className={`glass-panel p-4 sm:p-6 rounded-3xl flex items-center justify-between transition-all duration-300 gap-3 sm:gap-4 ${disabled ? "opacity-60 grayscale-[0.5]" : "hover:-translate-y-1"}`}
    >
      <div
        className={`flex items-center space-x-3 sm:space-x-4 ${isRTL ? "space-x-reverse sm:space-x-reverse" : ""} min-w-0 flex-1`}
      >
        <div
          className={`p-3 sm:p-4 rounded-2xl transition-all duration-300 shrink-0 ${isOn ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500" : "bg-slate-50 dark:bg-slate-800/50 text-slate-400"}`}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: `w-6 h-6 sm:w-7 sm:h-7 ${((icon as React.ReactElement).props.className || '').replace(/\bw-\d+\b/g, '').replace(/\bh-\d+\b/g, '')}`
          })}
        </div>
        <div className="min-w-0 pr-2">
          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-8 w-14 sm:h-10 sm:w-16 items-center rounded-full transition-colors focus:outline-none shadow-inner shrink-0 ${
          isOn ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-6 w-6 sm:h-8 sm:w-8 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
            isOn
              ? isRTL
                ? "-translate-x-1 sm:-translate-x-1"
                : "translate-x-7 sm:translate-x-7"
              : isRTL
                ? "-translate-x-7 sm:-translate-x-7"
                : "translate-x-1 sm:translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
