import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useAppStore } from "../store";
import { translations } from "../locales/translations";

interface TelemetryData {
  created_at: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
}

export default function Charts() {
  const [data, setData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const { language } = useAppStore();
  const t = translations[language];

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    let timeAgo = new Date();
    if (timeRange === "1h") timeAgo.setHours(timeAgo.getHours() - 1);
    else if (timeRange === "24h") timeAgo.setHours(timeAgo.getHours() - 24);
    else if (timeRange === "7d") timeAgo.setDate(timeAgo.getDate() - 7);

    const { data: tData } = await supabase
      .from("telemetry")
      .select("created_at, temperature, humidity, soil_moisture")
      .gte("created_at", timeAgo.toISOString())
      .order("created_at", { ascending: true });

    if (tData) {
      let processedData = tData;
      if (tData.length > 100) {
        const step = Math.ceil(tData.length / 100);
        processedData = tData.filter((_, i) => i % step === 0);
      }
      setData(processedData);
    }
    setLoading(false);
  };

  const formatXAxis = (tickItem: string) => {
    const date = parseISO(tickItem);
    if (timeRange === "1h" || timeRange === "24h") return format(date, "HH:mm");
    return format(date, "MM/dd");
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
          {t.history_charts}
        </h2>
        <div className="flex flex-wrap bg-white/20 dark:bg-black/20 p-1.5 rounded-xl backdrop-blur-md w-full sm:w-auto justify-center">
          {["1h", "24h", "7d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${timeRange === range ? "bg-white dark:bg-slate-800 shadow-md text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:bg-white/10"}`}
            >
              {range === "1h"
                ? t.last_1h
                : range === "24h"
                  ? t.last_24h
                  : t.last_7d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center glass-panel rounded-3xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-96 flex items-center justify-center glass-panel rounded-3xl text-xl font-bold text-slate-500">
          {t.no_data}
        </div>
      ) : (
        <div className="space-y-8">
          <ChartCard
            title={`${t.temperature} & ${t.humidity}`}
            data={data}
            formatXAxis={formatXAxis}
            lines={[
              { key: "temperature", name: t.temperature, color: "#f97316" },
              { key: "humidity", name: t.humidity, color: "#3b82f6" },
            ]}
          />
          <ChartCard
            title={t.soil_moisture}
            data={data}
            formatXAxis={formatXAxis}
            lines={[
              { key: "soil_moisture", name: t.soil_moisture, color: "#10b981" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  data,
  formatXAxis,
  lines,
}: {
  title: string;
  data: any[];
  formatXAxis: (tick: string) => string;
  lines: { key: string; name: string; color: string }[];
}) {
  return (
    <div className="glass-panel p-8 rounded-3xl">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8">
        {title}
      </h3>
      <div className="h-80" dir="ltr">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(150,150,150,0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="created_at"
              tickFormatter={formatXAxis}
              stroke="#94a3b8"
              fontSize={12}
              tickMargin={15}
            />
            <YAxis stroke="#94a3b8" fontSize={12} tickMargin={15} />
            <Tooltip
              labelFormatter={(label) =>
                format(parseISO(label as string), "yyyy/MM/dd HH:mm")
              }
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(10px)",
                color: "#1e293b",
                fontWeight: "bold",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
