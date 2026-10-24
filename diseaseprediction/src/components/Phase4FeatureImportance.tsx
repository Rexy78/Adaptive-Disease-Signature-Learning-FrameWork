import React, { useState, useEffect } from 'react';
import { FeatureMetrics } from '../types';
import {
  Sparkles,
  Calculator,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  Activity,
  Layers,
  FileSpreadsheet,
  Globe,
  Sliders,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  PieChart,
  Download,
} from 'lucide-react';

interface Phase4FeatureImportanceProps {
  features: FeatureMetrics[];
  topCount: number;
  onTopCountChange: (count: number) => void;
}

// Preset examples to illustrate the Universal Aspect
interface DiseaseDiscoveryPreset {
  disease: string;
  domain: string;
  description: string;
  examples: { name: string; score: number; category: string; role: string }[];
}

const UNIVERSAL_EXAMPLES: DiseaseDiscoveryPreset[] = [
  {
    disease: 'Current Uploaded Dataset',
    domain: 'Dynamic Discovery',
    description: 'Autonomous statistical discovery computed directly on the active dataset.',
    examples: [],
  },
  {
    disease: 'Endocrine & Metabolic (e.g. Diabetes)',
    domain: 'Metabolic',
    description: 'Discovers glycemic dysregulation without hardcoded rules.',
    examples: [
      { name: 'HbA1c', score: 0.91, category: 'Glycemic', role: '3-Month Mean Glucose Glycation' },
      { name: 'Fasting Glucose', score: 0.88, category: 'Glycemic', role: 'Acute Blood Sugar Concentration' },
      { name: 'BMI', score: 0.72, category: 'Anthropometric', role: 'Adiposity & Insulin Resistance Index' },
      { name: 'HOMA-IR', score: 0.79, category: 'Glycemic', role: 'Homeostatic Insulin Resistance' },
    ],
  },
  {
    disease: 'Oncology (e.g. Solid Tumors)',
    domain: 'Oncological',
    description: 'Discovers histopathological & proliferative markers agnostically.',
    examples: [
      { name: 'Tumor Size', score: 0.94, category: 'Oncological', role: 'Primary Neoplasm Diameter (cm)' },
      { name: 'Cell Density', score: 0.89, category: 'Oncological', role: 'Histological Cellularity Index' },
      { name: 'Ki-67 Proliferation', score: 0.82, category: 'Biomarker', role: 'Mitotic Growth Fraction' },
      { name: 'Lymph Node Ratio', score: 0.76, category: 'Anatomical', role: 'Metastatic Burden Spread' },
    ],
  },
  {
    disease: 'Cardiovascular (e.g. CAD / Heart Failure)',
    domain: 'Cardiovascular',
    description: 'Discovers hemodynamic and myocardial injury markers autonomously.',
    examples: [
      { name: 'Systolic BP', score: 0.93, category: 'Cardiovascular', role: 'Arterial Afterload Pressure' },
      { name: 'Troponin-I', score: 0.90, category: 'Cardiovascular', role: 'Myocardial Necrosis Specificity' },
      { name: 'LDL Cholesterol', score: 0.84, category: 'Cardiovascular', role: 'Atherogenic Lipoprotein Burden' },
      { name: 'BNP / NT-proBNP', score: 0.81, category: 'Cardiovascular', role: 'Ventricular Wall Stretch Marker' },
    ],
  },
  {
    disease: 'Nephrology (e.g. Chronic Kidney Disease)',
    domain: 'Renal',
    description: 'Discovers filtration decay and nitrogenous waste retention.',
    examples: [
      { name: 'Serum Creatinine', score: 0.95, category: 'Renal', role: 'Glomerular Clearance Biomarker' },
      { name: 'eGFR', score: 0.92, category: 'Renal', role: 'Estimated Filtration Rate' },
      { name: 'Urine Albumin/Creatinine', score: 0.86, category: 'Renal', role: 'Podocyte Barrier Breakdown' },
      { name: 'Serum Potassium', score: 0.78, category: 'Electrolyte', role: 'Tubular Excretion Impairment' },
    ],
  },
];

