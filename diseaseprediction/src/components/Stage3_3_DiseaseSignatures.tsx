import React, { useState, useMemo } from 'react';
import {
  Stage3HierarchicalPatternResult,
  Stage3_3_SignatureResult,
  Stage3_3_DiseaseSignature,
  CrossDiseaseSignatureComparison,
} from '../types';
import {
  buildDiseaseSignatures,
  generateDiseaseSignaturesCSV,
  generateSignatureVectorsCSV,
  generateSignatureSimilarityCSV,
} from '../utils/diseaseSignatureEngine';
import {
  Dna,
  ShieldCheck,
  Download,
  Layers,
  Sparkles,
  GitFork,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
  Scale,
  TrendingUp,
} from 'lucide-react';

interface Stage3_3_DiseaseSignaturesProps {
  patternResult: Stage3HierarchicalPatternResult;
  discoveryResult?: any;
  onNavigateToStage?: (stage: '3.1' | '3.2' | '3.2.1' | '3.3' | '3.4' | 'audit') => void;
}

export const Stage3_3_DiseaseSignatures: React.FC<Stage3_3_DiseaseSignaturesProps> = ({
  patternResult,
  onNavigateToStage,
}) => {
  // Build Stage 3.3 Disease Signatures from locked Stage 3.2 patterns
  const signatureResult: Stage3_3_SignatureResult = useMemo(() => {
    return buildDiseaseSignatures(patternResult);
  }, [patternResult]);

  const [selectedDisease, setSelectedDisease] = useState<'Diabetes' | 'Heart Disease' | 'CKD'>('Diabetes');
  const [activeTab, setActiveTab] = useState<'signatures' | 'vector_comparison' | 'cross_disease_matrix'>('signatures');
  const [vectorDisplayMode, setVectorDisplayMode] = useState<'normalized' | 'raw'>('normalized');

  const currentSignature = signatureResult.signatures[selectedDisease];

  // CSV Exporter handler
  const handleDownloadCSV = (type: 'signatures' | 'vectors' | 'similarity') => {
    const lineage = signatureResult.lineage;
    let content = '';
    let filename = '';

    if (type === 'signatures') {
      content = generateDiseaseSignaturesCSV(signatureResult.signatureList, lineage);
      filename = `disease_signatures_${lineage.datasetHash}.csv`;
    } else if (type === 'vectors') {
      content = generateSignatureVectorsCSV(signatureResult.signatureList, signatureResult.featureColumns, lineage);
      filename = `signature_vectors_${lineage.datasetHash}.csv`;
    } else if (type === 'similarity') {
      content = generateSignatureSimilarityCSV(signatureResult.comparisons, lineage);
      filename = `signature_similarity_${lineage.datasetHash}.csv`;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="stage-3-3-disease-signatures">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-900/50 shrink-0">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-black text-sky-400 uppercase tracking-widest bg-sky-950 px-2 py-0.5 rounded-md border border-sky-800">
                  STAGE 3.3
                </span>
                <span className="text-sm font-black text-white">
                  DATA-DERIVED DISEASE SIGNATURE CONSTRUCTION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Synthesizing 19-D Disease Signatures from Stage 3.2 Hierarchical Patterns with L2 Normalization &amp; Cross-Disease Separation.
              </p>
            </div>
          </div>

          {/* Quick Stats & Downloads */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500 mr-1.5">Signatures:</span>
              <span className="text-sky-400 font-bold">3 / 3 Complete</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500 mr-1.5">Normalization:</span>
              <span className="text-emerald-400 font-bold">||Ŝ||₂ = 1.0000</span>
            </div>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleDownloadCSV('signatures')}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Signatures CSV</span>
              </button>
              <button
                onClick={() => handleDownloadCSV('vectors')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Vectors CSV</span>
              </button>
              <button
                onClick={() => handleDownloadCSV('similarity')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Similarity CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* SCIENTIFIC NOTICE */}
        <div className="mt-4 p-3 rounded-2xl bg-sky-950/70 border border-sky-800/80 flex items-start space-x-2.5 text-xs text-sky-200">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Scientific Interpretation Notice:</strong> These are statistically learned disease-associated feature patterns and signature vectors derived from cohort data and disease-specific interaction graphs. They do not represent confirmed biological mechanisms, causal pathways, clinical diagnoses, or individual disease probabilities.
          </p>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'signatures'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Disease Signatures (3 Heads)</span>
          </button>
          <button
            onClick={() => setActiveTab('vector_comparison')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'vector_comparison'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>19-D Signature Vectors</span>
          </button>
          <button
            onClick={() => setActiveTab('cross_disease_matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'cross_disease_matrix'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Cross-Disease Separation Matrix</span>
          </button>
        </div>

        {/* Disease Switcher Pills */}
        {activeTab === 'signatures' && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
            {(['Diabetes', 'Heart Disease', 'CKD'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDisease(d)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedDisease === d
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: DISEASE SIGNATURE CARD VIEW */}
      {activeTab === 'signatures' && currentSignature && (
        <div className="space-y-6">
          {/* Main Signature Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {currentSignature.diseaseId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    {currentSignature.qualityGrade}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {currentSignature.signatureName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Constructed from primary disease pattern: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.2 rounded">{currentSignature.primaryPatternId || currentSignature.patterns[0]?.patternId || 'DM-PAT-01'}</code> with L2-normalized 19-D representation.
                </p>
              </div>

              {/* Quantitative Signature Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono">Pattern Strength</span>
                  <span className="text-sm font-bold text-indigo-600 font-mono">
                    {(currentSignature.patternStrength || currentSignature.patternLevelContribution).toFixed(4)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono">Raw Pattern Score</span>
                  <span className="text-sm font-bold text-sky-700 font-mono">
                    {(currentSignature.rawPatternScore || (currentSignature.featureLevelContribution + currentSignature.interactionLevelContribution)).toFixed(4)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono">Feature Contrib (FC)</span>
                  <span className="text-sm font-bold text-sky-600 font-mono">
                    {currentSignature.featureLevelContribution.toFixed(4)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono">Interaction Contrib (IC)</span>
                  <span className="text-sm font-bold text-amber-600 font-mono">
                    {currentSignature.interactionLevelContribution.toFixed(4)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono">L2 Norm</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    {currentSignature.l2Norm.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Pattern Linkage */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Primary Disease Pattern Linked in Signature</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSignature.patternWeights.map((pw) => (
                  <div
                    key={pw.patternId}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-sky-700">{pw.patternId}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Primary Pattern (100%)
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{pw.patternName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Learned Domain: <strong>{pw.dominantDomain}</strong></div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 font-mono">
                      <span className="text-slate-400">Pattern Strength:</span>
                      <span className="font-bold text-indigo-600">{pw.rawStrength.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Ranked Features in Signature */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Feature Importance Rankings in {currentSignature.diseaseName} Signature</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSignature.featureRankings.map((fr, idx) => (
                  <div
                    key={fr.feature}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      idx < 3
                        ? 'bg-sky-50/70 border-sky-200 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{fr.feature}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-700">
                        {fr.signatureWeight.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>{fr.clinicalDomain}</span>
                      <span className="text-slate-400 text-[10px]">Norm: {fr.normalizedWeight.toFixed(4)}</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, fr.signatureWeight * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Interaction Graph Edges Attached to Signature */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <GitFork className="w-4 h-4 text-indigo-600" />
                <span>Retained Stage 3.1 Primary Interaction Edges in Signature ({currentSignature.primaryInteractionEdges.length})</span>
              </h3>

              {currentSignature.primaryInteractionEdges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentSignature.primaryInteractionEdges.map((e, eIdx) => (
                    <div
                      key={eIdx}
                      className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {e.featureA} <span className="text-indigo-500 font-mono">↔</span> {e.featureB}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          MI: {e.mi.toFixed(4)} | NID: {e.nid.toFixed(4)}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold">
                        {e.score.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Zero retained primary interaction edges in baseline graph for this disease head (biomarker/feature driven).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 19-D SIGNATURE VECTORS COMPARISON */}
      {activeTab === 'vector_comparison' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">19-Dimensional Disease Signature Vector Comparison</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact continuous weights across all 19 canonical features for Diabetes, Heart Disease, and CKD.
              </p>
            </div>

            {/* Normalization Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs gap-1">
              <button
                onClick={() => setVectorDisplayMode('normalized')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  vectorDisplayMode === 'normalized'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                L2 Normalized (||Ŝ||₂ = 1.0)
              </button>
              <button
                onClick={() => setVectorDisplayMode('raw')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  vectorDisplayMode === 'raw'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Raw Aggregated (S_D)
              </button>
            </div>
          </div>

          {/* 20-Feature Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Feature Name</th>
                  <th className="p-3">Domain</th>
                  <th className="p-3 text-center text-sky-300">Diabetes S_DM</th>
                  <th className="p-3 text-center text-rose-300">Heart Disease S_HD</th>
                  <th className="p-3 text-center text-emerald-300">CKD S_CKD</th>
                  <th className="p-3 text-center">Top Associative Head</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {signatureResult.featureColumns.map((feat, idx) => {
                  const valDM =
                    vectorDisplayMode === 'normalized'
                      ? signatureResult.signatures.Diabetes.normalizedSignatureVector[idx]
                      : signatureResult.signatures.Diabetes.signatureVector[idx];
                  const valHD =
                    vectorDisplayMode === 'normalized'
                      ? signatureResult.signatures['Heart Disease'].normalizedSignatureVector[idx]
                      : signatureResult.signatures['Heart Disease'].signatureVector[idx];
                  const valCKD =
                    vectorDisplayMode === 'normalized'
                      ? signatureResult.signatures.CKD.normalizedSignatureVector[idx]
                      : signatureResult.signatures.CKD.signatureVector[idx];

                  const maxVal = Math.max(valDM, valHD, valCKD);
                  const topHead =
                    maxVal === valDM ? 'Diabetes' : maxVal === valHD ? 'Heart Disease' : 'CKD';

                  return (
                    <tr key={feat} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 font-sans">{feat}</td>
                      <td className="p-3 text-slate-500 font-sans">
                        {signatureResult.signatures.Diabetes.featureRankings.find((f) => f.feature === feat)
                          ?.clinicalDomain || 'Clinical'}
                      </td>
                      <td className={`p-3 text-center ${topHead === 'Diabetes' ? 'font-bold text-sky-600 bg-sky-50/50' : 'text-slate-600'}`}>
                        {valDM.toFixed(4)}
                      </td>
                      <td className={`p-3 text-center ${topHead === 'Heart Disease' ? 'font-bold text-rose-600 bg-rose-50/50' : 'text-slate-600'}`}>
                        {valHD.toFixed(4)}
                      </td>
                      <td className={`p-3 text-center ${topHead === 'CKD' ? 'font-bold text-emerald-600 bg-emerald-50/50' : 'text-slate-600'}`}>
                        {valCKD.toFixed(4)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold ${
                            topHead === 'Diabetes'
                              ? 'bg-sky-100 text-sky-800'
                              : topHead === 'Heart Disease'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {topHead}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CROSS-DISEASE STATISTICAL OVERLAP MATRIX */}
      {activeTab === 'cross_disease_matrix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                Cross-Disease Statistical Representation Overlap
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cosine similarity and distance metrics between normalized 19-D signatures. Evaluates multi-disease divergence without implying biological causality.
              </p>
            </div>

            {/* 3 Comparison Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {signatureResult.comparisons.map((c, cIdx) => (
                <div
                  key={cIdx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {c.diseaseA} ↔ {c.diseaseB}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        c.statisticalOverlapClassification === 'HIGH OVERLAP'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.statisticalOverlapClassification}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Cosine Similarity</span>
                      <span className="text-sm font-bold text-indigo-600">{c.cosineSimilarity.toFixed(4)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Euclidean Distance</span>
                      <span className="text-sm font-bold text-slate-700">{c.euclideanDistance.toFixed(4)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Core Jaccard Index</span>
                      <span className="text-sm font-bold text-slate-700">{c.jaccardCoreFeatures.toFixed(4)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Shared Primary Edges</span>
                      <span className="text-sm font-bold text-slate-700">{c.sharedInteractionEdges.length}</span>
                    </div>
                  </div>

                  {/* Shared vs Unique Feature Sets */}
                  <div className="space-y-2 text-xs font-sans">
                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Shared Core Features ({c.sharedCoreFeatures.length}):</span>
                      <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                        {c.sharedCoreFeatures.length > 0 ? (
                          c.sharedCoreFeatures.map((f) => (
                            <span key={f} className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic font-normal text-[10px]">None (Fully Divergent Core)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">{c.diseaseA} Unique:</span>
                      <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                        {c.diseaseAUniqueCore.length > 0 ? (
                          c.diseaseAUniqueCore.map((f) => (
                            <span key={f} className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic font-normal text-[10px]">None</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">{c.diseaseB} Unique:</span>
                      <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                        {c.diseaseBUniqueCore.length > 0 ? (
                          c.diseaseBUniqueCore.map((f) => (
                            <span key={f} className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic font-normal text-[10px]">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE TRANSITION FOOTER */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs">
          <span className="font-bold text-sky-300 block">Next Internal Stage:</span>
          <span className="text-slate-400">
            Proceed to Stage 3.4 for Hybrid Disease Prediction using learned disease signatures directly with the XGBoost-based prediction model.
          </span>
        </div>
        {onNavigateToStage && (
          <button
            onClick={() => onNavigateToStage('3.4')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <span>Proceed to 3.4 Hybrid Disease Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
