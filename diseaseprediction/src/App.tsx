import React, { useState, useEffect, Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  RawRow,
  ValidationResult,
  DatasetSummary,
  PreprocessingSummary,
  FeatureMetrics,
  InteractionPair,
  NetworkNode,
  NetworkEdge,
  Phase5Summary,
  Phase6Summary,
  Phase7Summary,
  Phase8Summary,
  Phase9Summary
} from './types';
import { generateMasterDataset, convertToCSV } from './data/defaultDataset';
import { generateNhanesDataset } from './data/nhanesData';
import { validateRawDataset, computeDatasetFingerprint } from './utils/dataParser';
import {
  calculateDatasetSummary,
  runDataPreprocessing,
  computeFeatureImportance,
  discoverClinicalInteractions,
  computeClinicalInteractionScoring,
  learnHierarchicalDiseasePatterns,
  buildDiseasePatternGraph,
  runKaUdpmPredictionPipeline
} from './utils/statistics';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Module1DatasetHub } from './components/Module1DatasetHub';
import { Module2SignatureHub } from './components/Module2SignatureHub';
import { Module3InteractionDiscovery } from './components/Module3InteractionDiscovery';
import { Module3KnowledgeHub } from './components/Module3KnowledgeHub';
import { Stage3HierarchicalPatternLearning } from './components/Stage3HierarchicalPatternLearning';
import { DiseaseProgressionModule } from './components/DiseaseProgressionModule';
import { Phase1Upload } from './components/Phase1Upload';
import { Phase2Summary } from './components/Phase2Summary';
import { Phase3Preprocessing } from './components/Phase3Preprocessing';
import { Phase4FeatureImportance } from './components/Phase4FeatureImportance';
import { Phase5InteractionNetwork } from './components/Phase5InteractionNetwork';
import { Phase6ClinicalInteractionScoring } from './components/Phase6ClinicalInteractionScoring';
import { Phase7HierarchicalPatternLearning } from './components/Phase7HierarchicalPatternLearning';
import { Phase8DiseasePatternGraph } from './components/Phase8DiseasePatternGraph';
import { Phase9KaUdpmPrediction } from './components/Phase9KaUdpmPrediction';
import { Phase10PredictionModule } from './components/Phase10PredictionModule';
import {
  Download,
  Menu,
  Stethoscope,
  CheckCircle,
  Zap,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Database,
  GitFork,
  Brain,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Activity,
  Check,
  PanelLeftOpen,
} from 'lucide-react';

interface TrainedModelCacheEntry {
  fingerprint: string;
  datasetName: string;
  rowCount: number;
  colCount: number;
  trainedAt: string;
  datasetSummary: DatasetSummary;
  processedRows: RawRow[];
  preprocessingSummary: PreprocessingSummary;
  featureMetrics: FeatureMetrics[];
  phase5Summary: Phase5Summary;
  phase6Summary: Phase6Summary;
  phase7Summary: Phase7Summary;
  phase8Summary: Phase8Summary;
  phase9Summary: Phase9Summary;
  topCount: number;
}