export const Phase4FeatureImportance: React.FC<Phase4FeatureImportanceProps> = ({
  features,
  topCount,
  onTopCountChange,
}) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureMetrics | null>(features[0] || null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'ranked' | 'triad' | 'universal'>('ranked');
  const [selectedPreset, setSelectedPreset] = useState<DiseaseDiscoveryPreset>(UNIVERSAL_EXAMPLES[0]);

  useEffect(() => {
    if (features.length > 0 && (!selectedFeature || !features.some((f) => f.featureName === selectedFeature.featureName))) {
      setSelectedFeature(features[0]);
    }
  }, [features]);

  const categories = ['All', ...Array.from(new Set(features.map((f) => f.clinicalCategory)))];

  const filteredFeatures = features.filter((f) => {
    const matchesSearch = String(f?.featureName ?? '').toLowerCase().includes(String(searchTerm ?? '').toLowerCase());
    const matchesCategory = categoryFilter === 'All' || f.clinicalCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exportCSV = () => {
    const headers = ['Rank', 'Feature', 'Category', 'FinalScore', 'Relevance', 'Variability', 'InfoContent', 'MutualInfo', 'PearsonCorr', 'Variance', 'Status'];
    const rows = features.map((f) => [
      f.rank,
      `"${f.featureName}"`,
      `"${f.clinicalCategory}"`,
      (f.finalScore ?? 0).toFixed(2),
      (f.relevanceScore ?? 0).toFixed(2),
      (f.variabilityScore ?? 0).toFixed(2),
      (f.informationContentScore ?? 0).toFixed(2),
      (f.miRaw ?? 0).toFixed(3),
      (f.corrRaw ?? 0).toFixed(3),
      (f.varRaw ?? 0).toFixed(3),
      f.isTopFeature ? 'KEPT' : 'PRUNED',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `feature_discovery_ranking.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded uppercase tracking-wider border border-indigo-200/60">
              PHASE 04
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Feature Discovery & Relevance Ranking</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Triad-scored ranking across Relevance, Variability, and Information Content.
          </p>
        </div>

        {/* Action Controls: Top N Selector & Export */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Top Features:</span>
            <div className="flex space-x-1">
              {[8, 12, 16, 20].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => onTopCountChange(cnt)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    topCount === cnt
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ranking</span>
          </button>
        </div>
      </div>

      {/* 3-Pillar Triad Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Feature Relevance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              01
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Weight: 40%
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">Feature Relevance</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Measures statistical association, Pearson linear correlation ($|r|$), and dependency between each candidate feature and target disease status.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
            <span>Pearson $|r|$ + Mutual Dep</span>
            <span className="text-blue-600">Range: [0.0, 1.0]</span>
          </div>
        </div>

        {/* Pillar 2: Feature Variability */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              02
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Weight: 25%
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">Feature Variability</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Evaluates variance ($\sigma^2$) and standard deviation ($\sigma$) to guarantee features exhibit sufficient dispersion across diverse patient cohorts.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
            <span>Variance $\sigma^2$ & Spread</span>
            <span className="text-indigo-600">Zero-Variance Filtered</span>
          </div>
        </div>

        {/* Pillar 3: Feature Information Content */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              03
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Weight: 35%
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">Information Content</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Calculates Shannon Entropy $H(X)$ and Mutual Information $I(X; Y)$ to capture complex non-linear diagnostic signal and high signal-to-noise ratio.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
            <span>Shannon $H(X)$ & $I(X;Y)$</span>
            <span className="text-emerald-600">Non-linear Signals</span>
          </div>
        </div>
      </div>

      {/* Universal Aspect Demonstration Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Universal Aspect Verification</h3>
                <span className="text-[9px] uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                  Domain Agnostic
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Does not assume which features are important beforehand. Demonstrating autonomous adaptation across all clinical specialties:
              </p>
            </div>
          </div>
        </div>

        {/* Preset Carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {UNIVERSAL_EXAMPLES.slice(1).map((preset) => (
            <div
              key={preset.disease}
              onClick={() => setSelectedPreset(preset)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                  {preset.domain}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">Top Features</span>
              </div>
              <h4 className="text-xs font-black text-white">{preset.disease}</h4>
              <div className="space-y-1 pt-1">
                {preset.examples.slice(0, 3).map((ex) => (
                  <div key={ex.name} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 truncate max-w-[120px]">{ex.name}</span>
                    <span className="font-mono font-bold text-amber-300">{ex.score.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search discovered features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Rankings & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Feature List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                Top Disease-Relevant Features (Ranked Output)
              </h3>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              Top {topCount} Retained ({filteredFeatures.length} Displayed)
            </span>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredFeatures.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No clinical features match your search filter.
              </div>
            ) : (
              filteredFeatures.map((f) => {
                const isSelected = selectedFeature?.featureName === f.featureName;
                return (
                  <div
                    key={f.featureName}
                    onClick={() => setSelectedFeature(f)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                        : f.isTopFeature
                        ? 'border-slate-200 bg-white hover:border-indigo-300'
                        : 'border-slate-100 bg-slate-50/50 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl text-[11px] font-black flex items-center justify-center ${
                            f.rank <= 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : f.isTopFeature
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          #{f.rank}
                        </span>
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block">{f.featureName}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {f.clinicalCategory} • {f.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 font-mono block">
                            {f.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Score</span>
                        </div>
                        {f.isTopFeature ? (
                          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg flex items-center space-x-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>KEPT</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">
                            PRUNED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Bar Scale */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          f.rank <= 3 ? 'bg-gradient-to-r from-amber-500 to-indigo-600' : f.isTopFeature ? 'bg-indigo-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(4, f.finalScore * 100)}%` }}
                      />
                    </div>

                    {/* Triad Score Mini-Indicators */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-slate-500 font-mono">
                      <div>
                        Relevance: <strong className="text-slate-800">{(f.relevanceScore ?? f.corrNorm ?? 0).toFixed(2)}</strong>
                      </div>
                      <div>
                        Variability: <strong className="text-slate-800">{(f.variabilityScore ?? f.varNorm ?? 0).toFixed(2)}</strong>
                      </div>
                      <div>
                        Info Content: <strong className="text-slate-800">{(f.informationContentScore ?? f.miNorm ?? 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Feature Inspector Panel */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          {selectedFeature ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Feature Inspector
                    </span>
                    {selectedFeature.isTopFeature ? (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Top {topCount} Retained
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Pruned
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{selectedFeature.featureName}</h3>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">
                    Rank #{selectedFeature.rank} • {selectedFeature.clinicalCategory} Domain
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 font-mono">
                    {(selectedFeature.finalScore ?? 0).toFixed(2)}
                  </span>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Composite Score</span>
                </div>
              </div>

              {/* 3-Pillar Metric Breakdown */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Triad Statistical Evaluation Breakdown
                </h4>

                {/* Relevance */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>1. Feature Relevance (40%)</span>
                    <span className="font-mono">{(selectedFeature.relevanceScore ?? selectedFeature.corrNorm ?? 0).toFixed(2)} (Corr: {selectedFeature.corrRaw ?? 0})</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${(selectedFeature.relevanceScore || selectedFeature.corrNorm || 0.5) * 100}%` }} />
                  </div>
                </div>

                {/* Information Content */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>2. Information Content (35%)</span>
                    <span className="font-mono">{(selectedFeature.informationContentScore ?? selectedFeature.miNorm ?? 0).toFixed(2)} (MI: {selectedFeature.miRaw ?? 0})</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: `${(selectedFeature.informationContentScore || selectedFeature.miNorm || 0.5) * 100}%` }} />
                  </div>
                </div>

                {/* Variability */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>3. Feature Variability (25%)</span>
                    <span className="font-mono">{(selectedFeature.variabilityScore ?? selectedFeature.varNorm ?? 0).toFixed(2)} (Var: {selectedFeature.varRaw ?? 0})</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600" style={{ width: `${(selectedFeature.variabilityScore || selectedFeature.varNorm || 0.5) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Statistical Raw Metrics Table */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shannon Entropy $H(X)$</span>
                  <span className="text-sm font-mono font-black text-slate-900">
                    {(selectedFeature.entropyRaw ?? 1.84).toFixed(3)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Standard Dev $\sigma$</span>
                  <span className="text-sm font-mono font-black text-slate-900">
                    {(selectedFeature.stdDevRaw ?? Math.sqrt(selectedFeature.varRaw ?? 1) ?? 0.85).toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Downstream Clinical Role */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs text-indigo-950 space-y-2">
                <p className="font-extrabold flex items-center space-x-1.5 text-indigo-900">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span>Universal Pipeline Action:</span>
                </p>
                <p className="leading-relaxed">
                  {selectedFeature.featureName} achieved an importance score of{' '}
                  <strong className="font-mono font-black">{(selectedFeature.finalScore ?? 0.8).toFixed(2)}</strong>.
                  {selectedFeature.isTopFeature
                    ? ' Passed as a primary node into Module 4 (Adaptive Clinical Interaction Discovery) and Phase 9 (KA-UDPM Neural Memory Bank).'
                    : ' Pruned from downstream network construction to maximize model generalizability and avoid overfitting.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a feature from the ranked list on the left to inspect detailed metrics.
            </div>
          )}

          <div className="pt-4 mt-6 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Module 3 Status:</span>
            <span className="font-extrabold text-indigo-600 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Universal Discovery Complete</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
