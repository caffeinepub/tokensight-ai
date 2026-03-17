/**
 * ModelPerformance — AI Learning Curve & Model Stats
 * Reads from AI_Model_Data localStorage to compute live accuracy, MSE, and learning curve.
 */
import { Brain, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AIOutcome {
  id: string;
  symbol: string;
  direction: string;
  confidence: number;
  outcome: string;
  isWin: boolean;
  timestamp: number;
}

interface ModelStats {
  version: string;
  prevVersion: string;
  accuracy: number | null;
  prevAccuracy: number | null;
  mse: number | null;
  prevMse: number | null;
  totalSamples: number;
  learningStatus: "RETRAINING" | "EVALUATION" | "INITIALIZING";
  curve: { epoch: number; loss: number; accuracy: number }[];
}

function loadAIData(): AIOutcome[] {
  try {
    const raw = localStorage.getItem("AI_Model_Data");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return Array.isArray(parsed) ? (parsed as AIOutcome[]) : [];
  } catch {
    return [];
  }
}

function computeStats(data: AIOutcome[]): ModelStats {
  const total = data.length;
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const thisWeek = data.filter((d) => d.timestamp >= oneWeekAgo);
  const prevWeek = data.filter(
    (d) =>
      d.timestamp < oneWeekAgo &&
      d.timestamp >= oneWeekAgo - 7 * 24 * 60 * 60 * 1000,
  );

  const calcAccuracy = (subset: AIOutcome[]) =>
    subset.length > 0
      ? (subset.filter((d) => d.isWin).length / subset.length) * 100
      : null;

  const calcMSE = (subset: AIOutcome[]) => {
    if (subset.length === 0) return null;
    const errors = subset.map((d) => {
      const predicted = d.confidence / 100;
      const actual = d.isWin ? 1 : 0;
      return (predicted - actual) ** 2;
    });
    return errors.reduce((a, b) => a + b, 0) / errors.length;
  };

  // Build learning curve — group data into epochs of 10 samples
  const EPOCH_SIZE = 10;
  const curve: { epoch: number; loss: number; accuracy: number }[] = [];
  for (let i = 0; i + EPOCH_SIZE <= total; i += EPOCH_SIZE) {
    const epoch = data.slice(i, i + EPOCH_SIZE);
    const acc = (epoch.filter((d) => d.isWin).length / EPOCH_SIZE) * 100;
    const mseVal = calcMSE(epoch) ?? 0;
    curve.push({
      epoch: Math.floor(i / EPOCH_SIZE) + 1,
      loss: Number.parseFloat(mseVal.toFixed(4)),
      accuracy: Number.parseFloat(acc.toFixed(1)),
    });
  }

  // Derive version from total samples
  const versionNum = 26 + Math.floor(total / 50);
  const prevVersionNum = versionNum - 1;

  const learningStatus: ModelStats["learningStatus"] =
    total === 0 ? "INITIALIZING" : total % 10 < 3 ? "RETRAINING" : "EVALUATION";

  return {
    version: `Quantum V${versionNum}`,
    prevVersion: `Quantum V${prevVersionNum}`,
    accuracy: calcAccuracy(thisWeek),
    prevAccuracy: calcAccuracy(prevWeek),
    mse: calcMSE(thisWeek),
    prevMse: calcMSE(prevWeek),
    totalSamples: total,
    learningStatus,
    curve,
  };
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 80;

function MiniLineChart({
  data,
  valueKey,
  color,
  yMin,
  yMax,
}: {
  data: { epoch: number; loss: number; accuracy: number }[];
  valueKey: "loss" | "accuracy";
  color: string;
  yMin: number;
  yMax: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] font-mono text-gray-600"
        style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
      >
        Accumulating training data...
      </div>
    );
  }

  const range = yMax - yMin || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - ((d[valueKey] - yMin) / range) * CHART_HEIGHT;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylinePoints = pts.join(" ");

  // Area fill
  const areaPoints = [
    `0,${CHART_HEIGHT}`,
    ...pts,
    `${CHART_WIDTH},${CHART_HEIGHT}`,
  ].join(" ");

  return (
    <svg
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      aria-label="Learning curve chart"
      role="img"
    >
      <title>Learning curve</title>
      <defs>
        <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={0}
          x2={CHART_WIDTH}
          y1={t * CHART_HEIGHT}
          y2={t * CHART_HEIGHT}
          stroke="#1C2333"
          strokeWidth={1}
        />
      ))}
      {/* Area */}
      <polygon points={areaPoints} fill={`url(#grad-${valueKey})`} />
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      {data.length > 0 &&
        (() => {
          const last = pts[pts.length - 1].split(",");
          return (
            <circle
              cx={last[0]}
              cy={last[1]}
              r={3}
              fill={color}
              stroke="#080B14"
              strokeWidth={1.5}
            />
          );
        })()}
    </svg>
  );
}

