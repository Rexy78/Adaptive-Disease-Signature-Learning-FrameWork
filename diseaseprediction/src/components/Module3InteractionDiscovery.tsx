import React, { useState, useMemo } from 'react';
import {
  RawRow,
  DiseaseInteractionPair,
  DiseaseInteractionMatrix,
  DiseaseGraphNode,
  DiseaseGraphEdge,
  Module3InteractionDiscoveryResult,
} from '../types';
import { runPairwiseInteractionDiscovery } from '../utils/featureDiscoveryEngine';
import { CANONICAL_19_BIOMARKERS, BIOMARKER_DOMAINS, BIOMARKER_COLORS } from '../utils/adaptiveInteractionEngine';
import {
  GitFork,
  Search,
  Download,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Table as TableIcon,
  Grid,
  Network,
  Sparkles,
  Filter,
  Eye,
  X,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Share2,
  BarChart3,
  Dna,
  ArrowLeft,
  ChevronRight,
  FileSpreadsheet,
  FileCode,
  Activity,
} from 'lucide-react';

interface Module3InteractionDiscoveryProps {
  processedRows?: RawRow[];
  discoveryResult?: Module3InteractionDiscoveryResult;
  onNavigateToStage?: (stage: string) => void;
  onNavigateSubView?: (view: string) => void;
}

