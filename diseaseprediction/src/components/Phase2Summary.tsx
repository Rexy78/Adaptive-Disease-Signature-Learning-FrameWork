import React from 'react';
import { DatasetSummary, RawRow } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ShieldCheck, Heart, Activity, User, Scale, AlertTriangle, Lock } from 'lucide-react';

interface Phase2SummaryProps {
  summary: DatasetSummary;
  datasetName: string;
}

const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

const DISEASE_COLORS: Record<string, string> = {
  Healthy: '#6366f1',
  'Healthy / Normal (0)': '#6366f1',
  Diabetes: '#22c55e',
  'Disease / Positive (1)': '#ef4444',
  'Heart Disease': '#f59e0b',
  CKD: '#ef4444',
  Other: '#94a3b8',
};

export const Phase2Summary: React.FC<Phase2SummaryProps> = ({ summary, datasetName }) => {
  const chartData = Object.entries(summary.diseaseDistribution).map(([name, count]) => {
    const numCount = Number(count);
    return {
      name,
      count: numCount,
      percentage: summary.totalRows > 0 ? Math.round((numCount / summary.totalRows) * 100) : 0,
    };
  });

  const missingColList = (Object.entries(summary.missingPerColumn) as [string, number][])
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Read-only notice */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded uppercase">
                PHASE 2
              </span>
              <h2 className="text-base font-bold">Dataset Summary Engine (Read-Only)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Structural inspection of <span className="font-mono text-indigo-300">{datasetName}</span>. No manual editing allowed.
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-2 bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-indigo-200">Quality Index: {summary.qualityScore}/100</span>
        </div>
      </div>

      {/* Main Bento Grid metrics */}
      <div className="grid grid-cols-12 gap-4">
        {/* Total Samples */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Samples</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{summary.totalRows.toLocaleString()}</span>
            <span className="text-xs font-medium text-slate-500">records</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full w-full" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">100% Valid Row Ingestion</p>
        </div>

        {/* Number of Features */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Number of Features</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{summary.totalCols}</span>
            <span className="text-xs font-medium text-slate-500">columns</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full w-4/5" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Clinical Variables Included</p>
        </div>

        {/* Missing Values */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Missing Values</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{summary.totalMissingCells}</span>
            <span className="text-xs font-medium text-amber-600 font-semibold">
              ({summary.missingPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, summary.missingPercentage * 10)}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">To Impute in Phase 3</p>
        </div>

        {/* Dataset Quality */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-emerald-500 rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Dataset Quality</p>
            <ShieldCheck className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <p className="text-4xl font-black">{summary.qualityScore}</p>
            <p className="text-xs font-semibold text-emerald-100 mt-1">
              {summary.qualityScore > 90 ? 'High Clinical Reliability' : 'Moderate Quality'}
            </p>
          </div>
          <div className="text-[10px] text-emerald-200 pt-2 border-t border-emerald-400/40">
            Validated against bio-data benchmarks
          </div>
        </div>
      </div>

      {/* Clinical Baseline Averages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Average Age</p>
            <p className="text-2xl font-black text-slate-900">{summary.avgAge} <span className="text-xs text-slate-500 font-normal">years</span></p>
            <p className="text-[10px] text-slate-400">Cohort mean distribution</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Average BMI</p>
            <p className="text-2xl font-black text-slate-900">{summary.avgBMI} <span className="text-xs text-slate-500 font-normal">kg/m²</span></p>
            <p className="text-[10px] text-slate-400">Overweight baseline threshold</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Average HbA1c</p>
            <p className="text-2xl font-black text-slate-900">{summary.avgHbA1c} <span className="text-xs text-slate-500 font-normal">%</span></p>
            <p className="text-[10px] text-slate-400">Prediabetic mean indicator</p>
          </div>
        </div>
      </div>

      {/* Disease Distribution & Missing Values Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Disease Distribution Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-400">Disease Distribution</h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">Categorical Target Sample Breakdown</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              {chartData.length} Target Groups Detected
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-indigo-300">{data.count.toLocaleString()} patients ({data.percentage}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const color = DISEASE_COLORS[entry.name] || PALETTE[index % PALETTE.length];
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Inline breakdown pill stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
            {chartData.map((d, idx) => (
              <div key={d.name} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase truncate" title={d.name}>{d.name}</span>
                <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                  <span className="text-sm font-black text-slate-800">{d.count.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-indigo-600">({d.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Values Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold uppercase text-slate-400">Missing Value Analysis</h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Features with non-null missing values identified for automatic Phase 3 Imputation.
            </p>

            {missingColList.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-500 text-xs font-semibold">
                ✓ Zero missing values detected across all columns!
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {missingColList.map(([col, count]) => {
                  const pct = Math.round((count / summary.totalRows) * 1000) / 10;
                  return (
                    <div key={col} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{col}</span>
                        <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.max(5, pct * 4)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
            <span>Read-Only Inspector</span>
            <span className="font-bold text-indigo-600">Phase 3 Preprocessing Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