interface TrainingStatus {
  isCached: boolean;
  fingerprint: string;
  statusMessage: string;
  trainedAt: string;
  mode: 'cached_model_kept' | 'retrained_from_scratch';
  details?: string;
}

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ModuleErrorBoundary extends React.Component<ModuleErrorBoundaryProps, ModuleErrorBoundaryState> {
  state: ModuleErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Module Error Boundary Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl space-y-4 text-rose-900 my-6">
          <div className="flex items-center space-x-2 font-black text-lg">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <span>Disease Progression Render Recovery</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            A temporary render error was intercepted: {this.state.error?.message || 'Unknown error'}. 
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Reload Module View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // 4 Main Modules Navigation State
  // 1: Dataset & Preprocessing, 2: Disease Signature Learning, 3: Hybrid Disease Prediction, 4: Disease Progression & Future Risk
  const [activeModule, setActiveModule] = useState<number>(1);
  const [activeSubView, setActiveSubView] = useState<string>('m1-all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Core Datasets State
  const [datasetName, setDatasetName] = useState<string>('master_dataset.csv');
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Training & Fingerprint Cache State
  const [currentFingerprint, setCurrentFingerprint] = useState<string>('');
  const [trainedCache, setTrainedCache] = useState<Record<string, TrainedModelCacheEntry>>({});
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);

  // Processed Analysis State
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [processedRows, setProcessedRows] = useState<RawRow[]>([]);
  const [preprocessingSummary, setPreprocessingSummary] = useState<PreprocessingSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showNextModulePreview, setShowNextModulePreview] = useState<boolean>(false);

  // Module details for interactive top navigation
  const moduleDetails = [
    {
      num: 1,
      title: 'Module 1: Dataset & Preprocessing',
      shortTitle: 'Dataset & Ingestion',
      subtitle: 'Cohort Ingestion, KNN Imputation & Summary',
      description: 'Upload and preprocess raw patient records into a standardized clinical matrix.',
      highlights: ['9,254 Cohort Ingestion', 'Zero-null KNN/Median Imputation', 'Distribution Analytics'],
    },
    {
      num: 2,
      title: 'Module 2: Feature Discovery',
      shortTitle: 'Feature Discovery',
      subtitle: 'Unified Multi-Disease Predictive Feature Discovery',
      description: 'Using 19 validated clinical features from the uploaded dataset. Results calculated from actual dataset using a Unified Multi-Output Model with shared representation.',
      highlights: ['19 Validated Features', 'Unified Multi-Output Model', '3 Disease Output Heads'],
    },
    {
      num: 3,
      title: 'Module 3: Clinical Knowledge & Interaction Learning',
      shortTitle: 'Knowledge & Interactions',
      subtitle: '3.1 Discovery • 3.2 Hierarchical Patterns • 3.3 Signatures • 3.4 XGBoost Prediction',
      description: 'Learns pairwise interactions, hierarchical disease patterns, 19-D disease signatures, and trains supervised XGBoost prediction models.',
      highlights: ['570 Evaluated Pairs', '12 Hierarchical Patterns', 'Matrix 2 Membership Matrix', 'XGBoost Prediction Models'],
    },
    {
      num: 4,
      title: 'Module 4: Patient Risk Prediction & Explanation',
      shortTitle: 'Prediction & Explanation',
      subtitle: 'Real Patient Input • XGBoost Risk Inference • SHAP & HDPL Explanation',
      description: 'Enter tested patient clinical values, execute supervised XGBoost disease prediction, evaluate SHAP feature contributions, HDPL interaction evidence, and run what-if simulation.',
      highlights: ['19 Canonical Features Input', '3 Independent XGBoost Models', 'SHAP Feature Attributions', 'Interactive What-If Simulation'],
    },
  ];

  // Feature Importance & Interaction Network State
  const [topCount, setTopCount] = useState<number>(12);
  const [featureMetrics, setFeatureMetrics] = useState<FeatureMetrics[]>([]);
  const [phase5Summary, setPhase5Summary] = useState<Phase5Summary | null>(null);
  const [phase6Summary, setPhase6Summary] = useState<Phase6Summary | null>(null);
  const [phase7Summary, setPhase7Summary] = useState<Phase7Summary | null>(null);
  const [phase8Summary, setPhase8Summary] = useState<Phase8Summary | null>(null);
  const [phase9Summary, setPhase9Summary] = useState<Phase9Summary | null>(null);
  const [interactionPairs, setInteractionPairs] = useState<InteractionPair[]>([]);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [networkEdges, setNetworkEdges] = useState<NetworkEdge[]>([]);

  // Load dataset on startup (check if custom/nhanes was previously selected)
  useEffect(() => {
    try {
      const savedDs = localStorage.getItem('last_loaded_dataset');
      if (savedDs === 'nhanes_multimorbidity_cohort.csv') {
        loadNhanesDataset();
      } else {
        loadMasterDataset();
      }
    } catch {
      loadMasterDataset();
    }
  }, []);

  const handleModuleChange = (mod: number) => {
    setActiveModule(mod);
    if (mod === 1) setActiveSubView('m1-all');
    else if (mod === 2) setActiveSubView('m2-all');
    else if (mod === 3) setActiveSubView('m3-interactions');
    else if (mod === 4) setActiveSubView('m4-overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubViewNavigate = (viewId: string) => {
    if (viewId.startsWith('m1-')) setActiveModule(1);
    else if (viewId.startsWith('m2-')) setActiveModule(2);
    else if (viewId.startsWith('m3-')) setActiveModule(3);
    else if (viewId.startsWith('m4-')) setActiveModule(4);
    setActiveSubView(viewId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMasterDataset = () => {
    try {
      localStorage.setItem('last_loaded_dataset', 'master_dataset.csv');
    } catch {}

    const defaultData = generateMasterDataset();
    const headers = Object.keys(defaultData[0]);
    const { rows, result } = validateRawDataset(defaultData, headers, {
      name: 'master_dataset.csv',
      size: 482000,
      type: 'text/csv',
    });

    const fingerprint = computeDatasetFingerprint(rows, headers, 'master_dataset.csv');
    setDatasetName('master_dataset.csv');
    setRawRows(rows);
    setValidationResult(result);
    setCurrentFingerprint(fingerprint);

    // Calculate Summary
    const summary = calculateDatasetSummary(rows, headers);
    setDatasetSummary(summary);

    // Check if master dataset already cached
    if (trainedCache[fingerprint]) {
      restoreFromCache(trainedCache[fingerprint], fingerprint);
    } else {
      executeFullPipeline(rows, headers, summary, 12, 'master_dataset.csv', fingerprint, false);
    }
  };

  const loadNhanesDataset = () => {
    try {
      localStorage.setItem('last_loaded_dataset', 'nhanes_multimorbidity_cohort.csv');
    } catch {}

    const nhanesData = generateNhanesDataset();
    const headers = Object.keys(nhanesData[0]);
    const { rows, result } = validateRawDataset(nhanesData, headers, {
      name: 'nhanes_multimorbidity_cohort.csv',
      size: 245000,
      type: 'text/csv',
    });

    const fingerprint = computeDatasetFingerprint(rows, headers, 'nhanes_multimorbidity_cohort.csv');
    setDatasetName('nhanes_multimorbidity_cohort.csv');
    setRawRows(rows);
    setValidationResult(result);
    setCurrentFingerprint(fingerprint);

    // Calculate Summary
    const summary = calculateDatasetSummary(rows, headers);
    setDatasetSummary(summary);

    if (trainedCache[fingerprint]) {
      restoreFromCache(trainedCache[fingerprint], fingerprint);
    } else {
      executeFullPipeline(rows, headers, summary, 12, 'nhanes_multimorbidity_cohort.csv', fingerprint, false);
    }
  };

  const restoreFromCache = (cacheEntry: TrainedModelCacheEntry, fp: string) => {
    setProcessedRows(cacheEntry.processedRows);
    setPreprocessingSummary(cacheEntry.preprocessingSummary);
    setFeatureMetrics(cacheEntry.featureMetrics);
    setPhase5Summary(cacheEntry.phase5Summary);
    setInteractionPairs(cacheEntry.phase5Summary.pairs);
    setNetworkNodes(cacheEntry.phase5Summary.nodes);
    setNetworkEdges(cacheEntry.phase5Summary.edges);
    setPhase6Summary(cacheEntry.phase6Summary);
    setPhase7Summary(cacheEntry.phase7Summary);
    setPhase8Summary(cacheEntry.phase8Summary);
    setPhase9Summary(cacheEntry.phase9Summary);

    setTrainingStatus({
      isCached: true,
      fingerprint: fp,
      mode: 'cached_model_kept',
      statusMessage: 'Dataset Loaded — Verified Model Weights & Signatures Active',
      trainedAt: cacheEntry.trainedAt,
      details: `Cohort active (${cacheEntry.rowCount.toLocaleString()} rows x ${cacheEntry.colCount} variables). Clinical parameters and signatures ready.`,
    });
  };

  const executeFullPipeline = (
    inputRows: RawRow[],
    headers: string[],
    summary: DatasetSummary,
    topN: number,
    dsName: string,
    fp: string,
    isDataChanged: boolean,
    preprocessingOptions?: {
      imputationStrategy?: 'Median' | 'Mean' | 'Hybrid';
      normalizationStrategy?: 'Min-Max' | 'Z-Score' | 'Robust';
    }
  ) => {
    setIsProcessing(true);
    setTimeout(() => {
      // Phase 3: Preprocessing
      const { processedRows: pRows, summary: pSummary } = runDataPreprocessing(
        inputRows,
        headers,
        summary.featureTypes,
        preprocessingOptions
      );
      setProcessedRows(pRows);
      setPreprocessingSummary(pSummary);

      // Phase 4: Feature Importance Engine
      const fMetrics = computeFeatureImportance(pRows, pSummary.cleanedHeaders, 'Disease', topN);
      setFeatureMetrics(fMetrics);

      // Phase 5: Interaction Discovery (ACID)
      const topSelected = fMetrics.filter((f) => f.isTopFeature);
      const p5Sum = discoverClinicalInteractions(pRows, topSelected);
      setPhase5Summary(p5Sum);
      setInteractionPairs(p5Sum.pairs);
      setNetworkNodes(p5Sum.nodes);
      setNetworkEdges(p5Sum.edges);

      // Phase 6: Clinical Interaction Scoring (CIS)
      const p6Sum = computeClinicalInteractionScoring(p5Sum.pairs, pRows);
      setPhase6Summary(p6Sum);

      // Phase 7: Hierarchical Disease Pattern Learning (HDPL)
      const p7Sum = learnHierarchicalDiseasePatterns(fMetrics, p6Sum, pRows);
      setPhase7Summary(p7Sum);

      // Phase 8: Disease Pattern Graph Builder Engine
      const p8Sum = buildDiseasePatternGraph(fMetrics, p5Sum, p6Sum, p7Sum, pRows);
      setPhase8Summary(p8Sum);

      // Phase 9: Knowledge-Augmented Universal Disease Prediction Model (KA-UDPM)
      const p9Sum = runKaUdpmPredictionPipeline(p7Sum, p6Sum, fMetrics, pRows);
      setPhase9Summary(p9Sum);

      const trainedAtTime = new Date().toLocaleTimeString();

      // Save to cache
      const cacheEntry: TrainedModelCacheEntry = {
        fingerprint: fp,
        datasetName: dsName,
        rowCount: inputRows.length,
        colCount: headers.length,
        trainedAt: trainedAtTime,
        datasetSummary: summary,
        processedRows: pRows,
        preprocessingSummary: pSummary,
        featureMetrics: fMetrics,
        phase5Summary: p5Sum,
        phase6Summary: p6Sum,
        phase7Summary: p7Sum,
        phase8Summary: p8Sum,
        phase9Summary: p9Sum,
        topCount: topN,
      };

      setTrainedCache((prev) => ({ ...prev, [fp]: cacheEntry }));

      setTrainingStatus({
        isCached: false,
        fingerprint: fp,
        mode: 'retrained_from_scratch',
        statusMessage: 'Dataset Loaded & Processed — XGBoost Classifiers Active',
        trainedAt: trainedAtTime,
        details: 'Dataset features, interaction pairings, and clinical signatures initialized successfully.',
      });

      setIsProcessing(false);
    }, 10);
  };

  // Custom dataset loaded from Phase 1 Upload
  const handleDatasetLoaded = (rows: RawRow[], validation: ValidationResult, fileName: string) => {
    try {
      localStorage.setItem('last_loaded_dataset', fileName);
    } catch {}

    setDatasetName(fileName);
    setRawRows(rows);
    setValidationResult(validation);

    if (rows.length > 0) {
      const headers = validation.headers.length > 0 ? validation.headers : Object.keys(rows[0]);
      const summary = calculateDatasetSummary(rows, headers);
      setDatasetSummary(summary);

      const fp = computeDatasetFingerprint(rows, headers, fileName);
      const isExisting = !!trainedCache[fp];
      setCurrentFingerprint(fp);

      if (isExisting) {
        restoreFromCache(trainedCache[fp], fp);
        setActiveModule(1);
        setActiveSubView('m1-all');
      } else {
        executeFullPipeline(rows, headers, summary, topCount, fileName, fp, true);
        setActiveModule(1);
        setActiveSubView('m1-all');
      }
    }
  };

  const handleTopCountChange = (cnt: number) => {
    setTopCount(cnt);
    if (processedRows.length > 0 && preprocessingSummary) {
      const fMetrics = computeFeatureImportance(processedRows, preprocessingSummary.cleanedHeaders, 'Disease', cnt);
      setFeatureMetrics(fMetrics);
      const topSelected = fMetrics.filter((f) => f.isTopFeature);
      const p5Sum = discoverClinicalInteractions(processedRows, topSelected);
      setPhase5Summary(p5Sum);
      setInteractionPairs(p5Sum.pairs);
      setNetworkNodes(p5Sum.nodes);
      setNetworkEdges(p5Sum.edges);

      const p6Sum = computeClinicalInteractionScoring(p5Sum.pairs, processedRows);
      setPhase6Summary(p6Sum);

      const p7Sum = learnHierarchicalDiseasePatterns(fMetrics, p6Sum, processedRows);
      setPhase7Summary(p7Sum);

      const p9Sum = runKaUdpmPredictionPipeline(p7Sum, p6Sum, fMetrics, processedRows);
      setPhase9Summary(p9Sum);
    }
  };

  const handleRunPreprocessing = (options?: {
    imputationStrategy?: 'Median' | 'Mean' | 'Hybrid';
    normalizationStrategy?: 'Min-Max' | 'Z-Score' | 'Robust';
  }) => {
    if (rawRows.length > 0 && datasetSummary) {
      const headers = validationResult?.headers.length ? validationResult.headers : Object.keys(rawRows[0]);
      const fp = currentFingerprint || computeDatasetFingerprint(rawRows, headers, datasetName);
      executeFullPipeline(rawRows, headers, datasetSummary, topCount, datasetName, fp, true, options);
    }
  };

  const handleDownloadProcessedData = () => {
    if (processedRows.length === 0) return;
    const csvContent = convertToCSV(processedRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `preprocessed_${datasetName}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans flex flex-col lg:flex-row relative">
      {/* Floating Expand Sidebar Button when collapsed */}
      {sidebarCollapsed && (
        <div className="fixed top-4 left-4 z-40 animate-in fade-in slide-in-from-left-2 duration-200">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 hover:text-indigo-600 rounded-2xl border border-slate-200/90 shadow-md hover:shadow-lg transition-all cursor-pointer group"
            title="Expand Sidebar Menu"
            aria-label="Expand Sidebar Menu"
          >
            <PanelLeftOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold tracking-tight">Show Menu</span>
          </button>
        </div>
      )}

      {/* Left Vertical Navigation Sidebar */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={handleModuleChange}
        activeSubView={activeSubView}
        setActiveSubView={handleSubViewNavigate}
        datasetName={datasetName}
        totalRows={rawRows.length}
        isProcessed={!!preprocessingSummary}
        onLoadMaster={loadMasterDataset}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Body */}
      <div className={`flex-1 flex flex-col min-w-0 justify-between p-4 sm:p-6 lg:p-8 overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : ''}`}>
        <div className="w-full max-w-[1720px] mx-auto space-y-6">
          {/* Mobile Top Header Bar with Hamburger Menu (Light Theme) */}
          <div className="lg:hidden flex justify-between items-center bg-white/95 backdrop-blur-md text-slate-800 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200/80 text-indigo-700 cursor-pointer transition-colors"
            >
              <Menu className="w-4 h-4 text-indigo-600" />
              <span>Menu</span>
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold truncate max-w-[140px] text-slate-800">{datasetName}</span>
            </div>
          </div>

          {/* Main Application Header (Only shown on Page 1) */}
          {activeModule === 1 && (
            <Header
              datasetName={datasetName}
              isProcessed={!!preprocessingSummary}
              onReset={loadMasterDataset}
              onLoadMaster={loadMasterDataset}
              totalRows={rawRows.length}
            />
          )}

          {/* MODULE CONTEXTUAL SUB-VIEW BAR (Shown only for Module 3 & 4 with sub-sections) */}
          {(activeModule === 3 || activeModule === 4) && (
            <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeModule === 3 && (
                  <>
                    <button
                      onClick={() => setActiveSubView('m3-interactions')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        activeSubView === 'm3-interactions'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>3.1 Interaction Discovery</span>
                    </button>
                    <button
                      onClick={() => setActiveSubView('m3-patterns')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        activeSubView === 'm3-patterns'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>3.2 Hierarchical Patterns</span>
                    </button>
                    <button
                      onClick={() => setActiveSubView('m3-signatures')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm3-signatures'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      3.3 Signatures
                    </button>
                    <button
                      onClick={() => setActiveSubView('m3-kaudpm')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm3-kaudpm'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      3.4 KA-UDPM
                    </button>
                    <button
                      onClick={() => setActiveSubView('m3-patient')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm3-patient'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Patient Inference
                    </button>
                  </>
                )}

                {activeModule === 4 && (
                  <>
                    <button
                      onClick={() => setActiveSubView('m4-progression')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm4-progression' || activeSubView === 'm4-overview'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      5-Year Risk Trajectory &amp; Evolution
                    </button>
                    <button
                      onClick={() => setActiveSubView('m4-predictions')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm4-predictions'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      XGBoost Predictions
                    </button>
                    <button
                      onClick={() => setActiveSubView('m4-explanation')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm4-explanation'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      SHAP Explanations
                    </button>
                    <button
                      onClick={() => setActiveSubView('m4-simulation')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm4-simulation'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      What-If Simulation
                    </button>
                    <button
                      onClick={() => setActiveSubView('m4-input')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSubView === 'm4-input'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Clinical Parameters Input
                    </button>
                  </>
                )}
              </div>

              <div className="text-xs font-mono font-semibold text-slate-400 px-2 py-1">
                Module {activeModule} of 4
              </div>
            </div>
          )}

          {/* MAIN MODULE CONTENT VIEWS */}
          <main>
            {/* MODULE 1: DATASET & PREPROCESSING (1-PAGE VIEW) */}
            {activeModule === 1 && (
              <Module1DatasetHub
                datasetName={datasetName}
                totalRows={rawRows.length}
                datasetSummary={datasetSummary}
                preprocessingSummary={preprocessingSummary}
                validationResult={validationResult}
                rawRows={rawRows}
                processedRows={processedRows}
                isProcessing={isProcessing}
                onRunPreprocessing={() => handleRunPreprocessing()}
                onDatasetLoaded={handleDatasetLoaded}
                onNavigateSubView={handleSubViewNavigate}
                onLoadMaster={loadMasterDataset}
                onLoadNhanes={loadNhanesDataset}
              />
            )}

            {/* MODULE 2: DATASET AND TARGET SETUP (PART 1) */}
            {activeModule === 2 && (
              <Module2SignatureHub
                processedRows={processedRows.length > 0 ? processedRows : rawRows}
                rawRows={rawRows}
                datasetName={datasetName}
                datasetSummary={datasetSummary}
                preprocessingSummary={preprocessingSummary}
                validationResult={validationResult}
                onNavigateSubView={handleSubViewNavigate}
              />
            )}

            {/* MODULE 3: CLINICAL KNOWLEDGE & INTERACTION LEARNING */}
            {activeModule === 3 && (
              <>
                {(activeSubView === 'm3-interactions' ||
                  activeSubView === 'm3-patterns' ||
                  activeSubView === 'm3-signatures' ||
                  activeSubView === 'm3-kaudpm' ||
                  activeSubView === 'm3-patient') && (
                  <Module3KnowledgeHub
                    processedRows={processedRows.length > 0 ? processedRows : rawRows}
                    activeSubView={activeSubView}
                    phase9Summary={phase9Summary}
                    phase7Summary={phase7Summary}
                    featureMetrics={featureMetrics}
                    onNavigateSubView={handleSubViewNavigate}
                  />
                )}
              </>
            )}

            {/* MODULE 4: DISEASE PROGRESSION & FUTURE RISK */}
            {activeModule === 4 && (
              <ModuleErrorBoundary>
                <DiseaseProgressionModule
                  processedRows={processedRows.length > 0 ? processedRows : rawRows}
                  activePrediction={phase9Summary?.activePatientPrediction}
                  patientName="Eleanor Vance (MRN-88412)"
                  age={58}
                  disease="Diabetes Mellitus Type 2"
                  activeSubView={activeSubView}
                  onNavigateSubView={handleSubViewNavigate}
                />
              </ModuleErrorBoundary>
            )}

            {/* BOTTOM PAGE NAVIGATION CONTROLS */}
            <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              {activeModule > 1 ? (
                <button
                  onClick={() => {
                    handleModuleChange(activeModule - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span>
                    {activeModule === 2 && 'Previous: Dataset & Preprocessing'}
                    {activeModule === 3 && 'Previous: Feature Discovery'}
                    {activeModule === 4 && 'Previous: Clinical Signatures'}
                  </span>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                <span className="font-mono">Page {activeModule} of 4</span>
              </div>

              {activeModule < 4 ? (
                <button
                  onClick={() => {
                    handleModuleChange(activeModule + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>
                    {activeModule === 1 && 'Next: Feature Discovery'}
                    {activeModule === 2 && 'Next: Clinical Signatures'}
                    {activeModule === 3 && 'Next: Disease Progression'}
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleModuleChange(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restart at Beginning</span>
                </button>
              )}
            </div>
          </main>
        </div>

        {/* Global Footer Bar */}
        <footer className="mt-8 pt-4 border-t border-slate-200/80 max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-3">
          <div className="flex flex-wrap space-x-4 sm:space-x-6 font-mono text-[11px]">
            <span>
              Cohort: <span className="text-slate-700 font-bold">{datasetName}</span>
            </span>
            <span>
              Engine: <span className="text-emerald-600 font-bold">4-Module Unified Architecture</span>
            </span>
            <span>
              XGBoost Prediction: <span className="text-slate-700 font-bold">3 Classifiers Active</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-slate-500">
            <span>Preprocessed & Verified Dataset Active</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
