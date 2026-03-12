import { Award, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "./GlassCard";

const ACCURACY_HISTORY = [
  { day: "Jan 11", accuracy: 71 },
  { day: "Jan 12", accuracy: 68 },
  { day: "Jan 13", accuracy: 74 },
  { day: "Jan 14", accuracy: 77 },
  { day: "Jan 15", accuracy: 72 },
  { day: "Jan 16", accuracy: 69 },
  { day: "Jan 17", accuracy: 75 },
  { day: "Jan 18", accuracy: 80 },
  { day: "Jan 19", accuracy: 78 },
  { day: "Jan 20", accuracy: 73 },
  { day: "Jan 21", accuracy: 76 },
  { day: "Jan 22", accuracy: 82 },
  { day: "Jan 23", accuracy: 79 },
  { day: "Jan 24", accuracy: 70 },
  { day: "Jan 25", accuracy: 66 },
  { day: "Jan 26", accuracy: 72 },
  { day: "Jan 27", accuracy: 75 },
  { day: "Jan 28", accuracy: 81 },
  { day: "Jan 29", accuracy: 84 },
  { day: "Jan 30", accuracy: 77 },
  { day: "Feb 01", accuracy: 73 },
  { day: "Feb 02", accuracy: 76 },
  { day: "Feb 03", accuracy: 70 },
  { day: "Feb 04", accuracy: 79 },
  { day: "Feb 05", accuracy: 83 },
  { day: "Feb 06", accuracy: 80 },
  { day: "Feb 07", accuracy: 74 },
  { day: "Feb 08", accuracy: 71 },
  { day: "Feb 09", accuracy: 77 },
  { day: "Feb 10", accuracy: 73 },
];

const CATEGORY_ACCURACY = [
  { category: "Large Cap", accuracy: 78, color: "#00D4FF" },
  { category: "Mid Cap", accuracy: 71, color: "#8B5CF6" },
  { category: "Small Cap", accuracy: 64, color: "#FFD700" },
  { category: "Meme Coins", accuracy: 58, color: "#FF4444" },
];

const STATS = [
  { label: "Overall Accuracy", value: "73%", icon: Target, color: "#00D4FF" },
  { label: "7-Day Streak", value: "5 / 7", icon: TrendingUp, color: "#00FF94" },
  { label: "Best Token", value: "ETH 89%", icon: Award, color: "#8B5CF6" },
];

export function AccuracyTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">
          AI Prediction Track Record
        </h2>
        <p className="text-white/40 text-sm">
          30-day historical accuracy of AI price predictions
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${stat.color}20`,
                  border: `1px solid ${stat.color}30`,
                }}
              >
                <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Line chart — 30-day accuracy */}
      <GlassCard className="p-6" neon="blue">
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
          30-Day Prediction Accuracy
        </h3>
        <div data-ocid="accuracy.chart_point" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={ACCURACY_HISTORY}
              margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[55, 90]}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,26,0.9)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value}%`, "Accuracy"]}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#00D4FF"
                strokeWidth={2}
                dot={{ fill: "#00D4FF", r: 3 }}
                activeDot={{
                  r: 5,
                  fill: "#00D4FF",
                  stroke: "rgba(0,212,255,0.4)",
                  strokeWidth: 4,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Bar chart — by category */}
      <GlassCard className="p-6" neon="purple">
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
          Accuracy by Category
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={CATEGORY_ACCURACY}
              margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="category"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,26,0.9)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value}%`, "Accuracy"]}
              />
              <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                {CATEGORY_ACCURACY.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {CATEGORY_ACCURACY.map((cat) => (
            <div key={cat.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: cat.color }}
              />
              <span className="text-xs text-white/50">
                {cat.category}:{" "}
                <span style={{ color: cat.color }}>{cat.accuracy}%</span>
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Disclaimer */}
      <div className="text-center text-xs text-white/30 py-2">
        Accuracy metrics are simulated for demonstration purposes. Past
        performance does not guarantee future results.
      </div>
    </div>
  );
}
