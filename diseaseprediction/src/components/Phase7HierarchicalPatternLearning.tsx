import React, { useState } from 'react';
import { Phase7Summary, DiseasePattern, BiologicalPattern } from '../types';
import {
  Layers,
  GitMerge,
  ShieldCheck,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  Download,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  ListTree,
  Dna,
  HeartPulse,
  Droplets,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Brain,
  Microscope,
  Network
} from 'lucide-react';

interface Phase7Props {
  summary: Phase7Summary;
}

export const Phase7HierarchicalPatternLearning: React.FC<Phase7Props> = ({ summary }) => {
  const [selectedDisease, setSelectedDisease] = useState<string>(
    summary.patterns[0]?.disease || 'Diabetes'
  );
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(
    summary.patterns[0]?.id || 'hdpl-pattern'
  );
  const [activeStepTab, setActiveStepTab] = useState<'flow' | 'step1' | 'step2' | 'step3' | 'hierarchy'>('flow');

  const availableDiseases = summary.patterns.map((p) => p.disease);
  const activeDiseaseName = availableDiseases.includes(selectedDisease)
    ? selectedDisease
    : summary.patterns[0]?.disease || 'Diabetes';

  const activePattern =
    summary.diseasePatternLibrary[activeDiseaseName] || summary.patterns[0];

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HDPL_Hierarchical_Disease_Patterns_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getSystemIcon = (system?: string) => {
    switch (String(system ?? '').toLowerCase()) {
      case 'metabolism':
      case 'metabolic':
        return <Dna className="w-4 h-4 text-amber-500" />;
      case 'cardiovascular':
      case 'cardio':
        return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case 'renal':
      case 'kidney':
        return <Droplets className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getStrengthBadge = (strength: number, rating?: string) => {
    const r = rating || (strength >= 0.9 ? 'Very Strong' : strength >= 0.75 ? 'Strong' : strength >= 0.55 ? 'Moderate' : 'Weak');
    if (r === 'Very Strong') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Very Strong ({strength.toFixed(2)})</span>
        </span>
      );
    }
    if (r === 'Strong') {
      return (
        <span className="bg-blue-50 text-blue-700 border border-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Strong ({strength.toFixed(2)})</span>
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
        {r} ({strength.toFixed(2)})
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                <Network className="w-3 h-3" />
                <span>Phase 07</span>
              </span>
              <span className="text-slate-400 text-xs font-semibold">
                Hierarchical Disease Pattern Learning (HDPL)
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
              Hierarchical Disease Pattern Learning
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Multi-level biological representation: Features → Patterns → Disease Signatures → Target Disease.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportJSON}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center space-x-2 border border-indigo-400/30"
            >
              <Download className="w-4 h-4" />
              <span>Export Pattern Library</span>
            </button>
          </div>
        </div>

        {/* Top Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-indigo-900/60">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">
              Pattern Library Score
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline space-x-1">
              <span>{summary.overallLibraryScore.toFixed(2)}</span>
              <span className="text-xs font-normal text-slate-400">/ 1.00</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">High biological coherence</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">
              Biological Patterns
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {summary.biologicalPatterns?.length || 3} <span className="text-sm font-normal text-slate-400">Systems</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Metabolic, Cardio, Renal
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">
              Hierarchy Levels
            </div>
            <div className="text-2xl font-black text-indigo-300 mt-1">
              4 Levels
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Level 1 → Level 2 → Level 3 → Level 4</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">
              Target Signatures
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1 truncate">
              {summary.patterns.length} Diseases
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Top: {summary.topPatternDisease}
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
          Methodology Breakdown:
        </span>
        <button
          onClick={() => setActiveStepTab('flow')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeStepTab === 'flow'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Interactive 4-Level Hierarchy</span>
        </button>
        <button
          onClick={() => setActiveStepTab('step1')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeStepTab === 'step1'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Dna className="w-3.5 h-3.5" />
          <span>Step 1: Group Similar Features</span>
        </button>
        <button
          onClick={() => setActiveStepTab('step2')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeStepTab === 'step2'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Step 2: Learn Pattern Strength</span>
        </button>
        <button
          onClick={() => setActiveStepTab('step3')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeStepTab === 'step3'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Step 3: Build Disease Signatures</span>
        </button>
        <button
          onClick={() => setActiveStepTab('hierarchy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeStepTab === 'hierarchy'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Why "Hierarchical"?</span>
        </button>
      </div>

      {/* Disease Selection Selector */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
          Select Target Disease:
        </span>
        {summary.patterns.map((p) => (
          <button
            key={p.disease}
            onClick={() => {
              setSelectedDisease(p.disease);
              setExpandedPatternId(p.id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeDiseaseName === p.disease
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>{p.disease}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                selectedDisease === p.disease
                  ? 'bg-slate-800 text-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              Score: {p.patternScore.toFixed(2)}
            </span>
          </button>
        ))}
      </div>

      {/* Step 1 View: Group Similar Features */}
      {activeStepTab === 'step1' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              HDPL Step 1
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Group Similar Features into Biological Patterns
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supposing the Feature Discovery and Interaction Scoring modules identified clinical biomarkers, we group them according to biological organ and metabolic systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Group 1: Metabolic Pattern */}
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-amber-800 flex items-center space-x-1.5">
                  <Dna className="w-4 h-4 text-amber-600" />
                  <span>Group 1: Metabolism</span>
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  4 Biomarkers
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Identified Features:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['HbA1c', 'Glucose', 'BMI', 'Insulin'].map((f) => (
                    <span key={f} className="bg-amber-50 text-amber-900 font-mono font-bold px-2 py-1 rounded border border-amber-200 text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center font-bold text-xs text-amber-600 flex items-center justify-center space-x-1">
                <span>↓ Maps directly to</span>
              </div>
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-3.5 rounded-xl text-center shadow-sm">
                <div className="text-xs uppercase tracking-wider font-semibold text-amber-200">Derived Pattern</div>
                <div className="text-sm font-black mt-0.5">Metabolic Pattern</div>
              </div>
            </div>

            {/* Group 2: Cardiovascular Pattern */}
            <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-rose-800 flex items-center space-x-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Group 2: Cardiovascular</span>
                </span>
                <span className="bg-rose-100 text-rose-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  4 Biomarkers
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Identified Features:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['LDL', 'HDL', 'Cholesterol', 'Blood Pressure'].map((f) => (
                    <span key={f} className="bg-rose-50 text-rose-900 font-mono font-bold px-2 py-1 rounded border border-rose-200 text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center font-bold text-xs text-rose-600 flex items-center justify-center space-x-1">
                <span>↓ Maps directly to</span>
              </div>
              <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-3.5 rounded-xl text-center shadow-sm">
                <div className="text-xs uppercase tracking-wider font-semibold text-rose-200">Derived Pattern</div>
                <div className="text-sm font-black mt-0.5">Cardiovascular Pattern</div>
              </div>
            </div>

            {/* Group 3: Renal Pattern */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-blue-800 flex items-center space-x-1.5">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>Group 3: Renal Function</span>
                </span>
                <span className="bg-blue-100 text-blue-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  4 Biomarkers
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Identified Features:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['Creatinine', 'eGFR', 'Albumin', 'Urea'].map((f) => (
                    <span key={f} className="bg-blue-50 text-blue-900 font-mono font-bold px-2 py-1 rounded border border-blue-200 text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center font-bold text-xs text-blue-600 flex items-center justify-center space-x-1">
                <span>↓ Maps directly to</span>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3.5 rounded-xl text-center shadow-sm">
                <div className="text-xs uppercase tracking-wider font-semibold text-blue-200">Derived Pattern</div>
                <div className="text-sm font-black mt-0.5">Renal Pattern</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 View: Learn Pattern Strength */}
      {activeStepTab === 'step2' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              HDPL Step 2
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Learn Biological Pattern Strength
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Instead of learning individual feature weights independently (HbA1c = 0.90, Glucose = 0.88, BMI = 0.70), the HDPL framework synthesizes unified holistic pattern strengths.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metabolic Pattern Strength */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Dna className="w-4 h-4 text-amber-500" />
                  <span>Metabolic Pattern</span>
                </span>
                {getStrengthBadge(0.92, 'Very Strong')}
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>HbA1c:</span>
                  <span className="font-bold text-slate-900">0.90</span>
                </div>
                <div className="flex justify-between">
                  <span>Glucose:</span>
                  <span className="font-bold text-slate-900">0.88</span>
                </div>
                <div className="flex justify-between">
                  <span>BMI:</span>
                  <span className="font-bold text-slate-900">0.70</span>
                </div>
              </div>
              <div className="text-center font-bold text-xs text-emerald-600">
                <span>↓ Unified Synthesis</span>
              </div>
              <div className="bg-emerald-500 text-white p-4 rounded-xl text-center shadow-md">
                <div className="text-[11px] uppercase tracking-wider text-emerald-100 font-semibold">
                  Pattern Strength
                </div>
                <div className="text-2xl font-black font-mono mt-0.5">
                  0.92
                </div>
                <div className="text-[10px] text-emerald-100 mt-1 font-bold">
                  Very Strong Activation
                </div>
              </div>
            </div>

            {/* Cardiovascular Pattern Strength */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>Cardiovascular Pattern</span>
                </span>
                {getStrengthBadge(0.85, 'Strong')}
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>LDL:</span>
                  <span className="font-bold text-slate-900">0.86</span>
                </div>
                <div className="flex justify-between">
                  <span>Cholesterol:</span>
                  <span className="font-bold text-slate-900">0.84</span>
                </div>
                <div className="flex justify-between">
                  <span>Blood Pressure:</span>
                  <span className="font-bold text-slate-900">0.82</span>
                </div>
              </div>
              <div className="text-center font-bold text-xs text-blue-600">
                <span>↓ Unified Synthesis</span>
              </div>
              <div className="bg-blue-600 text-white p-4 rounded-xl text-center shadow-md">
                <div className="text-[11px] uppercase tracking-wider text-blue-100 font-semibold">
                  Pattern Strength
                </div>
                <div className="text-2xl font-black font-mono mt-0.5">
                  0.85
                </div>
                <div className="text-[10px] text-blue-100 mt-1 font-bold">
                  Strong Activation
                </div>
              </div>
            </div>

            {/* Renal Pattern Strength */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Renal Pattern</span>
                </span>
                {getStrengthBadge(0.95, 'Very Strong')}
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Creatinine:</span>
                  <span className="font-bold text-slate-900">0.96</span>
                </div>
                <div className="flex justify-between">
                  <span>eGFR:</span>
                  <span className="font-bold text-slate-900">0.98</span>
                </div>
                <div className="flex justify-between">
                  <span>Albumin:</span>
                  <span className="font-bold text-slate-900">0.91</span>
                </div>
              </div>
              <div className="text-center font-bold text-xs text-indigo-600">
                <span>↓ Unified Synthesis</span>
              </div>
              <div className="bg-indigo-600 text-white p-4 rounded-xl text-center shadow-md">
                <div className="text-[11px] uppercase tracking-wider text-indigo-100 font-semibold">
                  Pattern Strength
                </div>
                <div className="text-2xl font-black font-mono mt-0.5">
                  0.95
                </div>
                <div className="text-[10px] text-indigo-100 mt-1 font-bold">
                  Very Strong Activation
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 View: Build Disease Signatures */}
      {activeStepTab === 'step3' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              HDPL Step 3
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Build Disease Signatures from Clinical Patterns
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Now diseases are represented through patterns. Each signature encodes the biological mechanisms required for definitive diagnosis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Diabetes Signature */}
            <div className="bg-gradient-to-b from-amber-50/60 to-white rounded-2xl p-6 border border-amber-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-900 uppercase">Diabetes Signature</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Score: 0.96
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-800">Primary Driving Pattern:</div>
                <div className="flex items-center justify-between text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-950">Metabolic Pattern</span>
                  <span className="text-emerald-700 font-bold">Very Strong (0.92)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Definitive glycemic dysregulation and insulin resistance signature driving high predictive diagnostic power.
                </p>
              </div>
            </div>

            {/* Heart Disease Signature */}
            <div className="bg-gradient-to-b from-rose-50/60 to-white rounded-2xl p-6 border border-rose-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-900 uppercase">Heart Disease Signature</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Score: 0.94
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-800">Primary Driving Pattern:</div>
                <div className="flex items-center justify-between text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span className="font-bold text-rose-950">Cardiovascular Pattern</span>
                  <span className="text-emerald-700 font-bold">Very Strong (0.85)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Arterial pressure elevation and atherogenic lipid infiltration triggering coronary vascular damage.
                </p>
              </div>
            </div>

            {/* CKD Signature */}
            <div className="bg-gradient-to-b from-blue-50/60 to-white rounded-2xl p-6 border border-blue-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-900 uppercase">CKD Signature</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Score: 0.97
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-800">Primary Driving Pattern:</div>
                <div className="flex items-center justify-between text-xs bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                  <span className="font-bold text-blue-950">Renal Pattern</span>
                  <span className="text-emerald-700 font-bold">Very Strong (0.95)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Advanced filtration deterioration with creatinine retention and severe glomerular filtration decline.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Why Hierarchical View */}
      {activeStepTab === 'hierarchy' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              Structural Rationale
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Why is it called "Hierarchical"?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Because learning occurs progressively across four distinct abstraction levels: Features → Patterns → Disease Signatures → Diseases.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {/* Level 1 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-indigo-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                  Level 1
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Features</div>
                  <div className="text-[11px] text-slate-500 font-mono">Example: HbA1c, Glucose, BMI, Insulin</div>
                </div>
              </div>
              <span className="text-xs text-indigo-600 font-bold uppercase">Raw Biomarkers</span>
            </div>

            <div className="text-center font-bold text-slate-400 text-xs">↓</div>

            {/* Level 2 */}
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-indigo-700 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                  Level 2
                </span>
                <div>
                  <div className="text-xs font-bold text-indigo-950">Patterns</div>
                  <div className="text-[11px] text-indigo-700 font-semibold">Example: Metabolic Pattern (Strength: 0.92)</div>
                </div>
              </div>
              <span className="text-xs text-indigo-700 font-bold uppercase">Biological Systems</span>
            </div>

            <div className="text-center font-bold text-slate-400 text-xs">↓</div>

            {/* Level 3 */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-amber-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                  Level 3
                </span>
                <div>
                  <div className="text-xs font-bold text-amber-950">Disease Signatures</div>
                  <div className="text-[11px] text-amber-800 font-semibold">Example: Diabetes Signature (Very Strong Metabolic)</div>
                </div>
              </div>
              <span className="text-xs text-amber-700 font-bold uppercase">Diagnostic Profiles</span>
            </div>

            <div className="text-center font-bold text-slate-400 text-xs">↓</div>

            {/* Level 4 */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <span className="bg-emerald-500 text-slate-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                  Level 4
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Diseases</div>
                  <div className="text-[11px] text-emerald-400 font-mono">Example: Diabetes Mellitus (Target Phenotype)</div>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold uppercase flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Final Target</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main 4-Level Interactive Flow Explorer (Always Visible when in 'flow' mode) */}
      {activeStepTab === 'flow' && activePattern && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-black text-slate-900">
                  {activePattern.disease} Hierarchical Pattern Structure
                </h2>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-0.5 rounded-full">
                  Pattern Score: {activePattern.patternScore.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing features, biological pattern strength, disease signature formulation, and target disease classification.
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Primary Pattern</span>
                <span className="font-bold text-indigo-900">{activePattern.level3DiseaseSignature?.primaryPatternName || 'Metabolic Pattern'}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Pattern Strength</span>
                <span className="font-bold text-emerald-600">{activePattern.level3DiseaseSignature?.primaryPatternStrength.toFixed(2) || '0.92'}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Rating</span>
                <span className="font-bold text-slate-900">{activePattern.level3DiseaseSignature?.patternStrengthRating || 'Very Strong'}</span>
              </div>
            </div>
          </div>

          {/* 4-Level Step-by-Step Flow Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
            {/* Level 1: Individual Features */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    Level 1
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">Features</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Individual Features</h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Raw input variables extracted from clinical measurements.
                </p>

                <div className="space-y-2">
                  {activePattern.level1Features.map((f, i) => (
                    <div
                      key={i}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{f.featureName}</div>
                        <div className="text-[10px] text-slate-400">{f.clinicalCategory}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {f.importanceScore.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  ↓ Group into Patterns
                </span>
              </div>
            </div>

            {/* Level 2: Biological Patterns & Strength */}
            <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-100 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200">
                    Level 2
                  </span>
                  <span className="text-[11px] font-bold text-indigo-500">Biological Systems</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Patterns & Strength</h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Grouped features representing biological systems.
                </p>

                <div className="space-y-2.5">
                  {(activePattern.level2Patterns || summary.biologicalPatterns || []).slice(0, 3).map((bp, i) => {
                    const isPrimary = bp.name === activePattern.level3DiseaseSignature?.primaryPatternName;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border transition-all ${
                          isPrimary
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white text-slate-800 border-indigo-100 shadow-2xs'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className="flex items-center space-x-1.5">
                            {getSystemIcon(bp.system)}
                            <span className={isPrimary ? 'text-white' : 'text-slate-900'}>{bp.name}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            isPrimary ? 'bg-indigo-800 text-emerald-300' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            Strength: {bp.patternStrength.toFixed(2)}
                          </span>
                        </div>
                        <div className={`text-[10px] font-medium ${isPrimary ? 'text-indigo-200' : 'text-slate-500'}`}>
                          Rating: <span className="font-bold">{bp.strengthDescription}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {bp.features.slice(0, 3).map((feat, idx) => (
                            <span
                              key={idx}
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                isPrimary ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-200/60 text-center">
                <span className="text-[10px] text-indigo-400 font-bold uppercase">
                  ↓ Build Disease Signatures
                </span>
              </div>
            </div>

            {/* Level 3: Disease Signature */}
            <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-200/60 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
                    Level 3
                  </span>
                  <span className="text-[11px] font-bold text-amber-600">Signatures</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Disease Signature</h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Diseases expressed through pattern strength couplings.
                </p>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activePattern.disease} Signature</span>
                  </div>

                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 space-y-1">
                    <div className="text-[11px] font-bold text-amber-900">
                      {activePattern.level3DiseaseSignature?.primaryPatternName}
                    </div>
                    <div className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                      <span>↓ {activePattern.level3DiseaseSignature?.patternStrengthRating} ({activePattern.level3DiseaseSignature?.primaryPatternStrength.toFixed(2)})</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {activePattern.level3DiseaseSignature?.signatureExplanation}
                  </p>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Secondary Couplings:</div>
                    <div className="space-y-1">
                      {(activePattern.level3DiseaseSignature?.secondaryPatterns || []).map((sec, sIdx) => (
                        <div key={sIdx} className="flex justify-between text-[10px] text-slate-600">
                          <span>{sec.name}:</span>
                          <span className="font-mono font-bold text-slate-800">{sec.strength.toFixed(2)} ({sec.rating})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/60 text-center">
                <span className="text-[10px] text-amber-600 font-bold uppercase">
                  ↓ Final Disease Classification
                </span>
              </div>
            </div>

            {/* Level 4: Disease Target */}
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl p-5 border border-indigo-900 text-white relative flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                    Level 4
                  </span>
                  <span className="text-[11px] font-bold text-indigo-300">Diseases</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Target Disease</h3>
                <p className="text-[11px] text-slate-300 mb-4">
                  Unified clinical phenotype grounded in biological patterns.
                </p>

                <div className="bg-indigo-900/60 p-4 rounded-xl border border-indigo-700/60 space-y-3">
                  <div className="text-lg font-black text-white flex items-center justify-between">
                    <span>{activePattern.disease}</span>
                    <span className="text-emerald-400 font-mono text-xl">
                      {activePattern.patternScore.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-indigo-800/80 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Primary Pattern:</span>
                      <span className="font-bold text-white">{activePattern.level3DiseaseSignature?.primaryPatternName}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Pattern Strength:</span>
                      <span className="font-bold text-emerald-400">
                        {activePattern.level3DiseaseSignature?.primaryPatternStrength.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Diagnostic Accuracy:</span>
                      <span className="font-bold text-emerald-400">
                        {(activePattern.diseaseAccuracy * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Cohort Coverage:</span>
                      <span className="font-bold text-indigo-200">
                        {(activePattern.coverage * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-800 text-center">
                <span className="text-[10px] text-emerald-300 font-bold uppercase flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Validated Multi-Level Model</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disease Pattern Library Output Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ListTree className="w-5 h-5 text-indigo-600" />
              <span>Hierarchical Disease Pattern Library Output</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-level pattern registry with biological systems, pattern strength, and signature formulas.
            </p>
          </div>

          <div className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-3 py-1.5 rounded-xl">
            PatternScore = 0.40(Strength) + 0.35(Accuracy) + 0.25(Coverage)
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Disease (Level 4)</th>
                <th className="px-4 py-3.5">Primary Pattern (Level 2)</th>
                <th className="px-4 py-3.5">Pattern Strength</th>
                <th className="px-4 py-3.5">Level 1 Features</th>
                <th className="px-4 py-3.5">Accuracy</th>
                <th className="px-4 py-3.5">Coverage</th>
                <th className="px-4 py-3.5 text-right">Pattern Score</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {summary.patterns.map((pattern) => {
                const isExpanded = expandedPatternId === pattern.id;
                return (
                  <React.Fragment key={pattern.id}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors ${
                        selectedDisease === pattern.disease ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-4 font-bold text-slate-900 flex items-center space-x-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span>{pattern.disease}</span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-bold text-indigo-950 flex items-center space-x-1.5">
                          {getSystemIcon(pattern.level3DiseaseSignature?.primaryPatternName || 'Metabolism')}
                          <span>{pattern.level3DiseaseSignature?.primaryPatternName || 'Metabolic Pattern'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {getStrengthBadge(
                          pattern.level3DiseaseSignature?.primaryPatternStrength || 0.92,
                          pattern.level3DiseaseSignature?.patternStrengthRating
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {pattern.features.slice(0, 3).map((f, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono font-bold text-emerald-600">
                        {(pattern.diseaseAccuracy * 100).toFixed(0)}%
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-600">
                        {(pattern.coverage * 100).toFixed(0)}%
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="bg-emerald-100 text-emerald-900 text-sm font-black font-mono px-2.5 py-1 rounded-lg border border-emerald-200">
                          {pattern.patternScore.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedDisease(pattern.disease);
                            setExpandedPatternId(isExpanded ? null : pattern.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center justify-center space-x-1 mx-auto"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Inspect'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Detailed Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={8} className="p-4 border-t border-b border-indigo-100">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-slate-400">
                                  Level 3: Disease Signature Formula
                                </h4>
                                <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl">
                                  {pattern.level3DiseaseSignature?.signatureFormula || '0.75 * MetabolicPattern + 0.25 * CardiovascularPattern'}
                                </div>
                                <p className="text-xs text-slate-600">
                                  {pattern.level3DiseaseSignature?.signatureExplanation}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-slate-400">
                                  4-Level Mapping Summary
                                </h4>
                                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                                  <div><strong>Level 1 (Features):</strong> {pattern.features.join(', ')}</div>
                                  <div><strong>Level 2 (Patterns):</strong> {pattern.level3DiseaseSignature?.primaryPatternName} (Strength: {pattern.level3DiseaseSignature?.primaryPatternStrength.toFixed(2)})</div>
                                  <div><strong>Level 3 (Signatures):</strong> {pattern.disease} Signature ({pattern.level3DiseaseSignature?.patternStrengthRating})</div>
                                  <div><strong>Level 4 (Disease):</strong> {pattern.disease}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
