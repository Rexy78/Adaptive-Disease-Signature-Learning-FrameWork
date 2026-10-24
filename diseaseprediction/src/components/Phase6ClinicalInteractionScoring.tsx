import React, { useState, useEffect, useMemo } from 'react';
import {
  Phase6Summary,
  Level1FeatureRelevance,
  Level2InteractionRelevance,
  Level3DiseaseSignature,
} from '../types';
import {
  Activity,
  Search,
  Download,
  CheckCircle2,
  Grid,
  Table as TableIcon,
  ArrowRight,
  Sparkles,
  Share2,
  FileText,
  Workflow,
  ChevronRight,
  Info,
  AlertCircle,
} from 'lucide-react';

interface Phase6ClinicalInteractionScoringProps {
  summary: Phase6Summary;
  onExportMatrix?: () => void;
}

export const Phase6ClinicalInteractionScoring: React.FC<Phase6ClinicalInteractionScoringProps> = ({
  summary,
  onExportMatrix,
}) => {
  // Navigation Views: 'overview' | 'level1' | 'level2' | 'level3' | 'hierarchy'
  const [activeTab, setActiveTab] = useState<'overview' | 'level1' | 'level2' | 'level3' | 'hierarchy'>('overview');

  const knowledgeMatrix = summary?.knowledgeMatrix;

  // Extract actual computed diseases list without hardcoding or fabricating
  const diseases = useMemo(() => {
    if (knowledgeMatrix?.diseases && knowledgeMatrix.diseases.length > 0) {
      return knowledgeMatrix.diseases;
    }
    if (summary?.diseaseBreakdown && Object.keys(summary.diseaseBreakdown).length > 0) {
      return Object.keys(summary.diseaseBreakdown);
    }
    if (summary?.pairs && summary.pairs.length > 0) {
      const fromPairs = Array.from(new Set(summary.pairs.map((p) => p.disease).filter(Boolean)));
      if (fromPairs.length > 0) return fromPairs;
    }
    return [];
  }, [knowledgeMatrix, summary]);

  const [selectedDisease, setSelectedDisease] = useState<string>(diseases[0] || 'Diabetes');
  const [featureSearch, setFeatureSearch] = useState<string>('');
  const [interactionSearch, setInteractionSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Synchronize selectedDisease when diseases list changes asynchronously
  useEffect(() => {
    if (diseases.length > 0 && !diseases.includes(selectedDisease)) {
      setSelectedDisease(diseases[0]);
    }
  }, [diseases, selectedDisease]);

  // Actual Level 1 Features (Strictly from computed data, no fake fallbacks)
  const level1Features: Level1FeatureRelevance[] = useMemo(() => {
    return knowledgeMatrix?.level1Features || [];
  }, [knowledgeMatrix]);

  // Actual Level 2 Interactions (Strictly from computed data, no fake fallbacks)
  const level2Interactions: Level2InteractionRelevance[] = useMemo(() => {
    return knowledgeMatrix?.level2Interactions || [];
  }, [knowledgeMatrix]);

  // Actual Level 3 Signatures (Strictly from computed data, no fake fallbacks)
  const level3Signatures: Level3DiseaseSignature[] = useMemo(() => {
    return knowledgeMatrix?.level3Signatures || [];
  }, [knowledgeMatrix]);

  const activeSignature = useMemo(() => {
    if (level3Signatures.length === 0) return null;
    return (
      level3Signatures.find((s) => s.disease.toLowerCase() === selectedDisease.toLowerCase()) ||
      level3Signatures[0]
    );
  }, [level3Signatures, selectedDisease]);

  // Dynamic category list derived strictly from actual Level 1 features
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    level1Features.forEach((f) => {
      if (f.clinicalCategory) cats.add(f.clinicalCategory);
    });
    return ['All', ...Array.from(cats)];
  }, [level1Features]);

  const filteredLevel1 = useMemo(() => {
    return level1Features.filter((f) => {
      const matchesSearch = String(f?.feature ?? '')
        .toLowerCase()
        .includes(String(featureSearch ?? '').toLowerCase());
      const matchesCat = categoryFilter === 'All' || f.clinicalCategory === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [level1Features, featureSearch, categoryFilter]);

  const filteredLevel2 = useMemo(() => {
    return level2Interactions.filter((i) => {
      const search = String(interactionSearch ?? '').toLowerCase();
      return (
        String(i?.pair ?? '').toLowerCase().includes(search) ||
        String(i?.featureA ?? '').toLowerCase().includes(search) ||
        String(i?.featureB ?? '').toLowerCase().includes(search)
      );
    });
  }, [level2Interactions, interactionSearch]);

  // Safe CSV cell escaping helper to handle quotes, commas, and undefined values
  const escapeCSV = (value: unknown): string => {
    const str = String(value ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const exportMatrixCSV = () => {
    const lines: string[] = [];

    // LEVEL 1
    lines.push('=== LEVEL 1: FEATURE RELEVANCE MATRIX ===');
    lines.push(['Feature', 'Category', ...diseases.map((d) => `${d} Relevance`), 'Primary Association'].map(escapeCSV).join(','));
    level1Features.forEach((f) => {
      const row = [
        f.feature,
        f.clinicalCategory,
        ...diseases.map((d) => {
          const s = f.scores?.[d];
          return s !== undefined && s !== null && !Number.isNaN(s) ? s.toFixed(2) : '';
        }),
        f.primaryDisease,
      ];
      lines.push(row.map(escapeCSV).join(','));
    });

    // LEVEL 2
    lines.push('');
    lines.push('=== LEVEL 2: INTERACTION RELEVANCE MATRIX ===');
    lines.push(['Interaction', 'Tier', ...diseases.map((d) => `${d} Relevance`), 'Primary Association'].map(escapeCSV).join(','));
    level2Interactions.forEach((i) => {
      const row = [
        i.pair,
        i.category,
        ...diseases.map((d) => {
          const s = i.scores?.[d];
          return s !== undefined && s !== null && !Number.isNaN(s) ? s.toFixed(2) : '';
        }),
        i.primaryDisease,
      ];
      lines.push(row.map(escapeCSV).join(','));
    });

    // LEVEL 3
    lines.push('');
    lines.push('=== LEVEL 3: COMPLETE DISEASE SIGNATURES ===');
    lines.push(['Disease', 'Pattern_Strength', 'Disease_Pattern', 'Important_Features', 'Important_Interactions', 'Signature_Vector'].map(escapeCSV).join(','));
    level3Signatures.forEach((s) => {
      const strength = s.patternStrength ?? s.diagnosticConfidence;
      const strengthFormatted = strength !== undefined && strength !== null ? `${(strength * 100).toFixed(0)}%` : '';
      const row = [
        s.disease,
        strengthFormatted,
        s.diseasePattern,
        s.importantFeatures.join('; '),
        s.importantInteractions.join('; '),
        s.signatureVector.join('; '),
      ];
      lines.push(row.map(escapeCSV).join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'disease_knowledge_matrix_3levels.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (onExportMatrix) {
      onExportMatrix();
    } else {
      exportMatrixCSV();
    }
  };

  // Safe heatmap calculation with range clamping and explicit missing value handling
  const getHeatmapColor = (score?: number | null) => {
    if (score == null || Number.isNaN(score)) {
      return 'bg-slate-100 text-slate-400 font-normal';
    }
    const clamped = Math.max(0, Math.min(1, score));
    if (clamped >= 0.90) return 'bg-emerald-600 text-white font-bold';
    if (clamped >= 0.75) return 'bg-emerald-500/90 text-white font-bold';
    if (clamped >= 0.50) return 'bg-indigo-500 text-white font-bold';
    if (clamped >= 0.30) return 'bg-indigo-100 text-indigo-900 font-medium';
    return 'bg-slate-100 text-slate-600 font-medium';
  };

  const isMatrixAvailable = Boolean(
    knowledgeMatrix &&
      (level1Features.length > 0 || level2Interactions.length > 0 || level3Signatures.length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded uppercase tracking-wider border border-indigo-200/60">
              PHASE 06
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Disease Knowledge Matrix Builder
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            3-Level Knowledge Matrix: Feature Relevance, Interaction Relevance, and Multi-Disease Learned Signatures.
          </p>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>3-Level Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('level1')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'level1'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Level 1: Features</span>
            </button>
            <button
              onClick={() => setActiveTab('level2')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'level2'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Level 2: Interactions</span>
            </button>
            <button
              onClick={() => setActiveTab('level3')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'level3'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Level 3: Signatures</span>
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Hierarchy Flow</span>
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={!isMatrixAvailable}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* Scientific Knowledge Representation Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Single-Hop Flat Mapping Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
              Flat Mapping Approach (Single-Hop)
            </span>
            <span className="text-xs text-slate-400 font-mono">Feature → Disease</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Direct Feature Mapping</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Standard clinical lookup tables typically store single-hop direct links (e.g. <em>HbA1c → Diabetes</em>). This representation does not capture non-linear pairwise interactions or multi-biomarker composite patterns.
          </p>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center justify-center space-x-3 text-xs font-mono">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-bold border border-slate-300">
              Feature (e.g. HbA1c)
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-bold border border-slate-300">
              Disease Target
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Limitation: Does not represent which feature combinations or learned multi-biomarker patterns contribute to disease risk.
          </p>
        </div>

        {/* Hierarchical Multi-Layer Representation */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-5 space-y-3 relative overflow-hidden border border-indigo-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-400/40">
              Hierarchical Matrix Representation
            </span>
            <span className="text-xs text-indigo-300 font-mono">Multi-Stage Knowledge Flow</span>
          </div>
          <h4 className="text-sm font-black text-white">Knowledge Representation Approach</h4>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Unlike a flat feature-to-disease table, this representation stores feature-level relevance, pairwise interaction relevance, and disease-level signatures.
          </p>

          <div className="bg-indigo-900/60 rounded-xl p-2.5 border border-indigo-700/60 flex items-center justify-between text-[11px] font-mono overflow-x-auto">
            <span className="px-1.5 py-0.5 bg-indigo-950 rounded text-indigo-200 font-bold shrink-0">Features</span>
            <span className="text-emerald-400 font-bold px-1">→</span>
            <span className="px-1.5 py-0.5 bg-indigo-950 rounded text-emerald-300 font-bold shrink-0">Interactions</span>
            <span className="text-emerald-400 font-bold px-1">→</span>
            <span className="px-1.5 py-0.5 bg-indigo-950 rounded text-indigo-200 font-bold shrink-0">Pattern</span>
            <span className="text-emerald-400 font-bold px-1">→</span>
            <span className="px-1.5 py-0.5 bg-indigo-950 rounded text-amber-300 font-bold shrink-0">Signature</span>
            <span className="text-emerald-400 font-bold px-1">→</span>
            <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded font-black shrink-0">Disease Target</span>
          </div>
          <p className="text-[11px] text-emerald-300 font-medium">
            Result: Framework stores both individual feature relevance and pairwise interaction relevance in a unified representation.
          </p>
        </div>
      </div>

      {/* Score Semantics Clarification Notice */}
      <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-2xl p-3 px-4 flex items-center space-x-2.5 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong>Scientific Note:</strong> Scores represent normalized predictive and association relevance (0.00 – 1.00) learned from statistical modeling, not direct clinical diagnosis probabilities or biological causality.
        </span>
      </div>

      {/* Disease Filter Pills */}
      {diseases.length > 0 && (
        <div className="flex items-center space-x-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase px-2">Focus Disease:</span>
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {diseases.map((d) => (
              <button
                key={`dis-pill-${d}`}
                onClick={() => setSelectedDisease(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedDisease === d
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Empty State if Knowledge Matrix is completely unpopulated */}
      {!isMatrixAvailable && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Knowledge Matrix has not been generated yet.</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please run the feature scoring and interaction discovery pipeline to populate Level 1 (Feature Relevance), Level 2 (Interaction Relevance), and Level 3 (Disease Signatures).
          </p>
        </div>
      )}

      {/* Tab 1: Complete 3-Level Overview */}
      {isMatrixAvailable && activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Level 1 & Level 2 Side-by-Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level 1 Feature Relevance Matrix Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                    Level 1
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Feature Relevance Matrix
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('level1')}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Full Table</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {level1Features.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No feature relevance scores available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-left">
                        <th className="py-2 px-3">Feature</th>
                        {diseases.map((d) => (
                          <th key={`ov-head-d1-${d}`} className="py-2 px-3 text-center">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {level1Features.slice(0, 6).map((f) => (
                        <tr key={`ov-f-${f.feature}`} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{f.feature}</td>
                          {diseases.map((d) => {
                            const rawScore = f.scores?.[d];
                            const isPresent = rawScore !== undefined && rawScore !== null && !Number.isNaN(rawScore);
                            return (
                              <td key={`ov-f-${f.feature}-${d}`} className="py-2.5 px-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${getHeatmapColor(rawScore)}`}>
                                  {isPresent ? rawScore.toFixed(2) : '—'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Level 2 Interaction Relevance Matrix Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Level 2
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Interaction Relevance Matrix
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('level2')}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Full Table</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {level2Interactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  No interaction scores available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-left">
                        <th className="py-2 px-3">Interaction Pair</th>
                        {diseases.map((d) => (
                          <th key={`ov-head-d2-${d}`} className="py-2 px-3 text-center">
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {level2Interactions.slice(0, 6).map((i) => (
                        <tr key={`ov-i-${i.pair}`} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            <div className="flex items-center space-x-1">
                              <span>{i.featureA}</span>
                              <span className="text-indigo-500 font-black">↔</span>
                              <span>{i.featureB}</span>
                            </div>
                          </td>
                          {diseases.map((d) => {
                            const rawScore = i.scores?.[d];
                            const isPresent = rawScore !== undefined && rawScore !== null && !Number.isNaN(rawScore);
                            return (
                              <td key={`ov-i-${i.pair}-${d}`} className="py-2.5 px-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${getHeatmapColor(rawScore)}`}>
                                  {isPresent ? rawScore.toFixed(2) : '—'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Level 3 Disease Signature Representation Card */}
          {activeSignature ? (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-900 space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase border border-amber-400/30">
                        Level 3 Signature
                      </span>
                      <h3 className="text-base font-black text-white">
                        Learned Disease Signature: {activeSignature.disease}
                      </h3>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Fused representation storing key features, interactions, and disease syndrome pattern.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-indigo-300 block">Signature Strength</span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {(() => {
                      const strVal = activeSignature.patternStrength ?? activeSignature.diagnosticConfidence;
                      return strVal !== undefined && strVal !== null && !Number.isNaN(strVal)
                        ? `${(strVal * 100).toFixed(0)}%`
                        : '—';
                    })()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Box 1: Important Features */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                    Top Associated Features (Level 1)
                  </span>
                  {activeSignature.importantFeatures.length > 0 ? (
                    <div className="space-y-1.5">
                      {activeSignature.importantFeatures.map((feat, idx) => (
                        <div key={`sig-f-${idx}`} className="flex items-center space-x-1.5 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white">{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No feature associations recorded.</p>
                  )}
                </div>

                {/* Box 2: Important Interactions */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                    Top Predictive Interactions (Level 2)
                  </span>
                  {activeSignature.importantInteractions.length > 0 ? (
                    <div className="space-y-1.5">
                      {activeSignature.importantInteractions.map((pair, idx) => (
                        <div key={`sig-i-${idx}`} className="flex items-center space-x-1.5 text-xs">
                          <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="font-bold text-indigo-100">{pair}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No interaction associations recorded.</p>
                  )}
                </div>

                {/* Box 3: Disease Pattern */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                    Learned Disease Pattern (Level 3)
                  </span>
                  <span className="font-bold text-xs text-white block">
                    {activeSignature.diseasePattern || 'Standard Pattern'}
                  </span>
                  {activeSignature.patternDescription && (
                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                      {activeSignature.patternDescription}
                    </p>
                  )}
                  {activeSignature.pathologyMechanism && (
                    <div className="pt-2 border-t border-white/10 text-[10px] text-indigo-200">
                      <span className="font-bold text-indigo-300">Clinical Annotation: </span>
                      {activeSignature.pathologyMechanism}
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Vector */}
              {activeSignature.signatureVector && activeSignature.signatureVector.length > 0 && (
                <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-indigo-300 font-bold">Signature Representation Vector:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSignature.signatureVector.map((v, idx) => (
                      <span
                        key={`vec-${idx}`}
                        className="px-2 py-0.5 bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 rounded-lg text-[11px]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              No disease signatures available.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Level 1 — Feature Relevance Matrix Table */}
      {isMatrixAvailable && activeTab === 'level1' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded uppercase">
                  LEVEL 1 KNOWLEDGE
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  Feature Relevance Matrix Across Clinical Conditions
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantifies individual biomarker predictive relevance for each target disease (Normalized Relevance 0.00 – 1.00).
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {availableCategories.map((cat) => (
                  <option key={`cat-opt-${cat}`} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={featureSearch}
              onChange={(e) => setFeatureSearch(e.target.value)}
              placeholder="Search features..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Full Table */}
          {level1Features.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              No feature relevance scores available.
            </div>
          ) : filteredLevel1.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              No features match the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200 text-left">
                    <th className="py-2.5 px-3">Clinical Feature</th>
                    <th className="py-2.5 px-3">Clinical Category</th>
                    {diseases.map((d) => (
                      <th key={`t1-head-${d}`} className="py-2.5 px-3 text-center">
                        {d} Relevance
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Primary Association Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLevel1.map((f, idx) => (
                    <tr key={`t1-row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{f.feature}</td>
                      <td className="py-3 px-3 text-slate-500">{f.clinicalCategory || 'Biomarker'}</td>
                      {diseases.map((d) => {
                        const rawScore = f.scores?.[d];
                        const isPresent = rawScore !== undefined && rawScore !== null && !Number.isNaN(rawScore);
                        return (
                          <td key={`t1-cell-${f.feature}-${d}`} className="py-3 px-3 text-center font-mono">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${getHeatmapColor(rawScore)}`}>
                              {isPresent ? rawScore.toFixed(2) : '—'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                          {f.primaryDisease || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Level 2 — Interaction Relevance Matrix Table */}
      {isMatrixAvailable && activeTab === 'level2' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded uppercase">
                  LEVEL 2 KNOWLEDGE
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  Interaction Relevance Matrix (Pairwise Interactions)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantifies joint predictive relevance of feature pairs for each target disease.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={interactionSearch}
                onChange={(e) => setInteractionSearch(e.target.value)}
                placeholder="Search interactions..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Full Level 2 Table */}
          {level2Interactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              No interaction scores available.
            </div>
          ) : filteredLevel2.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              No interactions match the search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200 text-left">
                    <th className="py-2.5 px-3">Interaction Pair</th>
                    <th className="py-2.5 px-3 text-center">Relevance Tier</th>
                    {diseases.map((d) => (
                      <th key={`t2-head-${d}`} className="py-2.5 px-3 text-center">
                        {d} Relevance
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Primary Association Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLevel2.map((i, idx) => (
                    <tr key={`t2-row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                          <span>{i.featureA}</span>
                          <span className="text-indigo-500 font-black">↔</span>
                          <span>{i.featureB}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            i.category === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : i.category === 'Strong'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {i.category || 'Standard'}
                        </span>
                      </td>
                      {diseases.map((d) => {
                        const rawScore = i.scores?.[d];
                        const isPresent = rawScore !== undefined && rawScore !== null && !Number.isNaN(rawScore);
                        return (
                          <td key={`t2-cell-${i.pair}-${d}`} className="py-3 px-3 text-center font-mono">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${getHeatmapColor(rawScore)}`}>
                              {isPresent ? rawScore.toFixed(2) : '—'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {i.primaryDisease || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Level 3 — Complete Disease Signatures */}
      {isMatrixAvailable && activeTab === 'level3' && (
        <div>
          {level3Signatures.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              No disease signatures available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {level3Signatures.map((sig) => {
                const strength = sig.patternStrength ?? sig.diagnosticConfidence;
                const isSelected = selectedDisease.toLowerCase() === sig.disease.toLowerCase();

                return (
                  <div
                    key={`sig-card-${sig.disease}`}
                    className={`bg-white rounded-3xl border p-6 shadow-xs space-y-4 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Signature Profile
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-1">{sig.disease}</h3>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Signature Strength</span>
                          <span className="text-lg font-mono font-black text-emerald-600">
                            {strength !== undefined && strength !== null && !Number.isNaN(strength)
                              ? `${(strength * 100).toFixed(0)}%`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Important Features */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-extrabold uppercase text-slate-500 block">
                          Top Associated Features
                        </span>
                        {sig.importantFeatures.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {sig.importantFeatures.map((f, idx) => (
                              <span
                                key={`f-tag-${idx}`}
                                className="px-2 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold font-mono"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None identified</span>
                        )}
                      </div>

                      {/* Important Interactions */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-extrabold uppercase text-slate-500 block">
                          Top Predictive Interactions
                        </span>
                        {sig.importantInteractions.length > 0 ? (
                          <div className="space-y-1">
                            {sig.importantInteractions.map((pair, idx) => (
                              <div
                                key={`i-tag-${idx}`}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-900 rounded-lg text-xs font-bold flex items-center justify-between font-mono"
                              >
                                <span>{pair}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None identified</span>
                        )}
                      </div>

                      {/* Disease Pattern */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center space-x-1 text-xs font-black text-slate-800">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{sig.diseasePattern || 'Learned Representation Pattern'}</span>
                        </div>
                        {sig.patternDescription && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {sig.patternDescription}
                          </p>
                        )}
                        {sig.pathologyMechanism && (
                          <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                            <strong>Annotation: </strong> {sig.pathologyMechanism}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedDisease(sig.disease)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Active Focus' : 'Set as Focus'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Hierarchy Flow Diagram */}
      {isMatrixAvailable && activeTab === 'hierarchy' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">
                Disease Knowledge Matrix Structure & Cascading Pathway
              </h3>
              <p className="text-xs text-slate-500">
                Bottom-up knowledge construction from clinical parameters to synthesized disease signatures.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400">Target Representation:</span>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-2xs">
                {activeSignature?.disease || selectedDisease}
              </span>
            </div>
          </div>

          {/* Correct Bottom-Up 5-Stage Stepper Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Stage 1: Clinical Features (Input Layer) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Stage 1
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-2">Clinical Features</h4>
                <p className="text-xs text-slate-600 mt-1">Raw biomarker inputs (metabolic, vascular, renal, lipid parameters).</p>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Biomarker input layer.</p>
            </div>

            {/* Stage 2: Feature Relevance (Level 1) */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Stage 2 (Level 1)
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-2">Feature Relevance</h4>
                <div className="mt-1 space-y-1">
                  {activeSignature && activeSignature.importantFeatures.length > 0 ? (
                    activeSignature.importantFeatures.slice(0, 3).map((f, idx) => (
                      <div key={`st2-${idx}`} className="text-xs font-mono font-bold text-indigo-950">
                        • {f}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">Statistical association</div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Feature relevance scoring.</p>
            </div>

            {/* Stage 3: Feature Interactions */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Stage 3
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-2">Feature Interactions</h4>
                <p className="text-xs text-slate-600 mt-1">Pairwise biomarker coupling and joint evaluation.</p>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Pairwise discovery.</p>
            </div>

            {/* Stage 4: Interaction Relevance (Level 2) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Stage 4 (Level 2)
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-2">Interaction Relevance</h4>
                <div className="mt-1 space-y-1">
                  {activeSignature && activeSignature.importantInteractions.length > 0 ? (
                    activeSignature.importantInteractions.slice(0, 2).map((pair, idx) => (
                      <div key={`st4-${idx}`} className="text-xs font-mono font-bold text-emerald-900">
                        • {pair}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">Predictive interactions</div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Interaction relevance scoring.</p>
            </div>

            {/* Stage 5: Disease Signature (Level 3) & Target Representation */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 flex flex-col justify-between border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-400/30">
                  Stage 5 (Level 3)
                </span>
                <h4 className="text-sm font-black text-white mt-2">Disease Signature</h4>
                <p className="text-xs font-bold text-indigo-200 mt-1">
                  {activeSignature?.disease || selectedDisease}
                </p>
                {activeSignature && (
                  <div className="mt-1 text-xs font-mono text-emerald-400 font-bold">
                    {(() => {
                      const strVal = activeSignature.patternStrength ?? activeSignature.diagnosticConfidence;
                      return strVal !== undefined && strVal !== null && !Number.isNaN(strVal)
                        ? `Strength: ${(strVal * 100).toFixed(0)}%`
                        : '';
                    })()}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Fused vector representation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
