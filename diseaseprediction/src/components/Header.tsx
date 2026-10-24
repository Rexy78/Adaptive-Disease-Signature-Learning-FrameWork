import React from 'react';
import {
  Activity,
  Database,
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles,
  Stethoscope,
  Cpu,
  GitFork,
  Brain,
  TrendingUp
} from 'lucide-react';

interface HeaderProps {
  datasetName: string;
  isProcessed: boolean;
  onReset: () => void;
  onLoadMaster: () => void;
  totalRows: number;
}

export const Header: React.FC<HeaderProps> = ({
  datasetName,
  isProcessed,
  onReset,
  onLoadMaster,
  totalRows,
}) => {
  return (
    <header className="bg-white/90 backdrop-blur-xs rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs mb-6 transition-all space-y-4">
      {/* Top Row: Branding & Quick Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Branding & Subtitle */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0">
            <Stethoscope className="w-6 h-6 text-indigo-100" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-950">
                Clinical Discovery Engine
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>4-Module Suite</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Multi-Disease Ingestion • Predictive Signatures • Hybrid Assessment • Risk Progression
            </p>
          </div>
        </div>

        {/* Action & Status Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {datasetName && (
            <div className="flex items-center space-x-2.5 bg-emerald-50/80 px-4 py-2 rounded-xl border border-emerald-200/80 text-xs font-medium text-slate-700 shadow-2xs">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate max-w-[160px]">{datasetName}</span>
              <span className="text-slate-400 font-mono text-[11px]">({totalRows.toLocaleString()} rows)</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{isProcessed ? 'Loaded & Active' : 'Ready'}</span>
              </span>
            </div>
          )}

          <button
            onClick={onLoadMaster}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Reload Master Clinical Dataset"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-200" />
            <span>Master Dataset</span>
          </button>

          <button
            onClick={onReset}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
            title="Reset State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
