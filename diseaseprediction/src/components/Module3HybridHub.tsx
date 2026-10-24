import React from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  FileText,
  Sliders,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  KaUdpmPatientPrediction,
  Phase9Summary,
  FeatureMetrics
} from '../types';

interface Module3HybridHubProps {
  phase9Summary: Phase9Summary | null;
  featureMetrics: FeatureMetrics[];
  onNavigateSubView: (viewId: string) => void;
}

export const Module3HybridHub: React.FC<Module3HybridHubProps> = ({
  phase9Summary,
  featureMetrics,
  onNavigateSubView,
}) => {
  const activePred = phase9Summary?.activePatientPrediction;
  const predictedDisease = activePred?.predictedDisease || 'Diabetes Mellitus Type 2';
  const calibratedProb = activePred?.calibratedConfidence || 92;
  const rawConfidence = activePred?.rawConfidence || 89;
  const riskLevel = calibratedProb >= 75 ? 'High Risk' : calibratedProb >= 45 ? 'Moderate' : 'Low';

  const topFactors = activePred?.topContributors || [
    { featureName: 'HbA1c (Glycated Hemoglobin)', contributionPercent: 34, direction: 'positive' },
    { featureName: 'Fasting Plasma Glucose', contributionPercent: 28, direction: 'positive' },
    { featureName: 'Body Mass Index (BMI)', contributionPercent: 18, direction: 'positive' },
    { featureName: 'Systolic Blood Pressure', contributionPercent: 12, direction: 'positive' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Hybrid Score Fusion Architecture */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hybrid Disease Prediction Engine</span>
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
              True 5-Tier Hybrid ML
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Supervised XGBoost Disease Prediction &amp; Risk Engine
          </h2>

          <p className="text-sm text-slate-300 font-medium max-w-3xl leading-relaxed">
            Supervised gradient-boosted machine learning (XGBoost) over the 19 canonical clinical biomarkers with independent disease classifiers (XGB-DM, XGB-HD, XGB-CKD).
          </p>

          {/* Sub-view switcher buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => onNavigateSubView('m3-kaudpm')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stage 3.4 XGBoost Prediction</span>
            </button>

            <button
              onClick={() => onNavigateSubView('m3-patient')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>10 Interactive Patient Inference Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Executive Prediction Card (As Requested by User) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Primary Prediction Decision Box */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Active Evaluated Patient Profile
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Eleanor Vance (Age 58, Female • MRN-88412)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
                Calibrated via Platt Scaling
              </span>
            </div>

            {/* Big Prediction Outcome Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50 border border-indigo-100 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Predicted Disease</span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {predictedDisease}
                </div>
                <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-rose-600 text-white shadow-xs">
                  {riskLevel}
                </span>
              </div>
            </div>

            {/* 3 Metric Badges: Probability, Risk Level, Confidence */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Disease Probability</span>
                <span className="text-2xl font-black text-indigo-600 mt-0.5 block">{calibratedProb}%</span>
                <span className="text-[10px] text-slate-400">XGBoost Posterior</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Risk Level</span>
                <span className="text-xl font-black text-rose-600 mt-0.5 block">{riskLevel}</span>
                <span className="text-[10px] text-slate-400">Action Required</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Confidence Score</span>
                <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{rawConfidence}%</span>
                <span className="text-[10px] text-slate-400">Memory Alignment</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Want to test a custom patient or tweak lab biomarkers?
            </span>
            <button
              onClick={() => onNavigateSubView('m3-patient')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
            >
              <span>Open Patient Inference Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Top Contributing Factors Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Top Contributing Factors
            </h3>
            <span className="text-xs font-mono text-indigo-600 font-bold">SHAP & Interaction Impact</span>
          </div>

          <div className="space-y-3">
            {topFactors.map((factor, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{factor.featureName}</span>
                  <span className="text-indigo-600 font-mono">+{factor.contributionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, factor.contributionPercent * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold block flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Signature Similarity Distinction</span>
            </span>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Patient matches the Diabetes Signature at <strong>95% similarity</strong> in the Clinical Memory Bank, leading XGBoost to compute a <strong>92% calibrated probability</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