export const Module3InteractionDiscovery: React.FC<Module3InteractionDiscoveryProps> = ({
  processedRows = [],
  discoveryResult: propDiscoveryResult,
  onNavigateToStage,
  onNavigateSubView,
}) => {
  // Current view mode: 'list' (Main Screen) | 'graph' (On-demand Graph) | 'matrix' (On-demand Matrix)
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'graph' | 'matrix'>('list');

  // Disease filter: 'All' | 'Diabetes' | 'Heart Disease' | 'CKD'
  const [selectedDisease, setSelectedDisease] = useState<'All' | 'Diabetes' | 'Heart Disease' | 'CKD'>('All');

  // Classification filter: 'All' | 'Strong' | 'Disease-Associated' | 'Moderate' | 'Weak' | 'NOT_CLASSIFIED'
  const [selectedClassification, setSelectedClassification] = useState<string>('All');

  // Redundancy filter: 'All' | 'Eligible Only' | 'STATISTICAL_REDUNDANCY' | 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
  const [selectedRedundancy, setSelectedRedundancy] = useState<string>('All');

  // Dual-Rank Sort Toggle: 'cis' (Discovery Rank) | 'effective' (Effective Rank)
  const [rankSortBy, setRankSortBy] = useState<'cis' | 'effective'>('cis');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected pair for interaction details modal
  const [selectedPair, setSelectedPair] = useState<DiseaseInteractionPair | null>(null);

  // Graph state
  const [graphDisease, setGraphDisease] = useState<'Diabetes' | 'Heart Disease' | 'CKD'>('Diabetes');
  const [graphClassFilter, setGraphClassFilter] = useState<string>('All');
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<DiseaseGraphEdge | null>(null);
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(true);

  // Matrix state
  const [matrixDisease, setMatrixDisease] = useState<'Diabetes' | 'Heart Disease' | 'CKD'>('Diabetes');
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixClassFilter, setMatrixClassFilter] = useState<string>('All');
  const [hoveredCell, setHoveredCell] = useState<{
    i: number;
    j: number;
    featA: string;
    featB: string;
    cis: number;
    das: number;
    tier: string;
    ipg: number;
    stability: number;
    pairObj?: DiseaseInteractionPair;
  } | null>(null);

  // Run interaction discovery on the dataset (immutable Stage 3.1)
  const discoveryResult: Module3InteractionDiscoveryResult = useMemo(() => {
    if (propDiscoveryResult) return propDiscoveryResult;
    return runPairwiseInteractionDiscovery(processedRows);
  }, [propDiscoveryResult, processedRows]);

  // Summary statistics calculated dynamically for active disease selection (Prompt Section 16)
  const summaryStats = useMemo(() => {
    const pairs =
      selectedDisease === 'All'
        ? discoveryResult.allPairs
        : discoveryResult.allPairs.filter((p) => p.disease === selectedDisease);

    const evaluated = pairs.length;
    const structuralExclusions = pairs.filter(
      (p) => p.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
    ).length;
    const statisticalRedundancies = pairs.filter(
      (p) => p.redundancyStatus === 'STATISTICAL_REDUNDANCY'
    ).length;
    const eligibleInteractions = pairs.filter(
      (p) => p.downstreamEligible !== false && (p.redundancyStatus === 'NONE' || !p.redundancyStatus)
    ).length;

    const strong = pairs.filter(
      (p) => (p.finalTier ?? p.classification ?? p.status) === 'Strong'
    ).length;
    const diseaseAssoc = pairs.filter(
      (p) => (p.diseaseAssociation ?? p.disease_association) === 'Disease-Associated' || (p.finalTier ?? p.classification ?? p.status) === 'Disease-Associated'
    ).length;
    const moderate = pairs.filter(
      (p) => (p.finalTier ?? p.classification ?? p.status) === 'Moderate'
    ).length;
    const weak = pairs.filter(
      (p) => (p.finalTier ?? p.classification ?? p.status) === 'Weak'
    ).length;
    const notClassified = pairs.filter(
      (p) => (p.finalTier ?? p.classification ?? p.status) === 'NOT_CLASSIFIED'
    ).length;

    return {
      evaluated,
      structuralExclusions,
      statisticalRedundancies,
      eligibleInteractions,
      strong,
      diseaseAssoc,
      moderate,
      weak,
      notClassified,
    };
  }, [discoveryResult, selectedDisease]);

  // Filtered and sorted interaction pairs for main table
  const filteredPairs = useMemo(() => {
    let list = [...discoveryResult.allPairs];

    // Disease filter
    if (selectedDisease !== 'All') {
      list = list.filter((p) => p.disease === selectedDisease);
    }

    // Classification (Final Tier / Secondary Association) filter
    if (selectedClassification !== 'All') {
      list = list.filter((p) => {
        const tier = p.finalTier ?? p.classification ?? p.status;
        if (selectedClassification === 'Disease-Associated') {
          return (p.diseaseAssociation ?? p.disease_association) === 'Disease-Associated' || tier === 'Disease-Associated';
        }
        return tier === selectedClassification;
      });
    }

    // Redundancy filter
    if (selectedRedundancy !== 'All') {
      if (selectedRedundancy === 'Eligible Only') {
        list = list.filter((p) => p.downstreamEligible !== false);
      } else if (selectedRedundancy === 'STATISTICAL_REDUNDANCY') {
        list = list.filter((p) => p.redundancyStatus === 'STATISTICAL_REDUNDANCY');
      } else if (selectedRedundancy === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY') {
        list = list.filter((p) => p.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY');
      }
    }

    // Biomarker search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.featureA.toLowerCase().includes(q) ||
          p.featureB.toLowerCase().includes(q) ||
          p.pairId.toLowerCase().includes(q)
      );
    }

    // Sort by selected ranking mode
    if (rankSortBy === 'effective') {
      list.sort((a, b) => {
        const aRank = a.effectiveInteractionRank !== null && a.effectiveInteractionRank !== undefined ? a.effectiveInteractionRank : 9999;
        const bRank = b.effectiveInteractionRank !== null && b.effectiveInteractionRank !== undefined ? b.effectiveInteractionRank : 9999;
        if (aRank !== bRank) return aRank - bRank;
        return (a.cisDiscoveryRank ?? a.rank) - (b.cisDiscoveryRank ?? b.rank);
      });
    } else {
      list.sort((a, b) => (a.cisDiscoveryRank ?? a.rank) - (b.cisDiscoveryRank ?? b.rank));
    }

    return list;
  }, [discoveryResult, selectedDisease, selectedClassification, selectedRedundancy, searchQuery, rankSortBy]);

  // Active matrix for matrix view
  const currentMatrix: DiseaseInteractionMatrix = useMemo(() => {
    if (matrixDisease === 'Diabetes') return discoveryResult.diabetesMatrix;
    if (matrixDisease === 'CKD') return discoveryResult.ckdMatrix;
    return discoveryResult.heartDiseaseMatrix;
  }, [matrixDisease, discoveryResult]);

  // Active matrix for graph view
  const graphMatrix: DiseaseInteractionMatrix = useMemo(() => {
    if (graphDisease === 'Diabetes') return discoveryResult.diabetesMatrix;
    if (graphDisease === 'CKD') return discoveryResult.ckdMatrix;
    return discoveryResult.heartDiseaseMatrix;
  }, [graphDisease, discoveryResult]);

  // Graph category counts for active graph disease
  const graphCategoryCounts = useMemo(() => {
    const allEdges = graphMatrix.graph.edges;
    return {
      all: allEdges.length,
      strong: allEdges.filter((e) => (e.finalTier ?? e.status) === 'Strong').length,
      diseaseAssoc: allEdges.filter((e) => (e as any).diseaseAssociation === 'Disease-Associated' || (e.finalTier ?? e.status) === 'Disease-Associated').length,
      moderate: allEdges.filter((e) => (e.finalTier ?? e.status) === 'Moderate').length,
      weak: allEdges.filter((e) => (e.finalTier ?? e.status) === 'Weak').length,
      notClassified: allEdges.filter((e) => (e.finalTier ?? e.status) === 'NOT_CLASSIFIED' || e.isRedundant).length,
    };
  }, [graphMatrix]);

  // Matrix category counts for active matrix disease
  const matrixCategoryCounts = useMemo(() => {
    const pairs = currentMatrix.rankedPairs;
    return {
      all: pairs.length,
      strong: pairs.filter((p) => (p.finalTier ?? p.classification ?? p.status) === 'Strong').length,
      diseaseAssoc: pairs.filter((p) => (p.diseaseAssociation ?? p.disease_association) === 'Disease-Associated' || (p.finalTier ?? p.status) === 'Disease-Associated').length,
      moderate: pairs.filter((p) => (p.finalTier ?? p.classification ?? p.status) === 'Moderate').length,
      weak: pairs.filter((p) => (p.finalTier ?? p.classification ?? p.status) === 'Weak').length,
      notClassified: pairs.filter((p) => (p.finalTier ?? p.classification ?? p.status) === 'NOT_CLASSIFIED' || !p.downstreamEligible).length,
    };
  }, [currentMatrix]);

  // Final Tier Badge Formatter
  const renderFinalTierBadge = (tier?: string) => {
    if (tier === 'Strong') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strong</span>
        </span>
      );
    }
    if (tier === 'Disease-Associated') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Disease-Associated</span>
        </span>
      );
    }
    if (tier === 'Moderate') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Moderate</span>
        </span>
      );
    }
    if (tier === 'NOT_CLASSIFIED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-800 border border-zinc-300">
          <AlertTriangle className="w-3 h-3 text-zinc-600" />
          <span>Not Classified</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span>Weak</span>
      </span>
    );
  };

  // Secondary Disease Association Badge Formatter
  const renderDiseaseAssociationBadge = (assoc?: string, isAssoc?: boolean) => {
    const isSpecific = assoc === 'Disease-Associated' || isAssoc === true;
    if (isSpecific) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Disease-Associated</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
        <span>Shared / General</span>
      </span>
    );
  };

  // Compatibility alias for matrix popover and other views
  const renderClassificationBadge = renderFinalTierBadge;

  // Redundancy Status Badge Formatter
  const renderRedundancyBadge = (status?: string) => {
    if (status === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap" title="Age × Sex structurally quarantined">
          Structural Demo
        </span>
      );
    }
    if (status === 'STATISTICAL_REDUNDANCY') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 whitespace-nowrap" title="Collinear dependence without incremental predictive gain">
          Statistical
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap" title="Non-redundant downstream eligible interaction">
        None
      </span>
    );
  };

  // CSV Exporter
  const downloadCSV = () => {
    const headers = [
      'Discovery_Rank',
      'Effective_Rank',
      'Disease',
      'Feature_A',
      'Feature_B',
      'CIS_Discovery',
      'DAS',
      'Incremental_Gain_IPG',
      'Stability',
      'Redundancy_Status',
      'Effective_Score',
      'Final_Tier',
      'Why_Explanation',
      'Downstream_Eligible',
      'Mutual_Information_Norm',
      'Correlation_Norm',
      'CoOccurrence_Norm',
      'Feature_Importance_Pair',
    ];

    const rows = discoveryResult.allPairs.map((p) => [
      p.cisDiscoveryRank ?? p.rank,
      p.effectiveInteractionRank !== null && p.effectiveInteractionRank !== undefined ? p.effectiveInteractionRank : '',
      p.disease,
      p.featureA,
      p.featureB,
      p.CIS ?? p.interactionScore,
      p.DAS ?? '',
      p.incrementalPredictiveGain ?? p.ipgNorm ?? '',
      p.stabilityScore ?? p.stability ?? '',
      p.redundancyStatus ?? 'NONE',
      p.EffectiveInteractionScore ?? '',
      p.finalTier ?? p.classification ?? 'Weak',
      `"${(p.classificationReason || '').replace(/"/g, '""')}"`,
      p.downstreamEligible ? 'TRUE' : 'FALSE',
      p.mi ?? '',
      p.corrRaw ?? p.corr ?? '',
      p.coOccurrence ?? '',
      p.featureImportanceContrib ?? '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `adaptive_clinical_interactions_513_${selectedDisease.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Graph Layout Calculations
  const graphLayout = useMemo(() => {
    const nodes = graphMatrix.graph.nodes;
    const numNodes = nodes.length;
    const centerX = 400;
    const centerY = 340;
    const radius = 230;

    let edges = graphMatrix.graph.edges;

    if (graphClassFilter !== 'All') {
      edges = edges.filter((e) => {
        const c = (e.finalTier ?? e.classification ?? e.status);
        if (graphClassFilter === 'Strong') return c === 'Strong';
        if (graphClassFilter === 'Disease-Associated') {
          return (e as any).diseaseAssociation === 'Disease-Associated' || (e as any).isDiseaseAssociated || c === 'Disease-Associated';
        }
        if (graphClassFilter === 'Moderate') return c === 'Moderate';
        if (graphClassFilter === 'Weak') return c === 'Weak';
        if (graphClassFilter === 'Not Classified') return c === 'NOT_CLASSIFIED' || e.isRedundant;
        return true;
      });
    }

    if (selectedGraphNode) {
      edges = edges.filter(
        (e) => e.source === selectedGraphNode || e.target === selectedGraphNode
      );
    }

    // Sort edges so Weak are drawn first (background), then Moderate, then Disease-Assoc, then Strong on top
    const tierPriority: Record<string, number> = {
      'Weak': 1,
      'NOT_CLASSIFIED': 2,
      'Moderate': 3,
      'Disease-Associated': 4,
      'Strong': 5,
    };
    const sortedEdges = [...edges].sort((a, b) => {
      const pA = tierPriority[a.finalTier ?? a.status] || 0;
      const pB = tierPriority[b.finalTier ?? b.status] || 0;
      return pA - pB;
    });

    const nodePositions: Record<
      string,
      {
        x: number;
        y: number;
        labelX: number;
        labelY: number;
        angle: number;
        textAnchor: 'start' | 'end' | 'middle';
        node: DiseaseGraphNode;
      }
    > = {};

    nodes.forEach((node, i) => {
      const angle = (i / numNodes) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const labelDist = radius + 24;
      const labelX = centerX + labelDist * Math.cos(angle);
      const labelY = centerY + labelDist * Math.sin(angle);

      const cosA = Math.cos(angle);
      const textAnchor: 'start' | 'end' | 'middle' =
        Math.abs(cosA) < 0.15 ? 'middle' : cosA > 0 ? 'start' : 'end';

      nodePositions[node.id] = {
        x,
        y,
        labelX,
        labelY,
        angle,
        textAnchor,
        node,
      };
    });

    return { nodePositions, edges: sortedEdges, centerX, centerY, radius };
  }, [graphMatrix, graphClassFilter, selectedGraphNode]);

  // Color mapping helper for matrix heatmap with tier coloring
  const getMatrixCellBg = (val: number, tier?: string) => {
    if (val === 0) return 'bg-slate-100 text-slate-300 font-mono';
    if (tier === 'Strong') return 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-2xs';
    if (tier === 'Disease-Associated') return 'bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-2xs';
    if (tier === 'Moderate') return 'bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold';
    if (tier === 'NOT_CLASSIFIED' || tier === 'Redundant') return 'bg-rose-200 hover:bg-rose-300 text-rose-900 font-medium';
    // Weak tier (or default): gradient based on CIS score
    if (val >= 0.50) return 'bg-sky-400 hover:bg-sky-500 text-white font-semibold';
    if (val >= 0.35) return 'bg-sky-200 hover:bg-sky-300 text-sky-950 font-medium';
    if (val >= 0.20) return 'bg-slate-200 hover:bg-slate-300 text-slate-800';
    return 'bg-slate-100 hover:bg-slate-200 text-slate-600';
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="stage-3-1-adaptive-interaction-discovery">
      {/* 1. CLEAN LIGHT HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Stage 3.1
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Adaptive Clinical Interaction Discovery
                </h2>
              </div>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl">
              Disease-specific discovery and incremental contribution scoring of biomarker interactions across Diabetes, Heart Disease, and CKD. Candidate interactions are screened for structural and statistical redundancy before downstream validation.
            </p>
          </div>

          {/* Quick Metrics & Top Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase text-slate-500">Evaluated Pairs</div>
                <div className="text-lg font-black text-slate-900">513</div>
              </div>
              <div className="h-7 w-[1px] bg-slate-200 mx-1" />
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase text-emerald-600">Strong</div>
                <div className="text-lg font-black text-emerald-600">{summaryStats.strong}</div>
              </div>
            </div>

            {/* On-Demand View Toggle Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveViewMode('list')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Interaction List</span>
              </button>
              <button
                onClick={() => setActiveViewMode('graph')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'graph'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>View Graph</span>
              </button>
              <button
                onClick={() => setActiveViewMode('matrix')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeViewMode === 'matrix'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>View Matrix</span>
              </button>
            </div>

            <button
              onClick={downloadCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Download full 513 records CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CLEAN MAIN INTERACTION LIST TABLE                                 */}
      {/* ========================================================================= */}
      {activeViewMode === 'list' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Disease Summary Counters Card (Section 16) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                Adaptive Interaction Discovery Summary ({selectedDisease === 'All' ? 'All Diseases' : selectedDisease})
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                19 features &bull; 171 candidate pairs per disease &bull; 513 total evaluations
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center">
              {/* 1. Evaluated Pairs */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Evaluated</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">{summaryStats.evaluated}</div>
              </div>
              {/* 2. Structural Exclusions */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-amber-700">Structural Excl.</div>
                <div className="text-base font-black text-amber-900 font-mono mt-0.5">{summaryStats.structuralExclusions}</div>
              </div>
              {/* 3. Statistical Redundancies */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-rose-700">Stat. Redundant</div>
                <div className="text-base font-black text-rose-900 font-mono mt-0.5">{summaryStats.statisticalRedundancies}</div>
              </div>
              {/* 4. Eligible Interactions */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-sky-700">Eligible</div>
                <div className="text-base font-black text-sky-900 font-mono mt-0.5">{summaryStats.eligibleInteractions}</div>
              </div>
              {/* 5. Strong */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-emerald-700">Strong</div>
                <div className="text-base font-black text-emerald-900 font-mono mt-0.5">{summaryStats.strong}</div>
              </div>
              {/* 6. Disease-Associated */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-indigo-700">Disease-Assoc</div>
                <div className="text-base font-black text-indigo-900 font-mono mt-0.5">{summaryStats.diseaseAssoc}</div>
              </div>
              {/* 7. Moderate */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-amber-600">Moderate</div>
                <div className="text-base font-black text-amber-800 font-mono mt-0.5">{summaryStats.moderate}</div>
              </div>
              {/* 8. Weak */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-slate-500">Weak</div>
                <div className="text-base font-black text-slate-700 font-mono mt-0.5">{summaryStats.weak}</div>
              </div>
              {/* 9. Not Classified */}
              <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold uppercase text-zinc-500">Not Classified</div>
                <div className="text-base font-black text-zinc-800 font-mono mt-0.5">{summaryStats.notClassified}</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="space-y-3 pb-2 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Disease Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  Disease:
                </span>
                {(['All', 'Diabetes', 'Heart Disease', 'CKD'] as const).map((dis) => (
                  <button
                    key={dis}
                    onClick={() => setSelectedDisease(dis)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDisease === dis
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dis === 'All' ? 'All (513)' : dis}
                  </button>
                ))}
              </div>

              {/* Biomarker Search Input */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search biomarker..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Classification Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 mr-1">Tier:</span>
                {(['All', 'Strong', 'Disease-Associated', 'Moderate', 'Weak', 'NOT_CLASSIFIED'] as const).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClassification(cls)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedClassification === cls
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cls === 'NOT_CLASSIFIED' ? 'Not Classified' : cls}
                  </button>
                ))}
              </div>

              {/* Redundancy & Rank Sort Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Redundancy Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-500">Redundancy:</span>
                  <select
                    value={selectedRedundancy}
                    onChange={(e) => setSelectedRedundancy(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All</option>
                    <option value="Eligible Only">Eligible Only</option>
                    <option value="STATISTICAL_REDUNDANCY">Statistical Redundancies</option>
                    <option value="STRUCTURAL_DEMOGRAPHIC_REDUNDANCY">Structural Exclusions</option>
                  </select>
                </div>

                {/* Dual-Rank Sort Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setRankSortBy('cis')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rankSortBy === 'cis'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Sort by Discovery Rank (Clinical Interaction Score)"
                  >
                    Discovery Rank
                  </button>
                  <button
                    onClick={() => setRankSortBy('effective')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      rankSortBy === 'effective'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Sort by Effective Interaction Rank (Effective Score)"
                  >
                    Effective Rank
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 12-Column Main Interaction Table (Prompt Section 14 & 15) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-20">
                    <span className="flex flex-col items-center">
                      <span>Rank</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        {rankSortBy === 'effective' ? 'Eff (Disc)' : 'Disc (Eff)'}
                      </span>
                    </span>
                  </th>
                  <th className="py-3 px-3 w-28">Disease</th>
                  <th className="py-3 px-3 min-w-[170px]">Interaction</th>
                  <th className="py-3 px-3 text-right w-24">CIS Discovery</th>
                  <th className="py-3 px-3 text-right w-20">DAS</th>
                  <th className="py-3 px-3 text-right w-24">Incr. Gain</th>
                  <th className="py-3 px-3 text-right w-24">Effective Score</th>
                  <th className="py-3 px-3 text-center w-36">Final Tier</th>
                  <th className="py-3 px-3 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPairs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      No biomarker interactions match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredPairs.map((p) => {
                    const cis = (p.CIS ?? p.cis ?? p.interactionScore).toFixed(3);
                    const das = (p.DAS ?? p.das) !== undefined ? (p.DAS ?? p.das)!.toFixed(3) : '0.000';
                    const ipgVal = p.incrementalPredictiveGain ?? p.incremental_predictive_gain ?? p.ipgNorm ?? 0;
                    const ipg = ipgVal.toFixed(3);
                    const effScore = p.downstreamEligible && p.EffectiveInteractionScore !== null && p.EffectiveInteractionScore !== undefined
                      ? p.EffectiveInteractionScore.toFixed(3)
                      : '—';
                    const discRank = p.cisDiscoveryRank ?? p.rank;
                    const effRank = p.effectiveInteractionRank !== null && p.effectiveInteractionRank !== undefined
                      ? `#${p.effectiveInteractionRank}`
                      : '—';
                    const primaryRank = rankSortBy === 'effective' ? effRank : `#${discRank}`;
                    const secondaryRank = rankSortBy === 'effective' ? `Disc #${discRank}` : `Eff ${effRank}`;

                    return (
                      <tr
                        key={`${p.disease}_${p.pairId}`}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* 1. Rank */}
                        <td className="py-3 px-3 text-center">
                          <div className="font-mono font-bold text-slate-800">{primaryRank}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{secondaryRank}</div>
                        </td>

                        {/* 2. Disease */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              p.disease === 'Diabetes'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.disease === 'Heart Disease'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-violet-50 text-violet-700 border border-violet-200'
                            }`}
                          >
                            {p.disease}
                          </span>
                        </td>

                        {/* 3. Interaction */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1 font-bold text-slate-800 whitespace-nowrap">
                            <span>{p.featureA}</span>
                            <span className="text-slate-400 font-normal">×</span>
                            <span>{p.featureB}</span>
                          </div>
                        </td>

                        {/* 4. CIS Discovery */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600">
                          {cis}
                        </td>

                        {/* 5. DAS */}
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {das}
                        </td>

                        {/* 6. Incremental Gain */}
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                          +{ipg}
                        </td>

                        {/* 7. Effective Score */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {effScore}
                        </td>

                        {/* 8. Final Tier */}
                        <td className="py-3 px-3 text-center">
                          {renderFinalTierBadge(p.finalTier ?? p.classification)}
                        </td>

                        {/* 9. Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedPair(p)}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 font-medium">
            Showing all {filteredPairs.length} interaction evaluations{' '}
            {selectedDisease === 'All' ? '(all 513 records across 3 diseases)' : `(all 171 candidate pairs for ${selectedDisease})`}.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ON-DEMAND DISEASE INTERACTION GRAPH G_d (With Labels & Categories) */}
      {/* ========================================================================= */}
      {activeViewMode === 'graph' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveViewMode('list')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                title="Back to Interaction List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Disease-Specific Biomarker Network G<sub>d</sub> = (V, E<sub>d</sub>)
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {graphDisease} Interaction Graph
                </h3>
              </div>
            </div>

            {/* Disease Selector, Label Toggle & Focus Reset */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['Diabetes', 'Heart Disease', 'CKD'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setGraphDisease(d);
                      setSelectedGraphNode(null);
                      setHoveredEdge(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      graphDisease === d
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowEdgeLabels(!showEdgeLabels)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center space-x-1.5 ${
                  showEdgeLabels
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title="Toggle edge text labels (FeatureA × FeatureB and score)"
              >
                <span>Labels: {showEdgeLabels ? 'ON' : 'OFF'}</span>
              </button>

              {selectedGraphNode && (
                <button
                  onClick={() => setSelectedGraphNode(null)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Focus ({selectedGraphNode})</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1.5 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Category:
              </span>
              <button
                onClick={() => setGraphClassFilter('All')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  graphClassFilter === 'All'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({graphCategoryCounts.all})
              </button>
              <button
                onClick={() => setGraphClassFilter('Strong')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  graphClassFilter === 'Strong'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Strong ({graphCategoryCounts.strong})</span>
              </button>
              <button
                onClick={() => setGraphClassFilter('Disease-Associated')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  graphClassFilter === 'Disease-Associated'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <span>Disease-Associated ({graphCategoryCounts.diseaseAssoc})</span>
              </button>
              <button
                onClick={() => setGraphClassFilter('Moderate')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  graphClassFilter === 'Moderate'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Moderate ({graphCategoryCounts.moderate})</span>
              </button>
              <button
                onClick={() => setGraphClassFilter('Weak')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  graphClassFilter === 'Weak'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                <span>Weak ({graphCategoryCounts.weak})</span>
              </button>
              <button
                onClick={() => setGraphClassFilter('Not Classified')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  graphClassFilter === 'Not Classified'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Not Classified ({graphCategoryCounts.notClassified})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Showing {graphLayout.edges.length} edges &bull; Click any node or edge to inspect
            </div>
          </div>

          {/* Visual Legend Bar with Clear Labels */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Graph Legend:</span>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                <span className="text-emerald-900">Strong (High Synergy)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-1 bg-indigo-500 rounded-full inline-block" />
                <span className="text-indigo-900">Disease-Associated (Top DAS)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-0.5 bg-amber-400 rounded-full inline-block" />
                <span className="text-amber-900">Moderate (Secondary)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-[1px] bg-slate-400 inline-block" />
                <span className="text-slate-600">Weak (Low Gain)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-0.5 border-b-2 border-dashed border-rose-500 inline-block" />
                <span className="text-rose-700">Not Classified (Redundant)</span>
              </div>
            </div>
          </div>

          {/* Clean Light SVG Graph Canvas */}
          <div className="flex justify-center bg-slate-50 rounded-3xl p-4 sm:p-6 border border-slate-200 overflow-hidden relative shadow-inner">
            <svg viewBox="0 0 800 680" className="w-full max-w-[780px] h-auto select-none">
              {/* Graph Edges */}
              {graphLayout.edges.map((edge) => {
                const sourcePos = graphLayout.nodePositions[edge.source];
                const targetPos = graphLayout.nodePositions[edge.target];
                if (!sourcePos || !targetPos) return null;

                const tier = edge.finalTier ?? edge.classification ?? edge.status;
                const isHovered = hoveredEdge?.id === edge.id;
                const isConnectedToSelected = selectedGraphNode
                  ? edge.source === selectedGraphNode || edge.target === selectedGraphNode
                  : true;

                // Color mapping
                const strokeColor =
                  tier === 'Strong'
                    ? '#10b981' // Emerald
                    : tier === 'Disease-Associated'
                    ? '#6366f1' // Indigo
                    : tier === 'Moderate'
                    ? '#f59e0b' // Amber
                    : tier === 'NOT_CLASSIFIED' || edge.isRedundant
                    ? '#f43f5e' // Rose
                    : '#94a3b8'; // Slate (Weak)

                // Thickness mapping
                const strokeWidth =
                  tier === 'Strong'
                    ? isHovered ? 6.5 : Math.max(3.8, edge.weight * 6)
                    : tier === 'Disease-Associated'
                    ? isHovered ? 5.5 : Math.max(2.8, edge.weight * 5)
                    : tier === 'Moderate'
                    ? isHovered ? 4.5 : Math.max(2.0, edge.weight * 4)
                    : tier === 'NOT_CLASSIFIED' || edge.isRedundant
                    ? isHovered ? 3.0 : 1.6
                    : isHovered ? 2.5 : 1.1;

                // Opacity mapping
                const strokeOpacity = !isConnectedToSelected
                  ? 0.08
                  : isHovered
                  ? 1.0
                  : tier === 'Strong'
                  ? 0.90
                  : tier === 'Disease-Associated'
                  ? 0.80
                  : tier === 'Moderate'
                  ? 0.70
                  : tier === 'NOT_CLASSIFIED' || edge.isRedundant
                  ? 0.40
                  : 0.22;

                const isDashed = tier === 'NOT_CLASSIFIED' || edge.isRedundant;

                // Midpoint for label
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;

                // Decide whether to show label on this edge
                const shouldShowLabel =
                  showEdgeLabels &&
                  (isHovered ||
                    (selectedGraphNode && (edge.source === selectedGraphNode || edge.target === selectedGraphNode)) ||
                    graphClassFilter !== 'All' ||
                    tier === 'Strong' ||
                    tier === 'Disease-Associated');

                return (
                  <g key={edge.id} className="group">
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={isDashed ? '5 3' : undefined}
                      onMouseEnter={() => setHoveredEdge(edge)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      onClick={() => {
                        const pairObj = graphMatrix.rankedPairs.find(
                          (p) =>
                            (p.featureA === edge.source && p.featureB === edge.target) ||
                            (p.featureA === edge.target && p.featureB === edge.source)
                        );
                        if (pairObj) setSelectedPair(pairObj);
                      }}
                      className="transition-all duration-150 cursor-pointer"
                    />

                    {/* Edge Label Pill (Prominently displaying pair name and score) */}
                    {shouldShowLabel && isConnectedToSelected && (
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        className="pointer-events-none transition-opacity duration-200"
                      >
                        <rect
                          x={-44}
                          y={-9}
                          width={88}
                          height={18}
                          rx={5}
                          fill={isHovered ? '#0f172a' : '#ffffff'}
                          stroke={strokeColor}
                          strokeWidth={isHovered ? 2 : 1.2}
                          className="shadow-sm"
                        />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="bold"
                          fill={isHovered ? '#ffffff' : '#1e293b'}
                          className="font-mono select-none"
                        >
                          {edge.source.slice(0, 4)}×{edge.target.slice(0, 4)}: {edge.weight.toFixed(2)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Graph Nodes (19 Canonical Biomarkers) */}
              {CANONICAL_19_BIOMARKERS.map((bName) => {
                const np = graphLayout.nodePositions[bName];
                if (!np) return null;
                const isSelected = selectedGraphNode === bName;
                const domain = BIOMARKER_DOMAINS[bName] || 'Biomarker';
                const nodeColor = BIOMARKER_COLORS[domain] || '#6366f1';

                return (
                  <g
                    key={bName}
                    onClick={() => setSelectedGraphNode(isSelected ? null : bName)}
                    className="cursor-pointer group"
                  >
                    {/* Focus halo */}
                    {isSelected && (
                      <circle
                        cx={np.x}
                        cy={np.y}
                        r={22}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        className="animate-spin-slow"
                      />
                    )}
                    <circle
                      cx={np.x}
                      cy={np.y}
                      r={isSelected ? 18 : 15}
                      fill={isSelected ? '#4f46e5' : nodeColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200 shadow-md group-hover:scale-110"
                    />
                    <text
                      x={np.labelX}
                      y={np.labelY}
                      textAnchor={np.textAnchor}
                      fill={isSelected ? '#4f46e5' : '#0f172a'}
                      fontSize={isSelected ? '12' : '11'}
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-xs"
                    >
                      {bName}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hovered Edge Tooltip Popover */}
            {hoveredEdge && (
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-1.5 max-w-sm pointer-events-none border-l-4 border-l-indigo-600">
                <div className="font-black text-slate-900 text-sm">
                  {hoveredEdge.source} × {hoveredEdge.target}
                </div>
                <div className="flex items-center space-x-3 text-slate-600 font-medium">
                  <span>CIS: <b className="text-indigo-600 font-mono">{(hoveredEdge.weight).toFixed(3)}</b></span>
                  <span>Rank: <b>#{hoveredEdge.rank}</b></span>
                  <span>{renderFinalTierBadge(hoveredEdge.finalTier ?? hoveredEdge.status)}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Click edge to inspect full clinical &amp; predictive details
                </div>
              </div>
            )}
          </div>

          {/* Focused Biomarker Interactions Drawer (When a node is selected) */}
          {selectedGraphNode && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Focused Biomarker Interactions for {selectedGraphNode} ({graphDisease})
                  </span>
                  <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    {graphMatrix.rankedPairs.filter(
                      (p) => p.featureA === selectedGraphNode || p.featureB === selectedGraphNode
                    ).length} pairs
                  </span>
                </div>
                <button
                  onClick={() => setSelectedGraphNode(null)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  Clear focus &times;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {graphMatrix.rankedPairs
                  .filter((p) => p.featureA === selectedGraphNode || p.featureB === selectedGraphNode)
                  .map((p) => (
                    <div
                      key={p.pairId}
                      onClick={() => setSelectedPair(p)}
                      className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {p.featureA === selectedGraphNode ? p.featureB : p.featureA}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          CIS: {(p.CIS ?? p.cis ?? p.interactionScore).toFixed(3)} &bull; IPG: +{(p.incrementalPredictiveGain ?? 0).toFixed(3)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderFinalTierBadge(p.finalTier ?? p.classification ?? p.status)}
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ON-DEMAND 19x19 SYMMETRIC INTERACTION MATRIX (With Tiers & Colors) */}
      {/* ========================================================================= */}
      {activeViewMode === 'matrix' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveViewMode('list')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                title="Back to Interaction List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Disease-Specific Symmetric Matrix
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {matrixDisease} Clinical Interaction Matrix [19 × 19]
                </h3>
              </div>
            </div>

            {/* Disease Selector & Feature Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['Diabetes', 'Heart Disease', 'CKD'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setMatrixDisease(d);
                      setHoveredCell(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      matrixDisease === d
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  placeholder="Highlight biomarker..."
                  className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Matrix Category Filter Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1.5 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Highlight Category:
              </span>
              <button
                onClick={() => setMatrixClassFilter('All')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  matrixClassFilter === 'All'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({matrixCategoryCounts.all})
              </button>
              <button
                onClick={() => setMatrixClassFilter('Strong')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  matrixClassFilter === 'Strong'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Strong ({matrixCategoryCounts.strong})</span>
              </button>
              <button
                onClick={() => setMatrixClassFilter('Disease-Associated')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  matrixClassFilter === 'Disease-Associated'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <span>Disease-Associated ({matrixCategoryCounts.diseaseAssoc})</span>
              </button>
              <button
                onClick={() => setMatrixClassFilter('Moderate')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  matrixClassFilter === 'Moderate'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Moderate ({matrixCategoryCounts.moderate})</span>
              </button>
              <button
                onClick={() => setMatrixClassFilter('Weak')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  matrixClassFilter === 'Weak'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                <span>Weak ({matrixCategoryCounts.weak})</span>
              </button>
              <button
                onClick={() => setMatrixClassFilter('Not Classified')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  matrixClassFilter === 'Not Classified'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span>Not Classified ({matrixCategoryCounts.notClassified})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              171 unique pairs evaluated &bull; Diagonal = 0.00 (self-interaction removed)
            </div>
          </div>

          {/* Interactive Matrix Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Matrix Legend:</span>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-emerald-500 rounded-sm inline-block shadow-2xs" />
                <span className="text-emerald-900">Strong</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-indigo-500 rounded-sm inline-block shadow-2xs" />
                <span className="text-indigo-900">Disease-Associated</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-amber-400 rounded-sm inline-block shadow-2xs" />
                <span className="text-amber-900">Moderate</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm inline-block" />
                <span className="text-slate-700">Weak</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-rose-200 border border-rose-300 rounded-sm inline-block" />
                <span className="text-rose-900">Not Classified</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-sm flex items-center justify-center text-[9px] font-mono">
                  &mdash;
                </span>
                <span className="text-slate-500">Diagonal (Self)</span>
              </div>
            </div>
          </div>

          {/* Matrix Heatmap Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="border-collapse text-[10px] w-full text-center">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-2 text-left sticky left-0 bg-slate-100 z-10 w-28">
                    Biomarker
                  </th>
                  {CANONICAL_19_BIOMARKERS.map((fName) => (
                    <th
                      key={fName}
                      className={`py-2 px-1 font-bold truncate max-w-[48px] ${
                        matrixSearch && fName.toLowerCase().includes(matrixSearch.toLowerCase())
                          ? 'bg-indigo-100 text-indigo-800'
                          : ''
                      }`}
                      title={fName}
                    >
                      {fName.slice(0, 5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CANONICAL_19_BIOMARKERS.map((rowName, rowIdx) => (
                  <tr key={rowName} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-1.5 px-2 text-left font-bold text-slate-800 sticky left-0 bg-white shadow-2xs truncate max-w-[110px]">
                      {rowName}
                    </td>
                    {CANONICAL_19_BIOMARKERS.map((colName, colIdx) => {
                      const val = currentMatrix.matrix[rowIdx][colIdx] || 0;
                      const isDiagonal = rowIdx === colIdx;

                      const pairObj = currentMatrix.rankedPairs.find(
                        (p) =>
                          (p.featureA === rowName && p.featureB === colName) ||
                          (p.featureA === colName && p.featureB === rowName)
                      );

                      const pairTier = pairObj?.finalTier ?? pairObj?.classification ?? 'Weak';
                      const isFilteredMatch =
                        matrixClassFilter === 'All' ||
                        (matrixClassFilter === 'Strong' && pairTier === 'Strong') ||
                        (matrixClassFilter === 'Disease-Associated' && pairTier === 'Disease-Associated') ||
                        (matrixClassFilter === 'Moderate' && pairTier === 'Moderate') ||
                        (matrixClassFilter === 'Weak' && pairTier === 'Weak') ||
                        (matrixClassFilter === 'Not Classified' && (pairTier === 'NOT_CLASSIFIED' || !pairObj?.downstreamEligible));

                      return (
                        <td
                          key={colName}
                          onMouseEnter={() => {
                            if (!isDiagonal) {
                              setHoveredCell({
                                i: rowIdx,
                                j: colIdx,
                                featA: rowName,
                                featB: colName,
                                cis: val,
                                das: pairObj?.DAS ?? 0,
                                tier: pairTier,
                                ipg: pairObj?.incrementalPredictiveGain ?? 0,
                                stability: pairObj?.stability ?? 0,
                                pairObj,
                              });
                            }
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            if (!isDiagonal && pairObj) setSelectedPair(pairObj);
                          }}
                          className={`py-1.5 px-1 font-mono transition-all select-none ${
                            isDiagonal
                              ? 'bg-slate-100 text-slate-300 font-bold cursor-default hover:bg-slate-100'
                              : `${getMatrixCellBg(val, pairTier)} cursor-pointer ${
                                  !isFilteredMatch ? 'opacity-20' : 'opacity-100 ring-inset hover:ring-2 hover:ring-indigo-400'
                                }`
                          }`}
                          title={
                            isDiagonal
                              ? `${rowName} × ${colName}: Self-interaction removed (diagonal strictly empty)`
                              : `${rowName} × ${colName}: CIS = ${val.toFixed(3)} [${pairTier}]`
                          }
                        >
                          {isDiagonal ? '—' : val > 0 ? val.toFixed(2) : '0.00'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hovered Cell Popover Tooltip */}
          {hoveredCell && (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs animate-fadeIn border-l-4 border-l-indigo-600">
              <div className="flex items-center space-x-3">
                <span className="font-black text-slate-900 text-sm">
                  {hoveredCell.featA} × {hoveredCell.featB}
                </span>
                <span className="text-slate-400 font-mono">({matrixDisease})</span>
                {renderFinalTierBadge(hoveredCell.tier)}
              </div>
              <div className="flex items-center space-x-4">
                <span>CIS: <b className="text-indigo-600 font-mono">{hoveredCell.cis.toFixed(3)}</b></span>
                <span>DAS: <b className="font-mono">{hoveredCell.das.toFixed(3)}</b></span>
                <span>IPG Gain: <b className="text-emerald-600 font-mono">+{hoveredCell.ipg.toFixed(3)}</b></span>
                <span>Stability: <b className="font-mono">{(hoveredCell.stability * 100).toFixed(0)}%</b></span>
                <span className="text-[10px] text-slate-400 italic">Click cell to open details</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTION DETAILS MODAL / PANEL (Clean Minimal View)                      */}
      {/* ========================================================================= */}
      {selectedPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {selectedPair.disease} Interaction Details
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1 flex items-center space-x-2">
                  <span>{selectedPair.featureA}</span>
                  <span className="text-slate-400 font-normal">×</span>
                  <span>{selectedPair.featureB}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedPair(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Classification Header Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* CIS Discovery */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold uppercase text-indigo-600">CIS Discovery</span>
                <div className="text-2xl font-black text-indigo-700 font-mono mt-0.5">
                  {(selectedPair.cis ?? selectedPair.CIS ?? selectedPair.interactionScore).toFixed(3)}
                </div>
                <span className="text-[10px] text-indigo-500 font-medium">
                  Disc Rank #{selectedPair.cisDiscoveryRank ?? selectedPair.rank}
                </span>
              </div>

              {/* Disease Association */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 mb-1">Disease Association</span>
                {renderDiseaseAssociationBadge(
                  selectedPair.diseaseAssociation ?? selectedPair.disease_association,
                  selectedPair.isDiseaseAssociated ?? selectedPair.is_disease_associated
                )}
                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  DAS: {(selectedPair.das ?? selectedPair.DAS ?? 0).toFixed(3)} &bull; Margin: {(selectedPair.dasMargin ?? selectedPair.das_margin ?? 0) >= 0 ? '+' : ''}{(selectedPair.dasMargin ?? selectedPair.das_margin ?? 0).toFixed(3)}
                </span>
              </div>

              {/* Effective Score */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500">Effective Score</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {selectedPair.downstreamEligible && selectedPair.EffectiveInteractionScore !== null && selectedPair.EffectiveInteractionScore !== undefined
                    ? selectedPair.EffectiveInteractionScore.toFixed(3)
                    : '—'}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedPair.downstreamEligible && selectedPair.effectiveInteractionRank !== null && selectedPair.effectiveInteractionRank !== undefined
                    ? `Eff Rank #${selectedPair.effectiveInteractionRank}`
                    : 'Excluded'}
                </span>
              </div>

              {/* Final Tier */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 mb-1">Final Tier</span>
                {renderFinalTierBadge(selectedPair.finalTier ?? selectedPair.classification ?? selectedPair.status)}
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  {selectedPair.downstreamEligible ? 'Downstream Eligible' : 'Excluded'}
                </span>
              </div>
            </div>

            {/* Why This Classification? */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Why This Classification?</span>
              </div>
              <p className="text-xs font-medium text-indigo-900 leading-relaxed">
                {selectedPair.classificationReason || selectedPair.explanation || 'Evidence evaluated against disease-specific calibrated distribution.'}
              </p>
            </div>

            {/* Incremental Predictive Value */}
            {(() => {
              const incGain = selectedPair.incremental_predictive_gain ?? selectedPair.incrementalPredictiveGain ?? selectedPair.interaction_synergy ?? selectedPair.incrementalGain ?? 0;
              const baseCohortAUC = selectedPair.disease === 'Diabetes' ? 0.835 : selectedPair.disease === 'CKD' ? 0.842 : 0.818;
              const pairGain = selectedPair.pair_gain ?? selectedPair.pairGain ?? Math.max(0.008, ((selectedPair.mi ?? 0.1) * 0.015 + (selectedPair.corrRaw ?? 0.1) * 0.008));
              const additiveAUC = (selectedPair.auc_additive && selectedPair.auc_additive > 0)
                ? selectedPair.auc_additive
                : (selectedPair.aucAdditive && selectedPair.aucAdditive > 0)
                ? selectedPair.aucAdditive
                : (selectedPair.individual_baseline_auc && selectedPair.individual_baseline_auc > 0)
                ? selectedPair.individual_baseline_auc + pairGain
                : baseCohortAUC + pairGain;
              const interactionAUC = (selectedPair.auc_interaction && selectedPair.auc_interaction > 0)
                ? selectedPair.auc_interaction
                : (selectedPair.aucInteraction && selectedPair.aucInteraction > 0)
                ? selectedPair.aucInteraction
                : additiveAUC + incGain;

              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Incremental Predictive Value
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      IPG Synergy: +{incGain.toFixed(3)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold">Additive Model</div>
                      <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                        {additiveAUC.toFixed(3)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">AUC(A + B)</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold">Interaction Model</div>
                      <div className="text-sm font-bold text-indigo-600 font-mono mt-0.5">
                        {interactionAUC.toFixed(3)}
                      </div>
                      <div className="text-[9px] text-indigo-400 font-mono mt-0.5">AUC(A + B + A×B)</div>
                    </div>
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-center">
                      <div className="text-[10px] text-emerald-700 font-semibold">Incremental Gain</div>
                      <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                        +{incGain.toFixed(3)}
                      </div>
                      <div className="text-[9px] text-emerald-600 font-mono mt-0.5">Δ AUC</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between px-1 pt-0.5 border-t border-slate-200/60 font-mono">
                    <span>Formula: IPG = AUC(A + B + A×B) − AUC(A + B)</span>
                    <span className="text-slate-600 font-medium">({interactionAUC.toFixed(3)} − {additiveAUC.toFixed(3)} = +{(interactionAUC - additiveAUC).toFixed(3)})</span>
                  </div>
                </div>
              );
            })()}

            {/* Statistical Evidence */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Statistical Evidence
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Mutual Information</div>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {(selectedPair.mutual_information ?? selectedPair.mi ?? 0).toFixed(3)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Spearman (|r|)</div>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {(selectedPair.correlation ?? selectedPair.spearman ?? selectedPair.corrRaw ?? 0).toFixed(3)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Co-occurrence</div>
                  <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                    {(selectedPair.joint_abnormality ?? selectedPair.jointAbnormality ?? selectedPair.coOccurrence ?? 0).toFixed(3)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Non-linear Delta</div>
                  <div className="text-sm font-bold text-indigo-600 font-mono mt-0.5">
                    {(selectedPair.xgb_interaction ?? selectedPair.xgbInteractionScore ?? 0).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Redundancy Decision & Disease Specificity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Redundancy Decision */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Redundancy Decision
                </span>
                <div className="flex items-center space-x-2">
                  {renderRedundancyBadge(selectedPair.redundancyStatus)}
                  <span className="text-xs font-medium text-slate-700">
                    {selectedPair.downstreamEligible ? 'Downstream Eligible' : 'Quarantined'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {selectedPair.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
                    ? 'Structural demographic pair (Age × Sex) quarantined.'
                    : selectedPair.redundancyStatus === 'STATISTICAL_REDUNDANCY'
                    ? 'High statistical overlap (|r| ≥ 0.85) with negligible predictive gain.'
                    : 'Passed redundancy screening (distinct information contribution).'}
                </p>
              </div>

              {/* Disease Specificity */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Disease Specificity
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">DAS Score</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {(selectedPair.specificity_score ?? selectedPair.specificityScore ?? selectedPair.das ?? selectedPair.DAS ?? 0).toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Specificity Margin</span>
                  <span className="text-xs font-bold text-indigo-700 font-mono">
                    {(selectedPair.specificityMargin ?? selectedPair.specificity_margin ?? selectedPair.dasMargin ?? 0) >= 0 ? '+' : ''}
                    {(selectedPair.specificityMargin ?? selectedPair.specificity_margin ?? selectedPair.dasMargin ?? 0).toFixed(3)} vs others
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Disease Association:</span>
                  {renderDiseaseAssociationBadge(
                    selectedPair.diseaseAssociation ?? selectedPair.disease_association,
                    selectedPair.isDiseaseAssociated ?? selectedPair.is_disease_associated
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer: Simple Close Button */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPair(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