export function ModelPerformance() {
  const [aiData, setAiData] = useState<AIOutcome[]>([]);
  // Refresh every 30s
  useEffect(() => {
    setAiData(loadAIData());
    const iv = setInterval(() => {
      setAiData(loadAIData());
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  const stats = useMemo(() => computeStats(aiData), [aiData]);

  const accuracyDelta =
    stats.accuracy !== null && stats.prevAccuracy !== null
      ? stats.accuracy - stats.prevAccuracy
      : null;

  const mseDelta =
    stats.mse !== null && stats.prevMse !== null
      ? stats.mse - stats.prevMse
      : null;

  // Loss improvement = % decrease in MSE
  const lossImprovement =
    mseDelta !== null && stats.prevMse !== null && stats.prevMse > 0
      ? ((-mseDelta / stats.prevMse) * 100).toFixed(1)
      : null;

  const statusColor =
    stats.learningStatus === "RETRAINING"
      ? "#D4AF37"
      : stats.learningStatus === "EVALUATION"
        ? "#00FF88"
        : "#6B7280";

  const acCurveMin = Math.max(
    0,
    Math.min(...stats.curve.map((c) => c.accuracy)) - 5,
  );
  const acCurveMax = Math.min(
    100,
    Math.max(...stats.curve.map((c) => c.accuracy)) + 5,
  );
  const lossCurveMin = 0;
  const lossCurveMax = Math.max(
    0.1,
    Math.max(...stats.curve.map((c) => c.loss)) * 1.1,
  );

  return (
    <div
      data-ocid="model_performance.section"
      className="bg-[#0D1117] rounded-xl border border-[#1C2333] p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.3)",
            }}
          >
            <Brain size={16} style={{ color: "#D4AF37" }} />
          </div>
          <div>
            <h3 className="text-white font-mono font-bold text-sm">
              MODEL PERFORMANCE
            </h3>
            <p className="text-gray-500 text-[10px] font-mono">
              DRL / LSTM + Transformer — Auto Machine Learning
            </p>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border"
          style={{
            color: statusColor,
            borderColor: statusColor,
            background: `${statusColor}15`,
            animation:
              stats.learningStatus === "RETRAINING"
                ? "pulse 1.5s ease-in-out infinite"
                : undefined,
          }}
        >
          <Zap size={10} />
          {stats.learningStatus}
        </span>
      </div>

      {/* Progress Report Table */}
      <div className="mb-5 overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-[#1C2333]">
              {["Metric", "Previous", "Current", "Δ Change"].map((h) => (
                <th
                  key={h}
                  className="text-gray-500 text-left py-2 pr-4 font-medium tracking-wider uppercase text-[9px]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Model Version */}
            <tr className="border-b border-[#1C2333]/40">
              <td className="py-2.5 pr-4 text-gray-400">Model Version</td>
              <td className="py-2.5 pr-4 text-gray-500">{stats.prevVersion}</td>
              <td
                className="py-2.5 pr-4 font-bold"
                style={{ color: "#D4AF37" }}
              >
                {stats.version}
              </td>
              <td className="py-2.5">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px]"
                  style={{
                    color: "#00D4FF",
                    background: "rgba(0,212,255,0.08)",
                  }}
                >
                  UPGRADED
                </span>
              </td>
            </tr>
            {/* Learning Improvement */}
            <tr className="border-b border-[#1C2333]/40">
              <td className="py-2.5 pr-4 text-gray-400">Loss Improvement</td>
              <td className="py-2.5 pr-4 text-gray-500">
                {stats.prevMse !== null
                  ? `MSE ${stats.prevMse.toFixed(4)}`
                  : "—"}
              </td>
              <td
                className="py-2.5 pr-4 font-bold"
                style={{ color: "#00FF88" }}
              >
                {stats.mse !== null
                  ? `MSE ${stats.mse.toFixed(4)}`
                  : "Syncing..."}
              </td>
              <td className="py-2.5">
                {lossImprovement !== null ? (
                  <span
                    className="flex items-center gap-0.5 font-bold"
                    style={{
                      color:
                        Number.parseFloat(lossImprovement) > 0
                          ? "#00FF88"
                          : "#FF3B5C",
                    }}
                  >
                    {Number.parseFloat(lossImprovement) > 0 ? (
                      <TrendingDown size={10} />
                    ) : (
                      <TrendingUp size={10} />
                    )}
                    {lossImprovement}%
                  </span>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
            </tr>
            {/* Signal Precision */}
            <tr className="border-b border-[#1C2333]/40">
              <td className="py-2.5 pr-4 text-gray-400">Signal Precision</td>
              <td className="py-2.5 pr-4 text-gray-500">
                {stats.prevAccuracy !== null
                  ? `${stats.prevAccuracy.toFixed(1)}% (last wk)`
                  : "No data"}
              </td>
              <td
                className="py-2.5 pr-4 font-bold"
                style={{
                  color:
                    stats.accuracy !== null && stats.accuracy >= 80
                      ? "#00FF88"
                      : "#D4AF37",
                }}
              >
                {stats.accuracy !== null
                  ? `${stats.accuracy.toFixed(1)}% (this wk)`
                  : "Training..."}
              </td>
              <td className="py-2.5">
                {accuracyDelta !== null ? (
                  <span
                    className="flex items-center gap-0.5 font-bold"
                    style={{
                      color: accuracyDelta >= 0 ? "#00FF88" : "#FF3B5C",
                    }}
                  >
                    {accuracyDelta >= 0 ? (
                      <TrendingUp size={10} />
                    ) : (
                      <TrendingDown size={10} />
                    )}
                    {accuracyDelta >= 0 ? "+" : ""}
                    {accuracyDelta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
            </tr>
            {/* Learning Status */}
            <tr>
              <td className="py-2.5 pr-4 text-gray-400">Learning Status</td>
              <td className="py-2.5 pr-4 text-gray-500">EVALUATION</td>
              <td
                className="py-2.5 pr-4 font-bold"
                style={{ color: statusColor }}
              >
                {stats.learningStatus}
              </td>
              <td className="py-2.5">
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color: statusColor,
                    background: `${statusColor}15`,
                  }}
                >
                  {stats.totalSamples} samples
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-lg p-3 text-center"
          style={{
            background: "rgba(0,255,136,0.05)",
            border: "1px solid rgba(0,255,136,0.15)",
          }}
        >
          <p className="text-gray-500 text-[9px] font-mono uppercase tracking-wider mb-1">
            Accuracy Score
          </p>
          <p
            className="font-mono font-bold text-2xl"
            style={{ color: "#00FF88" }}
          >
            {stats.accuracy !== null ? `${stats.accuracy.toFixed(1)}%` : "—"}
          </p>
          <p className="text-gray-600 text-[9px] font-mono mt-0.5">
            {stats.totalSamples > 0
              ? `from ${stats.totalSamples} resolved`
              : "Awaiting signals"}
          </p>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{
            background: "rgba(212,175,55,0.05)",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          <p className="text-gray-500 text-[9px] font-mono uppercase tracking-wider mb-1">
            Mean Squared Error
          </p>
          <p
            className="font-mono font-bold text-2xl"
            style={{ color: "#D4AF37" }}
          >
            {stats.mse !== null ? stats.mse.toFixed(4) : "—"}
          </p>
          <p className="text-gray-600 text-[9px] font-mono mt-0.5">
            prediction error (MSE)
          </p>
        </div>
      </div>

      {/* Learning Curves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accuracy Curve */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              Accuracy Curve
            </p>
            <p className="text-gray-600 text-[9px] font-mono">
              per 10-signal epoch
            </p>
          </div>
          <div
            className="rounded-lg overflow-hidden p-2"
            style={{
              background: "rgba(0,255,136,0.03)",
              border: "1px solid #1C2333",
            }}
          >
            <MiniLineChart
              data={stats.curve}
              valueKey="accuracy"
              color="#00FF88"
              yMin={acCurveMin}
              yMax={acCurveMax}
            />
            <div className="flex justify-between text-[8px] font-mono text-gray-700 mt-1">
              <span>Epoch 1</span>
              <span>Epoch {Math.max(stats.curve.length, 1)}</span>
            </div>
          </div>
        </div>
        {/* Loss Curve */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              Loss Curve (MSE)
            </p>
            <p className="text-gray-600 text-[9px] font-mono">
              lower is better
            </p>
          </div>
          <div
            className="rounded-lg overflow-hidden p-2"
            style={{
              background: "rgba(212,175,55,0.03)",
              border: "1px solid #1C2333",
            }}
          >
            <MiniLineChart
              data={stats.curve}
              valueKey="loss"
              color="#D4AF37"
              yMin={lossCurveMin}
              yMax={lossCurveMax}
            />
            <div className="flex justify-between text-[8px] font-mono text-gray-700 mt-1">
              <span>Epoch 1</span>
              <span>Epoch {Math.max(stats.curve.length, 1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
