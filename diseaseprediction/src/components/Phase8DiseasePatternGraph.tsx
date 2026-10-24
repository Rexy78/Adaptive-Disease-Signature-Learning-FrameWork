import React, { useState, useMemo } from 'react';
import {
  Phase8Summary,
  PatternGraphNode,
  PatternGraphEdge,
  PatternCrossTalkMapping,
  DiseaseSignatureGraphCard,
  PatientActivationTraceResult,
} from '../types';
import { tracePatientGraphActivation } from '../utils/statistics';
import {
  Network,
  Share2,
  GitFork,
  Layers,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Search,
  Filter,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  Info,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface Phase8Props {
  summary: Phase8Summary;
}

export function Phase8DiseasePatternGraph({ summary }: Phase8Props) {
  // Navigation tabs within Phase 8
  const [activeTab, setActiveTab] = useState<'graph' | 'crosstalk' | 'simulator' | 'signatures' | 'edges'>('graph');

  // Filters for Graph View
  const [selectedSystem, setSelectedSystem] = useState<'All' | 'Metabolism' | 'Cardiovascular' | 'Renal'>('All');
  const [selectedTier, setSelectedTier] = useState<number | 'All'>('All');
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'strong' | 'shared'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('pat-metabolic');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator State
  const [simPreset, setSimPreset] = useState<'diabetic' | 'cardio' | 'renal' | 'multisystem' | 'custom'>('diabetic');
  const [simValues, setSimValues] = useState<Record<string, number>>({
    HbA1c: 8.4,
    Glucose: 172,
    BMI: 32.5,
    Insulin: 26.0,
    LDL: 148,
    'Blood Pressure': 142,
    Creatinine: 1.1,
    eGFR: 84,
  });

  // Handle Preset Change
  const handlePresetSelect = (preset: 'diabetic' | 'cardio' | 'renal' | 'multisystem') => {
    setSimPreset(preset);
    if (preset === 'diabetic') {
      setSimValues({
        HbA1c: 8.8,
        Glucose: 185,
        BMI: 33.2,
        Insulin: 28.5,
        LDL: 125,
        'Blood Pressure': 130,
        Creatinine: 1.0,
        eGFR: 90,
      });
    } else if (preset === 'cardio') {
      setSimValues({
        HbA1c: 5.8,
        Glucose: 105,
        BMI: 27.8,
        Insulin: 11.0,
        LDL: 172,
        'Blood Pressure': 158,
        Creatinine: 1.2,
        eGFR: 78,
      });
    } else if (preset === 'renal') {
      setSimValues({
        HbA1c: 6.2,
        Glucose: 115,
        BMI: 25.4,
        Insulin: 12.0,
        LDL: 130,
        'Blood Pressure': 145,
        Creatinine: 2.5,
        eGFR: 32,
      });
    } else if (preset === 'multisystem') {
      setSimValues({
        HbA1c: 8.2,
        Glucose: 168,
        BMI: 34.5,
        Insulin: 24.0,
        LDL: 160,
        'Blood Pressure': 152,
        Creatinine: 1.6,
        eGFR: 52,
      });
    }
  };

  // Run simulation trace
  const simTraceResult: PatientActivationTraceResult = useMemo(() => {
    return tracePatientGraphActivation(simValues, summary);
  }, [simValues, summary]);

  // Selected node metadata
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return summary.nodes[0] || null;
    return summary.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, summary.nodes]);

  // Connected edges for selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return summary.edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
  }, [selectedNodeId, summary.edges]);

  // Filtered Nodes for Graph rendering
  const filteredNodes = useMemo(() => {
    return summary.nodes.filter((node) => {
      if (selectedSystem !== 'All' && node.system && node.system !== selectedSystem) return false;
      if (selectedTier !== 'All' && node.level !== selectedTier) return false;
      if (searchQuery.trim()) {
        const q = String(searchQuery ?? '').toLowerCase();
        const matchesName = String(node?.name ?? '').toLowerCase().includes(q);
        const matchesDesc = String(node?.description ?? '').toLowerCase().includes(q);
        const matchesDisease = (node?.associatedDiseases ?? []).some((d) => String(d ?? '').toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesDisease) return false;
      }
      return true;
    });
  }, [summary.nodes, selectedSystem, selectedTier, searchQuery]);

  // Filtered Edges for Graph rendering
  const filteredEdges = useMemo(() => {
    const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
    return summary.edges.filter((edge) => {
      if (!activeNodeIds.has(edge.source) || !activeNodeIds.has(edge.target)) return false;
      if (edgeFilter === 'strong' && edge.weight < 0.90) return false;
      if (edgeFilter === 'shared' && !edge.isSharedMechanism) return false;
      return true;
    });
  }, [summary.edges, filteredNodes, edgeFilter]);

  // Group nodes by Level for 4-lane layout
  const level1Nodes = useMemo(() => filteredNodes.filter((n) => n.level === 1), [filteredNodes]);
  const level2Nodes = useMemo(() => filteredNodes.filter((n) => n.level === 2), [filteredNodes]);
  const level3Nodes = useMemo(() => filteredNodes.filter((n) => n.level === 3), [filteredNodes]);
  const level4Nodes = useMemo(() => filteredNodes.filter((n) => n.level === 4), [filteredNodes]);

  // Export Graph JSON
  const handleExportGraphJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'disease_pattern_graph_phase8.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-900/50 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Network className="w-3.5 h-3.5" />
              <span>Phase 08 Knowledge Representation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Multi-Tier Medical Graph</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Disease Pattern Graph Builder
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Hierarchical weighted knowledge graph: Features → Interactions → Biological Patterns → Disease Signatures → Diseases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportGraphJson}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Graph JSON</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur-xs border border-slate-700/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Graph Nodes</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white">{summary.totalNodes}</span>
              <span className="text-[10px] font-semibold text-indigo-400">4 Hierarchical Tiers</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xs border border-slate-700/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Weighted Edges</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-400">{summary.totalEdges}</span>
              <span className="text-[10px] font-semibold text-slate-400">Avg Weight: {summary.avgEdgeWeight}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xs border border-slate-700/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Shared Mechanisms</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-400">{summary.sharedMechanismsCount}</span>
              <span className="text-[10px] font-semibold text-amber-300">Cross-Talk Pathways</span>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xs border border-slate-700/60 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Primary Hub</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs font-black text-indigo-300 truncate">Metabolic Pattern</span>
              <span className="text-[10px] font-semibold text-emerald-400">3 Endpoints</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'graph'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Interactive Knowledge Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('crosstalk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'crosstalk'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Pattern-to-Disease Cross-Talk</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">Multi-Disease</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Patient Activation Simulator</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">Live Trace</span>
          </button>

          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'signatures'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Generated Disease Signatures</span>
          </button>

          <button
            onClick={() => setActiveTab('edges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'edges'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Edge Weights & Scoring Table</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE KNOWLEDGE GRAPH VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> System:
                </span>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  {(['All', 'Metabolism', 'Cardiovascular', 'Renal'] as const).map((sys) => (
                    <button
                      key={sys}
                      onClick={() => setSelectedSystem(sys)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                        selectedSystem === sys ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sys}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Tier:</span>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  {[
                    { val: 'All', label: 'All' },
                    { val: 1, label: 'L1 Features' },
                    { val: 2, label: 'L2 Patterns' },
                    { val: 3, label: 'L3 Signatures' },
                    { val: 4, label: 'L4 Diseases' },
                  ].map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setSelectedTier(t.val as any)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                        selectedTier === t.val ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Edges:</span>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  {[
                    { val: 'all', label: 'All Edges' },
                    { val: 'strong', label: 'Weight ≥ 0.90' },
                    { val: 'shared', label: 'Shared Cross-Talk' },
                  ].map((e) => (
                    <button
                      key={e.val}
                      onClick={() => setEdgeFilter(e.val as any)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                        edgeFilter === e.val ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search node or disease..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Main 4-Tier Interactive Canvas / Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Lane 1: Level 1 Features */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Tier 1: Features ({level1Nodes.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Biomarkers</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1 custom-scrollbar flex-1">
                {level1Nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isMetabolic = node.system === 'Metabolism';
                  const isCardio = node.system === 'Cardiovascular';
                  const isRenal = node.system === 'Renal';

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{node.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isMetabolic
                              ? 'bg-amber-100 text-amber-800'
                              : isCardio
                              ? 'bg-rose-100 text-rose-800'
                              : isRenal
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {node.system}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {node.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span>Importance: <strong className="text-slate-800">{((node.importance ?? 0.85) * 100).toFixed(0)}%</strong></span>
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                          View Edges <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lane 2: Level 2 Interactions & Patterns */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Tier 2: Patterns & Pairs ({level2Nodes.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Aggregations</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1 custom-scrollbar flex-1">
                {level2Nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isPattern = node.type === 'pattern';

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : isPattern
                          ? 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{node.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          {isPattern ? 'Pattern' : 'Pair'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {node.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span>Strength: <strong className="text-slate-800">{node.importance?.toFixed(2)}</strong></span>
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                          Cross-Talk <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lane 3: Level 3 Disease Signatures */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Tier 3: Signatures ({level3Nodes.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Diagnostic Formulas</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1 custom-scrollbar flex-1">
                {level3Nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{node.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          Formula
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {node.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span>Confidence: <strong className="text-slate-800">{((node.importance ?? 0.88) * 100).toFixed(0)}%</strong></span>
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lane 4: Level 4 Diseases */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Tier 4: Target Diseases ({level4Nodes.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Clinical Outcomes</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1 custom-scrollbar flex-1">
                {level4Nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900">{node.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Target
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {node.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span>Predictive Weight: <strong className="text-emerald-700">{node.importance?.toFixed(2)}</strong></span>
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                          View Links <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Node Inspector Bottom Panel */}
          {selectedNode && (
            <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Tier {selectedNode.level} {selectedNode.type} Node
                      </span>
                      {selectedNode.system && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {selectedNode.system} System
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">{selectedNode.name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Connected Graph Edges</span>
                    <span className="text-sm font-black text-emerald-400">{connectedEdges.length} Active Connections</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Clinical Node Summary
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedNode.description}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400">
                    Associated Diseases: <strong className="text-indigo-300">{selectedNode.associatedDiseases.join(', ')}</strong>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-2 md:col-span-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-emerald-400" /> Incoming & Outgoing Weighted Edges ({connectedEdges.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {connectedEdges.map((edge) => (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{edge.sourceName}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                          <span className="font-bold text-indigo-300">{edge.targetName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{edge.clinicalContribution}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-[10px]">
                            w = {edge.weight.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PATTERN-TO-DISEASE MULTI-DISEASE CROSS-TALK */}
      {/* ========================================================================= */}
      {activeTab === 'crosstalk' && (
        <div className="space-y-6">
          <div className="bg-amber-50 rounded-3xl border border-amber-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <GitFork className="w-4 h-4 text-amber-700" />
                <span>Multi-Disease Biological Mechanism Sharing</span>
              </div>
              <h2 className="text-lg font-black text-amber-950">
                Why Pattern-to-Disease Cross-Talk is Crucial
              </h2>
              <p className="text-xs text-amber-900 leading-relaxed">
                In clinical medicine, biological patterns are not 1-to-1 mappings. A single pattern (e.g. <strong>Metabolic Pattern</strong>) contributes directly to <strong>Diabetes</strong>, <strong>Obesity</strong>, and <strong>Fatty Liver Disease</strong> because diseases share cellular and physiological pathways.
              </p>
            </div>

            <div className="shrink-0 bg-white/80 border border-amber-200 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Cross-Talk Links</span>
              <span className="text-2xl font-black text-amber-950">9 Shared Paths</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summary.patternCrossTalk.map((ct) => {
              const isMetabolic = ct.system === 'Metabolism';
              const isCardio = ct.system === 'Cardiovascular';
              const isRenal = ct.system === 'Renal';

              return (
                <div
                  key={ct.patternName}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isMetabolic
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isCardio
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}
                      >
                        {ct.system} System
                      </span>
                      <span className="text-xs font-black text-indigo-700">
                        Strength: {ct.patternStrength}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900">{ct.patternName}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {ct.clinicalSignificance}
                      </p>
                    </div>

                    {/* Upstream Biomarkers */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Upstream Feeding Biomarkers
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ct.upstreamFeatures.map((feat) => (
                          <span
                            key={feat}
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold shadow-2xs"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Downstream Connected Diseases */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Downstream Disease Cross-Talk
                      </span>
                      <div className="space-y-2">
                        {ct.downstreamDiseases.map((dd) => (
                          <div
                            key={dd.disease}
                            className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-1 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">{dd.disease}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                Edge Weight: {dd.edgeWeight.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-tight">
                              {dd.pathwayMechanism}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Reusability Index:</span>
                    <strong className="text-indigo-600 font-bold">100% Shared Mechanistic Core</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PATIENT ACTIVATION SIMULATOR (HOW IT HELPS PREDICTION) */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>How Graph Activations Drive Universal Predictions</span>
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  Patient Biomarker Graph Activation Tracer
                </h2>
                <p className="text-xs text-slate-500">
                  When a new patient presents with elevated biomarkers, the graph propagates signals along weighted edges: <strong className="text-slate-800">Features → Interactions → Patterns → Signatures → Disease Probability</strong>.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Load Patient Preset:</span>
                <div className="flex rounded-xl bg-slate-100 p-1">
                  {[
                    { id: 'diabetic', label: 'Diabetic Patient' },
                    { id: 'cardio', label: 'Cardio Patient' },
                    { id: 'renal', label: 'Renal Patient' },
                    { id: 'multisystem', label: 'Multi-Comorbid' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetSelect(p.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        simPreset === p.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Slider Controls for Biomarkers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>HbA1c (%):</span>
                  <span className="text-indigo-600">{simValues.HbA1c}</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="12.0"
                  step="0.1"
                  value={simValues.HbA1c}
                  onChange={(e) => {
                    setSimPreset('custom');
                    setSimValues({ ...simValues, HbA1c: parseFloat(e.target.value) });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Glucose (mg/dL):</span>
                  <span className="text-indigo-600">{simValues.Glucose}</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="300"
                  step="1"
                  value={simValues.Glucose}
                  onChange={(e) => {
                    setSimPreset('custom');
                    setSimValues({ ...simValues, Glucose: parseFloat(e.target.value) });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>BMI (kg/m²):</span>
                  <span className="text-indigo-600">{simValues.BMI}</span>
                </div>
                <input
                  type="range"
                  min="18.0"
                  max="45.0"
                  step="0.1"
                  value={simValues.BMI}
                  onChange={(e) => {
                    setSimPreset('custom');
                    setSimValues({ ...simValues, BMI: parseFloat(e.target.value) });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Blood Pressure (mmHg):</span>
                  <span className="text-indigo-600">{simValues['Blood Pressure']}</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="200"
                  step="1"
                  value={simValues['Blood Pressure']}
                  onChange={(e) => {
                    setSimPreset('custom');
                    setSimValues({ ...simValues, 'Blood Pressure': parseFloat(e.target.value) });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Trace Pathway Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Dynamic Graph Pathway Trace
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                {simTraceResult.pathwayExplanation}
              </p>
            </div>

            {/* 4-Step Propagation Flowchart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1: Active Features */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  1. Active Features ({simTraceResult.activeFeatures.length})
                </span>
                <div className="space-y-1.5">
                  {simTraceResult.activeFeatures.map((f) => (
                    <div key={f} className="p-2 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                      {f}
                    </div>
                  ))}
                  {simTraceResult.activeFeatures.length === 0 && (
                    <span className="text-xs text-slate-400 italic">All features in normal reference range</span>
                  )}
                </div>
              </div>

              {/* Step 2: Activated Patterns */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  2. Pattern Activation
                </span>
                <div className="space-y-1.5">
                  {simTraceResult.activatedPatterns.map((p) => (
                    <div
                      key={p.name}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        p.status === 'Very High' || p.status === 'High'
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-amber-200">
                          {(p.activationLevel * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Matched Signatures */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  3. Signature Matching
                </span>
                <div className="space-y-1.5">
                  {simTraceResult.activatedSignatures.map((s) => (
                    <div
                      key={s.disease}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        s.matchScore >= 0.8
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{s.disease} Sig</span>
                        <span className="text-[10px]">{(s.matchScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Final Disease Probabilities */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  4. Disease Outcomes
                </span>
                <div className="space-y-1.5">
                  {simTraceResult.predictedDiseases.slice(0, 3).map((d) => (
                    <div
                      key={d.disease}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        d.riskLevel === 'High'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{d.disease}</span>
                        <span className="text-xs font-black text-emerald-700">
                          {(d.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GENERATED DISEASE SIGNATURES */}
      {/* ========================================================================= */}
      {activeTab === 'signatures' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.diseaseSignatures.map((sig) => (
              <div
                key={sig.signatureName}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                      {sig.disease} Signature
                    </span>
                    <span className="text-xs font-black text-emerald-700">
                      Confidence: {(sig.signatureConfidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900">{sig.signatureName}</h3>
                    <p className="text-xs text-slate-500 mt-1">{sig.explanation}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 font-mono text-[11px] text-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                      Coupling Formula
                    </span>
                    <div className="text-indigo-950 font-bold">{sig.formula}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Key Features
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sig.features.map((f) => (
                          <span key={f} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Shared Comorbidities
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sig.sharedDiseases.map((sd) => (
                          <span key={sd} className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
                            {sd}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Governing Biological Pattern:</span>
                  <strong className="text-indigo-600">{sig.pattern}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EDGE WEIGHTS & SCORING TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'edges' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Graph Edge Weights & Scoring Engine Registry
                </h3>
                <p className="text-xs text-slate-500">
                  Quantitative edge weights derived from Interaction Scoring Engine (ACID & CIS), mapping exact biological influence.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
                {summary.edges.length} Total Registered Edges
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Source Node</th>
                    <th className="py-3 px-2">Link</th>
                    <th className="py-3 px-3">Target Node</th>
                    <th className="py-3 px-3">Edge Weight</th>
                    <th className="py-3 px-3">Weight Rating</th>
                    <th className="py-3 px-3">Edge Category</th>
                    <th className="py-3 px-3">Clinical Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.edges.map((edge) => (
                    <tr key={edge.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{edge.sourceName}</td>
                      <td className="py-2.5 px-2 text-indigo-400"><ArrowRight className="w-3.5 h-3.5" /></td>
                      <td className="py-2.5 px-3 font-bold text-indigo-700">{edge.targetName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {edge.weight.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            edge.weightRating === 'Very Strong'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {edge.weightRating}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {edge.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {edge.clinicalContribution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
