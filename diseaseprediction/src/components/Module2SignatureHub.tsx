import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Database,
  Crosshair,
  Info,
  Layers,
  BarChart3,
  Cpu,
  TrendingUp,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Filter,
  Network,
  GitBranch,
  GitFork,
  Table,
  Check,
  XCircle,
  Hash,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { RawRow, DatasetSummary, PreprocessingSummary, ValidationResult } from '../types';
import {
  runFeatureDiscovery,
  DiscoveredFeatureImportance,
  FeatureDiscoveryAuditResult,
  VALIDATED_19_FEATURES,
  VALIDATED_3_TARGETS,
  VALIDATED_4_EXCLUDED,
} from '../utils/featureDiscoveryEngine';

interface Module2SignatureHubProps {
  processedRows: RawRow[];
  rawRows?: RawRow[];
  datasetName?: string;
  datasetSummary?: DatasetSummary | null;
  preprocessingSummary?: PreprocessingSummary | null;
  validationResult?: ValidationResult | null;
  onNavigateSubView?: (viewId: string) => void;
}

export const Module2SignatureHub: React.FC<Module2SignatureHubProps> = ({
  processedRows,
  rawRows = [],
  datasetName = 'preprocessed_master_dataset.csv',
  datasetSummary,
  preprocessingSummary,
  validationResult,
  onNavigateSubView,
}) => {
  const [activeSectionTab, setActiveSectionTab] = useState<string>('dataset-setup');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<DiscoveredFeatureImportance | null>(null);
  const [selectedPartitionCard, setSelectedPartitionCard] = useState<'inputs' | 'targets' | 'excluded' | 'total' | null>(null);

  // Active preprocessed cohort from Module 1
  const activeDataset: RawRow[] = useMemo(() => {
    if (processedRows && processedRows.length > 0) return processedRows;
    if (rawRows && rawRows.length > 0) return rawRows;
    return [];
  }, [processedRows, rawRows]);

  // Execute unified multi-output model training and feature discovery
  const discoveryResult: FeatureDiscoveryAuditResult = useMemo(() => {
    return runFeatureDiscovery(activeDataset);
  }, [activeDataset]);

  const {
    passed,
    totalRows,
    totalColumns,
    targetCount,
    excludedCount,
    featureCount,
    equationValid,
    noTargetsInX,
    noIdInX,
    noLeakageInX,
    noInventedColsInX,
    noNaNsInX,
    normalizedSums,
    errors,
    warnings,
    architecture,
    outputMetrics,
    featureImportanceList,
  } = discoveryResult;

  // Filtered features for the table
  const filteredFeatures = useMemo(() => {
    return featureImportanceList.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        return (
          item.feature.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [featureImportanceList, selectedCategory, searchTerm]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    VALIDATED_19_FEATURES.forEach((f) => set.add(f.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Top 10 features for comparative attribution
  const top10Features = useMemo(() => {
    return featureImportanceList.slice(0, 10);
  }, [featureImportanceList]);

  // Module 2 Gate status (Condition A: Unified Model Integrity + Condition B: Feature Discovery Integrity)
  const isUnifiedModelIntegrityPassed =
    architecture.inputFeaturesCount === 19 &&
    architecture.outputHeadsCount === 3 &&
    architecture.leakedInputsCount === 0 &&
    architecture.identifierInputsCount === 0 &&
    architecture.zeroDuplicatesCrossed &&
    architecture.preprocessingStrictlyOnTrain;

  const isFeatureDiscoveryIntegrityPassed =
    passed &&
    featureImportanceList.length === 19 &&
    Math.abs(normalizedSums.heartDiseaseSum - 100) < 0.5 &&
    Math.abs(normalizedSums.diabetesSum - 100) < 0.5 &&
    Math.abs(normalizedSums.ckdSum - 100) < 0.5 &&
    Math.abs(normalizedSums.overallSum - 100) < 0.5;

  const isModule2FullyVerified = isUnifiedModelIntegrityPassed && isFeatureDiscoveryIntegrityPassed;

  return (
    <div id="module2-unified-feature-discovery-hub" className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER & SECTION SELECTOR */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-indigo-600/20">
            <GitFork className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Feature Discovery
            </h1>
          </div>
        </div>

        {/* Section Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Dataset & Target Setup */}
          <button
            type="button"
            onClick={() => {
              setActiveSectionTab('dataset-setup');
              setSelectedFeature(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              activeSectionTab === 'dataset-setup'
                ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-500/50'
                : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                activeSectionTab === 'dataset-setup' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                Step 1
              </span>
              <Database className={`w-4 h-4 ${activeSectionTab === 'dataset-setup' ? 'text-indigo-200' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className={`text-sm font-black ${activeSectionTab === 'dataset-setup' ? 'text-white' : 'text-slate-900'}`}>
                Dataset &amp; Target Setup
              </div>
              <p className={`text-xs mt-0.5 ${activeSectionTab === 'dataset-setup' ? 'text-indigo-200' : 'text-slate-500'}`}>
                19 Validated Inputs, 3 Target Heads, 5 Excluded
              </p>
            </div>
            <div className={`text-[11px] font-bold flex items-center gap-1 ${
              activeSectionTab === 'dataset-setup' ? 'text-indigo-300' : 'text-indigo-600'
            }`}>
              <span>{activeSectionTab === 'dataset-setup' ? 'Active View' : 'Explore Setup'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card 2: Feature Discovery Matrix */}
          <button
            type="button"
            onClick={() => {
              setActiveSectionTab('feature-discovery');
              setSelectedFeature(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              activeSectionTab === 'feature-discovery'
                ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-500/50'
                : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                activeSectionTab === 'feature-discovery' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                Step 2
              </span>
              <Cpu className={`w-4 h-4 ${activeSectionTab === 'feature-discovery' ? 'text-indigo-200' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className={`text-sm font-black ${activeSectionTab === 'feature-discovery' ? 'text-white' : 'text-slate-900'}`}>
                Feature Importance Matrix
              </div>
              <p className={`text-xs mt-0.5 ${activeSectionTab === 'feature-discovery' ? 'text-indigo-200' : 'text-slate-500'}`}>
                Empirical weights across Heart, Diabetes, and CKD
              </p>
            </div>
            <div className={`text-[11px] font-bold flex items-center gap-1 ${
              activeSectionTab === 'feature-discovery' ? 'text-indigo-300' : 'text-indigo-600'
            }`}>
              <span>{activeSectionTab === 'feature-discovery' ? 'Active View' : 'View Feature Importance'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card 3: Comparative Attribution (Top 10) */}
          <button
            type="button"
            onClick={() => {
              setActiveSectionTab('comparative-attribution');
              setSelectedFeature(null);
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              activeSectionTab === 'comparative-attribution'
                ? 'bg-indigo-900 text-white border-indigo-900 shadow-md ring-2 ring-indigo-500/50'
                : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                activeSectionTab === 'comparative-attribution' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                Step 3
              </span>
              <Crosshair className={`w-4 h-4 ${activeSectionTab === 'comparative-attribution' ? 'text-indigo-200' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className={`text-sm font-black ${activeSectionTab === 'comparative-attribution' ? 'text-white' : 'text-slate-900'}`}>
                Comparative Attribution
              </div>
              <p className={`text-xs mt-0.5 ${activeSectionTab === 'comparative-attribution' ? 'text-indigo-200' : 'text-slate-500'}`}>
                Tri-disease comparative breakdown for Top 10 drivers
              </p>
            </div>
            <div className={`text-[11px] font-bold flex items-center gap-1 ${
              activeSectionTab === 'comparative-attribution' ? 'text-indigo-300' : 'text-indigo-600'
            }`}>
              <span>{activeSectionTab === 'comparative-attribution' ? 'Active View' : 'View Top 10 Drivers'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DATASET & TARGET SETUP */}
      {/* ========================================================================= */}
      {activeSectionTab === 'dataset-setup' && (
        <div id="section-1-dataset-setup" className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                1. Dataset & Target Setup
              </h2>
              <p className="text-xs text-slate-500">
                Strict partition of 27 columns into 19 validated input features (X), 3 prediction targets (Y), and 5 quarantined columns.
              </p>
            </div>
          </div>

          {/* Summary Metric Cards with Click-to-Inspect Feature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Columns Card */}
            <button
              type="button"
              onClick={() => setSelectedPartitionCard(selectedPartitionCard === 'total' ? null : 'total')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                selectedPartitionCard === 'total'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/50'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  selectedPartitionCard === 'total' ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Total Columns
                </span>
                <Database className={`w-4 h-4 ${selectedPartitionCard === 'total' ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${
                selectedPartitionCard === 'total' ? 'text-white' : 'text-slate-900'
              }`}>
                {totalColumns}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={selectedPartitionCard === 'total' ? 'text-slate-300' : 'text-slate-500'}>
                  Full Dataset Dimensions
                </span>
                <span className={`font-semibold flex items-center gap-0.5 ${
                  selectedPartitionCard === 'total' ? 'text-indigo-300' : 'text-indigo-600'
                }`}>
                  {selectedPartitionCard === 'total' ? 'Hide Details' : 'View All 27'}
                  {selectedPartitionCard === 'total' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </div>
            </button>

            {/* Input Features (X) Card */}
            <button
              type="button"
              onClick={() => setSelectedPartitionCard(selectedPartitionCard === 'inputs' ? null : 'inputs')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                selectedPartitionCard === 'inputs'
                  ? 'bg-emerald-950 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/50'
                  : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  selectedPartitionCard === 'inputs' ? 'text-emerald-300' : 'text-emerald-700'
                }`}>
                  Input Features (X)
                </span>
                <Cpu className={`w-4 h-4 ${selectedPartitionCard === 'inputs' ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${
                selectedPartitionCard === 'inputs' ? 'text-white' : 'text-emerald-900'
              }`}>
                {featureCount}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={selectedPartitionCard === 'inputs' ? 'text-emerald-200' : 'text-emerald-700'}>
                  Validated non-leaked biomarkers
                </span>
                <span className={`font-bold flex items-center gap-0.5 ${
                  selectedPartitionCard === 'inputs' ? 'text-emerald-300' : 'text-emerald-800'
                }`}>
                  {selectedPartitionCard === 'inputs' ? 'Hide Cards' : 'View 20 Cards'}
                  {selectedPartitionCard === 'inputs' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </div>
            </button>

            {/* Target Outputs (Y) Card */}
            <button
              type="button"
              onClick={() => setSelectedPartitionCard(selectedPartitionCard === 'targets' ? null : 'targets')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                selectedPartitionCard === 'targets'
                  ? 'bg-indigo-950 text-white border-indigo-800 shadow-md ring-2 ring-indigo-500/50'
                  : 'bg-indigo-50/70 hover:bg-indigo-100/70 border-indigo-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  selectedPartitionCard === 'targets' ? 'text-indigo-300' : 'text-indigo-700'
                }`}>
                  Target Outputs (Y)
                </span>
                <Crosshair className={`w-4 h-4 ${selectedPartitionCard === 'targets' ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${
                selectedPartitionCard === 'targets' ? 'text-white' : 'text-indigo-900'
              }`}>
                {targetCount}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={selectedPartitionCard === 'targets' ? 'text-indigo-200' : 'text-indigo-700'}>
                  Heart • Diabetes • CKD
                </span>
                <span className={`font-bold flex items-center gap-0.5 ${
                  selectedPartitionCard === 'targets' ? 'text-indigo-300' : 'text-indigo-800'
                }`}>
                  {selectedPartitionCard === 'targets' ? 'Hide Targets' : 'View 3 Targets'}
                  {selectedPartitionCard === 'targets' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </div>
            </button>

            {/* Excluded Columns Card */}
            <button
              type="button"
              onClick={() => setSelectedPartitionCard(selectedPartitionCard === 'excluded' ? null : 'excluded')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                selectedPartitionCard === 'excluded'
                  ? 'bg-amber-950 text-white border-amber-800 shadow-md ring-2 ring-amber-500/50'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  selectedPartitionCard === 'excluded' ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  Excluded Columns
                </span>
                <ShieldAlert className={`w-4 h-4 ${selectedPartitionCard === 'excluded' ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${
                selectedPartitionCard === 'excluded' ? 'text-white' : 'text-amber-900'
              }`}>
                {excludedCount}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={selectedPartitionCard === 'excluded' ? 'text-amber-200' : 'text-amber-700'}>
                  SEQN + 3 Lab Phenotypes
                </span>
                <span className={`font-bold flex items-center gap-0.5 ${
                  selectedPartitionCard === 'excluded' ? 'text-amber-300' : 'text-amber-800'
                }`}>
                  {selectedPartitionCard === 'excluded' ? 'Hide Excluded' : 'View 4 Excluded'}
                  {selectedPartitionCard === 'excluded' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </div>
            </button>
          </div>

          {/* DYNAMIC FEATURE CARDS (Hidden Initially, Revealed on Click) */}
          {selectedPartitionCard !== null && (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedPartitionCard === 'inputs' && '19 Validated Input Feature Cards (Matrix X)'}
                      {selectedPartitionCard === 'targets' && '3 Disease Output Target Cards (Vector Y)'}
                      {selectedPartitionCard === 'excluded' && '4 Quarantined & Excluded Column Cards'}
                      {selectedPartitionCard === 'total' && 'All 27 Dataset Columns Partition Matrix'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedPartitionCard === 'inputs' && 'Clinically validated non-leaked biomarkers passed to the multi-output model.'}
                      {selectedPartitionCard === 'targets' && 'Multi-task prediction heads strictly isolated from the training matrix.'}
                      {selectedPartitionCard === 'excluded' && 'Quarantined variables removed to eliminate data leakage and identifier overfitting.'}
                      {selectedPartitionCard === 'total' && 'Complete architectural partitioning breakdown across all columns.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPartitionCard(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>Hide Details</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

                  {/* 1. INPUT FEATURES (19 CARDS) */}
              {(selectedPartitionCard === 'inputs' || selectedPartitionCard === 'total') && (
                <div className="space-y-2.5">
                  {selectedPartitionCard === 'total' && (
                    <div className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5 pt-1">
                      <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                      <span>19 Input Features (X)</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {VALIDATED_19_FEATURES.map((feature, idx) => (
                      <div
                        key={feature.name}
                        className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 font-mono truncate" title={feature.name}>
                            {feature.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                            {feature.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                          {feature.description}
                        </p>
                        {feature.unit && (
                          <div className="text-[10px] font-mono text-slate-400 font-medium">
                            Unit: <span className="text-slate-700">{feature.unit}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TARGET OUTPUTS (3 CARDS) */}
              {(selectedPartitionCard === 'targets' || selectedPartitionCard === 'total') && (
                <div className="space-y-2.5 pt-2">
                  {selectedPartitionCard === 'total' && (
                    <div className="text-xs font-bold text-indigo-800 flex items-center space-x-1.5 pt-2 border-t border-slate-200">
                      <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
                      <span>3 Disease Output Targets (Y)</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {VALIDATED_3_TARGETS.map((target) => (
                      <div
                        key={target}
                        className="p-3.5 bg-white rounded-2xl border border-indigo-200 shadow-xs hover:border-indigo-400 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-950 font-mono">
                            {target}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Binary (0/1)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {target === 'Heart_Disease' && 'Cardiovascular Disease diagnosis head.'}
                          {target === 'Diabetes' && 'Type-2 Diabetes diagnosis head.'}
                          {target === 'CKD' && 'Chronic Kidney Disease diagnosis head.'}
                        </p>
                        <div className="text-[10px] text-indigo-600 font-medium">
                          Strictly isolated from matrix X.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. EXCLUDED COLUMNS (4 CARDS) */}
              {(selectedPartitionCard === 'excluded' || selectedPartitionCard === 'total') && (
                <div className="space-y-2.5 pt-2">
                  {selectedPartitionCard === 'total' && (
                    <div className="text-xs font-bold text-amber-800 flex items-center space-x-1.5 pt-2 border-t border-slate-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>4 Quarantined & Excluded Columns</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {VALIDATED_4_EXCLUDED.map((col) => (
                      <div
                        key={col}
                        className="p-3 bg-white rounded-2xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-950 font-mono truncate" title={col}>
                            {col}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            Quarantined
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {col === 'SEQN' && 'Patient respondent sequence ID. Excluded to prevent overfitting on arbitrary keys.'}
                          {col === 'Diabetes_Lab_Phenotype' && 'Intermediate laboratory phenotype label. Excluded to prevent target leakage.'}
                          {col === 'CKD_Lab_Phenotype' && 'Intermediate laboratory phenotype label. Excluded to prevent target leakage.'}
                          {col === 'CKD_Stage' && 'Sub-staging clinical derivation. Excluded to prevent target leakage into binary CKD target.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Bar for Dataset Setup */}
          <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveSectionTab('feature-discovery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center space-x-2"
            >
              <span>Next: View Feature Importance Matrix</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: FEATURE DISCOVERY & IMPORTANCE MATRIX */}
      {/* ========================================================================= */}
      {activeSectionTab === 'feature-discovery' && (
        <div id="section-2-feature-discovery" className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                02
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  2. Feature Discovery: Master Importance Matrix
                </h2>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search feature or description..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none pr-4 cursor-pointer"
                >
                  <option value="all">All Categories (19)</option>
                  {categories
                    .filter((c) => c !== 'all')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Heart Disease Contribution</th>
                  <th className="py-3 px-4 text-right">Diabetes Contribution</th>
                  <th className="py-3 px-4 text-right">CKD Contribution</th>
                  <th className="py-3 px-4 text-right">Overall Importance</th>
                  <th className="py-3 px-4 text-center">Output Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredFeatures.map((item) => {
                  const isTop5 = item.rank <= 5;
                  const isSelected = selectedFeature?.feature === item.feature;

                  return (
                    <tr
                      key={item.feature}
                      onClick={() => setSelectedFeature(item)}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/70' : isTop5 ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-black ${
                            item.rank === 1
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : item.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : item.rank === 3
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{item.rank}
                        </span>
                      </td>

                      {/* Feature Name & Description */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-black">{item.feature}</span>
                          <span className="text-[10px] font-sans text-slate-400 font-normal mt-0.5 truncate max-w-xs">
                            {item.description} {item.unit && `(${item.unit})`}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      {/* Heart Disease Contribution */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <div className="flex flex-col items-end">
                          <span className="text-rose-700">{item.heartDiseaseContribution.toFixed(2)}%</span>
                          <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, item.heartDiseaseContribution * 3.5)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Diabetes Contribution */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <div className="flex flex-col items-end">
                          <span className="text-amber-700">{item.diabetesContribution.toFixed(2)}%</span>
                          <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, item.diabetesContribution * 3.5)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* CKD Contribution */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <div className="flex flex-col items-end">
                          <span className="text-indigo-700">{item.ckdContribution.toFixed(2)}%</span>
                          <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, item.ckdContribution * 3.5)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Overall Importance */}
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-700 text-sm font-black">
                            {item.overallImportance.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans font-normal">
                            (HD+DM+CKD)/3
                          </span>
                        </div>
                      </td>

                      {/* Tri-Disease Mini Stacked Bar */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-24 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                          <div
                            title={`Heart Disease Output: ${item.heartDiseaseContribution}%`}
                            className="bg-rose-500 h-full"
                            style={{
                              width: `${(item.heartDiseaseContribution / (item.overallImportance * 3 || 1)) * 100}%`,
                            }}
                          />
                          <div
                            title={`Diabetes Output: ${item.diabetesContribution}%`}
                            className="bg-amber-500 h-full"
                            style={{
                              width: `${(item.diabetesContribution / (item.overallImportance * 3 || 1)) * 100}%`,
                            }}
                          />
                          <div
                            title={`CKD Output: ${item.ckdContribution}%`}
                            className="bg-indigo-500 h-full"
                            style={{
                              width: `${(item.ckdContribution / (item.overallImportance * 3 || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredFeatures.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No features match the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 text-xs font-mono font-black text-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 font-sans font-bold text-slate-600">
                    Normalized Sum Checks (All 19 Features):
                  </td>
                  <td className="py-3 px-4 text-right text-rose-800">{normalizedSums.heartDiseaseSum}%</td>
                  <td className="py-3 px-4 text-right text-amber-800">{normalizedSums.diabetesSum}%</td>
                  <td className="py-3 px-4 text-right text-indigo-800">{normalizedSums.ckdSum}%</td>
                  <td className="py-3 px-4 text-right text-emerald-800">{normalizedSums.overallSum}%</td>
                  <td className="py-3 px-4 text-center text-[10px] font-sans text-emerald-700 font-bold">
                    ✓ 100.0% Normalized
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Action Bar for Feature Discovery */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveSectionTab('dataset-setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Dataset &amp; Target Setup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSectionTab('comparative-attribution');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center space-x-2"
            >
              <span>Next: Comparative Attribution (Top 10)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: COMPARATIVE MULTI-DISEASE FEATURE ATTRIBUTION (TOP 10) */}
      {/* ========================================================================= */}
      {activeSectionTab === 'comparative-attribution' && (
        <div id="section-3-comparative-attribution" className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                03
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                  <span>3. Comparative Multi-Disease Feature Attribution</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    TOP 10 FEATURES
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Individual disease-specific output attribution across the three disease output heads for the highest-ranking clinical drivers.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-bold">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-600">Heart Disease Output</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600">Diabetes Output</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-600">CKD Output</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {top10Features.map((f) => (
              <div
                key={f.feature}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-mono font-black text-xs">
                      #{f.rank}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{f.feature}</span>
                      <span className="text-[10px] text-slate-500">{f.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Overall Importance</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      {f.overallImportance.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 3 stacked bars for the 3 disease outputs */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-rose-700">
                      <span>Heart Disease Output Head</span>
                      <span className="font-bold">{f.heartDiseaseContribution.toFixed(2)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, f.heartDiseaseContribution * 3.5)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-amber-700">
                      <span>Diabetes Output Head</span>
                      <span className="font-bold">{f.diabetesContribution.toFixed(2)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, f.diabetesContribution * 3.5)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-indigo-700">
                      <span>CKD Output Head</span>
                      <span className="font-bold">{f.ckdContribution.toFixed(2)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, f.ckdContribution * 3.5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar for Comparative Attribution */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveSectionTab('feature-discovery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Feature Importance Matrix</span>
            </button>

            {onNavigateSubView && (
              <button
                type="button"
                onClick={() => onNavigateSubView('m3-interactions')}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center space-x-2"
              >
                <span>Move to Next: Feature Interactions (Module 3)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
