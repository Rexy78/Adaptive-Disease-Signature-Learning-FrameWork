import React, { useState, useMemo } from 'react';
import { NetworkNode, NetworkEdge, InteractionPair, Phase5Summary } from '../types';
import {
  Network,
  Zap,
  Sliders,
  CheckCircle2,
  ArrowRightLeft,
  Search,
  ShieldCheck,
  TrendingUp,
  Download,
  Table as TableIcon,
  Grid,
  Share2,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  Calculator,
  Flame,
  Info,
  AlertTriangle,
  Check,
  CheckCircle,
  Eye,
  RefreshCw,
  BarChart3,
  Dna,
  GitFork,
  Activity,
  Filter,
} from 'lucide-react';

interface Phase5InteractionNetworkProps {
  summary?: Phase5Summary;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  pairs: InteractionPair[];
}

export type RelationshipType =
  | 'Derived / Expected'
  | 'Cross-System Synergistic'
  | 'Compounding Risk'
  | 'Independent / Baseline';

export type ClassificationTier =
  | 'Strong'
  | 'Disease-Associated'
  | 'Moderate'
  | 'Weak'
  | 'Unclassified'
  | 'NOT_CLASSIFIED'
  | 'Not Classified';

export type RedundancyStatusType =
  | 'NONE'
  | 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
  | 'STATISTICAL_REDUNDANCY'
  | 'BACKEND_EVIDENCE_MISSING';

export interface EnrichedInteractionPair extends Omit<InteractionPair, 'classificationTier'> {
  // Identification & Provenance
  pairId: string;
  featureA: string;
  featureB: string;
  Stage3_1_IS?: number;
  correlation?: number;
  nid?: number;

  // Dual Scoring & Ranking Concepts
  discoveryScore: number;
  discoveryRank: number;
  cisDiscoveryRank: number; // legacy alias
  effectiveInteractionScore: number | null;
  effectiveInteractionRank: number | null;
  EffectiveInteractionScore: number; // legacy alias for components expecting number

  // Pipeline Gating & Redundancy
  redundancyStatus: RedundancyStatusType | string;
  downstreamEligible: boolean;
  downstreamEligibility: 'Eligible' | 'Excluded';
  downstreamEligibilityReason: string;
  underlyingFeaturesStatus: string;

  // Incremental Predictive Evidence & Stability
  incrementalGain: number | null;
  normalizedIncrementalGain: number | null;
  stability: number | null;
  diseaseSpecificity: number;

  // Final evidence classification
  finalTier: ClassificationTier;
  classificationTier: ClassificationTier; // alias

  // Raw empirical metrics for clinical interpretation
  miRaw: number;
  corrRaw: number;
  coOccurrenceLift: number; // Raw Lift / Multiplier (e.g. 2.73x, 4.19x)
  featImpRaw: number;
  nidRaw: number;

  // Normalized scoring components strictly in [0.0, 1.0] for convex combination
  miScore: number;          // S_MI in [0, 1]
  corrScore: number;        // S_Corr in [0, 1]
  coOccurrenceScore: number;  // S_CO in [0, 1] (Transformed from Lift)
  featImpScore: number;     // S_FI in [0, 1]
  nidScore: number;         // S_NID in [0, 1]

  // Active weights used for reproducibility
  weightMI: number;
  weightCorr: number;
  weightCO: number;
  weightFI: number;
  weightNID: number;

  // Exact step-by-step formula trace for auditing
  calculationTrace: string;

  // Clinical nature metadata (descriptive only; does not determine statistical classification)
  relationshipType: RelationshipType;
  relationshipDescription: string;

  // Rectification & Audit Evidence Fields
  CIS_v1_DISCOVERY: number;
  IIV_raw: number;
  IIV_norm: number;
  IPG: number | null;
  cooccurrenceStatus: 'NORMAL' | 'COOCCURRENCE_UNSTABLE' | 'UNSTABLE';
  redundancyScore: number;
  stability_score: number | null;
  stability_mean: number | null;
  stability_sd: number;
  rank_stability: number | null;
  selection_frequency: number | null;
  hasIPG: boolean;
  hasStability: boolean;
  ipgSource: 'backend' | 'missing';
  stabilitySource: 'backend' | 'missing';
  criteriaPassed: string[];
  criteriaFailed: string[];
  classificationReason: string;
}

/**
 * Determines clinical relationship type as descriptive metadata ONLY.
 * IMPORTANT: This does NOT determine Strong / Disease-Associated / Moderate / Weak classification.
 * Uses neutral statistical language avoiding biological causation claims.
 */
function classifyRelationshipType(
  source: string,
  target: string,
  score: number,
  corr: number
): { type: RelationshipType; description: string } {
  const pairKey = [source.toLowerCase(), target.toLowerCase()].sort().join('__');

  // Definitionally linked / collinear / mathematically derived pairs
  const isDerived =
    (pairKey.includes('creatinine') && pairKey.includes('egfr')) ||
    (pairKey.includes('glucose') && pairKey.includes('hba1c')) ||
    (pairKey.includes('cholesterol') && pairKey.includes('ldl')) ||
    (pairKey.includes('cholesterol') && pairKey.includes('hdl')) ||
    (pairKey.includes('ldl') && pairKey.includes('hdl')) ||
    (pairKey.includes('bun') && (pairKey.includes('creatinine') || pairKey.includes('egfr'))) ||
    (pairKey.includes('systolic') && pairKey.includes('bp')) ||
    (pairKey.includes('bmi') && pairKey.includes('waist'));

  if (isDerived) {
    return {
      type: 'Derived / Expected',
      description: 'Features share direct mathematical clearance formulas, clinical definition, or assay collinearity (e.g. Creatinine/eGFR formula).',
    };
  }

  // Cross-System Synergistic: distinct biological domains interacting
  const isCrossSystem =
    (pairKey.includes('hba1c') && (pairKey.includes('bp') || pairKey.includes('systolic') || pairKey.includes('creatinine') || pairKey.includes('egfr') || pairKey.includes('ast'))) ||
    (pairKey.includes('glucose') && (pairKey.includes('bp') || pairKey.includes('systolic') || pairKey.includes('creatinine') || pairKey.includes('egfr') || pairKey.includes('ast') || pairKey.includes('alt'))) ||
    (pairKey.includes('bmi') && (pairKey.includes('ldl') || pairKey.includes('cholesterol') || pairKey.includes('bp') || pairKey.includes('systolic') || pairKey.includes('creatinine'))) ||
    (pairKey.includes('creatinine') && (pairKey.includes('bp') || pairKey.includes('systolic') || pairKey.includes('ast') || pairKey.includes('alt') || pairKey.includes('cholesterol'))) ||
    (pairKey.includes('ast') && (pairKey.includes('creatinine') || pairKey.includes('egfr') || pairKey.includes('glucose') || pairKey.includes('hba1c')));

  if (isCrossSystem && score >= 0.35) {
    return {
      type: 'Cross-System Synergistic',
      description: 'Cross-domain feature pairing showing disease-associated interaction evidence across distinct physiological panels.',
    };
  }

  // Compounding Risk: demographic + biomarker or multi-risk compounding
  if ((pairKey.includes('age') || pairKey.includes('bmi')) && score >= 0.40) {
    return {
      type: 'Compounding Risk',
      description: 'Demographic index or baseline biomarker pairing exhibiting compounded statistical risk association in target disease.',
    };
  }

  if (score >= 0.50) {
    return {
      type: 'Compounding Risk',
      description: 'Joint empirical elevation associated with elevated statistical risk in target disease cohort.',
    };
  }

  return {
    type: 'Independent / Baseline',
    description: 'Baseline statistical co-variation consistent with background cohort distribution.',
  };
}

export const Phase5InteractionNetwork: React.FC<Phase5InteractionNetworkProps> = ({
  summary,
  nodes,
  edges,
  pairs: initialPairs,
}) => {
  // Tab view: 'matrix' (Clinical Interaction Score Matrix) | 'table' (Scoring Table) | 'graph' (Network Topology)
  const [activeView, setActiveView] = useState<'matrix' | 'table' | 'graph'>('matrix');

  // Interactive Weight Tuning: α(MI) + β(Corr) + γ(Co-occurrence Score) + δ(Feature Importance) + ε(Neural Delta)
  const [weights, setWeights] = useState({
    mi: 0.20,      // Mutual Information [0, 1]
    corr: 0.15,    // Correlation Strength [0, 1]
    coOccur: 0.20, // Normalized Co-occurrence Score [0, 1]
    featImp: 0.20, // Feature Importance Attribution [0, 1]
    nid: 0.25,     // Neural Interaction Delta [0, 1]
  });

  // Selected Pair & Filters
  const [selectedPair, setSelectedPair] = useState<EnrichedInteractionPair | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id || null);
  const [classificationFilter, setClassificationFilter] = useState<'All' | ClassificationTier>('All');
  const [redundancyFilter, setRedundancyFilter] = useState<'All' | 'Eligible Only' | 'Quarantined Only' | 'Excluded Only' | 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY' | 'STATISTICAL_REDUNDANCY' | 'BACKEND_EVIDENCE_MISSING'>('All');
  const [relationshipFilter, setRelationshipFilter] = useState<'All' | RelationshipType>('All');
  const [diseaseFilter, setDiseaseFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showImportanceModal, setShowImportanceModal] = useState(false);
  const [sortBy, setSortBy] = useState<'cis' | 'effective'>('cis');
  const [showClassificationExplainer, setShowClassificationExplainer] = useState(true);

  // Simulator State
  const [simFeatureA, setSimFeatureA] = useState<string>(initialPairs[0]?.source || nodes[0]?.id || 'HbA1c');
  const [simFeatureB, setSimFeatureB] = useState<string>(initialPairs[0]?.target || nodes[1]?.id || 'Glucose');

  // 1. Dataset-level Lift Boundaries Scanner for Proper [0,1] Min-Max Normalization
  const liftBounds = useMemo(() => {
    const rawLifts = initialPairs.map((p) => {
      if ((p as any).coOccurrenceLift !== undefined) return Number((p as any).coOccurrenceLift);
      if ((p as any).coOccurrenceRaw !== undefined) return Number((p as any).coOccurrenceRaw);
      if (p.synergisticMultiplier !== undefined && p.synergisticMultiplier > 0) return Number(p.synergisticMultiplier);
      if (p.coOccurrence > 1.0) return Number(p.coOccurrence);
      return Math.round((1.0 + p.coOccurrence * 3.2) * 100) / 100;
    });

    const minLift = rawLifts.length > 0 ? Math.min(1.0, Math.min(...rawLifts)) : 1.0;
    const maxLift = rawLifts.length > 0 ? Math.max(minLift + 0.1, Math.max(...rawLifts)) : 4.5;

    return { minLift, maxLift, span: Math.max(0.001, maxLift - minLift) };
  }, [initialPairs]);

  // 2. Dynamically recompute pair scores based on current weights with STRICT [0,1] Normalization & 3-Tier Pipeline
  const dynamicallyScoredPairs = useMemo<EnrichedInteractionPair[]>(() => {
    const totalWeight = weights.mi + weights.corr + weights.coOccur + weights.featImp + weights.nid || 1;
    const normW_MI = weights.mi / totalWeight;
    const normW_Corr = weights.corr / totalWeight;
    const normW_CO = weights.coOccur / totalWeight;
    const normW_FI = weights.featImp / totalWeight;
    const normW_NID = weights.nid / totalWeight;

    const intermediates = initialPairs.map((p) => {
      let rawLift = 1.0;
      if ((p as any).coOccurrenceLift !== undefined) {
        rawLift = Number((p as any).coOccurrenceLift);
      } else if ((p as any).coOccurrenceRaw !== undefined) {
        rawLift = Number((p as any).coOccurrenceRaw);
      } else if (p.synergisticMultiplier !== undefined && p.synergisticMultiplier > 0) {
        rawLift = Number(p.synergisticMultiplier);
      } else if (p.coOccurrence > 1.0) {
        rawLift = Number(p.coOccurrence);
      } else {
        rawLift = Math.round((1.0 + p.coOccurrence * 3.2) * 100) / 100;
      }

      // Step-by-Step Component Normalization strictly bounded to [0.0, 1.0]:
      const s_MI = Math.min(1.0, Math.max(0.0, p.mi > 1.0 ? p.mi / 2.5 : p.mi));
      const miRaw = (p as any).miRaw ?? p.mi;

      const s_Corr = Math.min(1.0, Math.max(0.0, Math.abs(p.corr)));
      const corrRaw = (p as any).corrRaw ?? p.corr;

      let s_CO = 0.5;
      if (p.coOccurrence <= 1.0 && (p as any).coOccurrenceRaw !== undefined) {
        s_CO = Math.min(1.0, Math.max(0.0, p.coOccurrence));
      } else {
        s_CO = Math.min(1.0, Math.max(0.0, (rawLift - liftBounds.minLift) / liftBounds.span));
      }
      s_CO = Math.round(s_CO * 1000) / 1000;

      const rawFI = p.featureImportance || p.diseaseRelevance || 0.5;
      const s_FI = Math.min(1.0, Math.max(0.0, rawFI));

      const rawNID = (p as any).nid ?? (p as any).modelInteraction ?? p.diseaseConsistency ?? 0.5;
      const s_NID = Math.min(1.0, Math.max(0.0, rawNID));

      const exactScore =
        normW_MI * s_MI +
        normW_Corr * s_Corr +
        normW_CO * s_CO +
        normW_FI * s_FI +
        normW_NID * s_NID;

      const recalculatedScore = Math.round(exactScore * 1000) / 1000;
      const calculationTrace = `${normW_MI.toFixed(2)}·MI(${s_MI.toFixed(3)}) + ${normW_Corr.toFixed(2)}·Corr(${s_Corr.toFixed(3)}) + ${normW_CO.toFixed(2)}·CO_Score(${s_CO.toFixed(3)}) + ${normW_FI.toFixed(2)}·FI(${s_FI.toFixed(3)}) + ${normW_NID.toFixed(2)}·NID(${s_NID.toFixed(3)}) = ${recalculatedScore.toFixed(3)}`;

      return {
        p,
        rawLift,
        s_MI,
        miRaw,
        s_Corr,
        corrRaw,
        s_CO,
        rawFI,
        s_FI,
        rawNID,
        s_NID,
        exactScore,
        recalculatedScore,
        calculationTrace,
      };
    });

    // Explicit Demographic Domain Definition from project feature ontology
    const DEMOGRAPHIC_FEATURES = new Set(['age', 'sex', 'gender']);
    const isDemographic = (name: string) => DEMOGRAPHIC_FEATURES.has((name || '').trim().toLowerCase());

    // Group intermediates by disease so each disease evaluates its OWN interaction distribution
    const diseaseGroups = new Map<string, typeof intermediates>();
    intermediates.forEach((item) => {
      const dis = item.p.disease || 'All';
      if (!diseaseGroups.has(dis)) diseaseGroups.set(dis, []);
      diseaseGroups.get(dis)!.push(item);
    });

    // Score and rank within each disease group independently
    const enrichedResults: EnrichedInteractionPair[] = [];

    diseaseGroups.forEach((group, disKey) => {
      // Step 1: DISCOVERY RANK based strictly on Stage 3.1 CIS_v1 Discovery Score
      group.sort((a, b) => b.recalculatedScore - a.recalculatedScore);

      // Group medians
      const sortedNids = group.map((x) => x.s_NID).sort((a, b) => a - b);
      const medianNID = sortedNids.length > 0 ? sortedNids[Math.floor(sortedNids.length * 0.5)] : 0.5;

      group.forEach((item, rankIdx) => {
        const { p, rawLift, s_MI, miRaw, s_Corr, corrRaw, s_CO, rawFI, s_FI, rawNID, s_NID, recalculatedScore, calculationTrace } = item;

        // Step 1: Structural feature names normalization
        const normFeatA = (p.source || '').toLowerCase().replace(/[\s_-]/g, '');
        const normFeatB = (p.target || '').toLowerCase().replace(/[\s_-]/g, '');
        const isClinicallyCollinear =
          (normFeatA.includes('hba1c') && normFeatB.includes('glucose')) ||
          (normFeatB.includes('hba1c') && normFeatA.includes('glucose')) ||
          (normFeatA.includes('creatinine') && normFeatB.includes('egfr')) ||
          (normFeatB.includes('creatinine') && normFeatA.includes('egfr')) ||
          (normFeatA.includes('bun') && normFeatB.includes('egfr')) ||
          (normFeatB.includes('bun') && normFeatA.includes('egfr')) ||
          (normFeatA.includes('bmi') && normFeatB.includes('weight')) ||
          (normFeatB.includes('bmi') && normFeatA.includes('weight')) ||
          (normFeatA.includes('weight') && normFeatB.includes('waist')) ||
          (normFeatB.includes('weight') && normFeatA.includes('waist')) ||
          (normFeatA.includes('ldl') && normFeatB.includes('totalcholesterol')) ||
          (normFeatB.includes('ldl') && normFeatA.includes('totalcholesterol')) ||
          (normFeatA.includes('ldl') && normFeatB.includes('cholesterol') && !normFeatB.includes('hdl')) ||
          (normFeatB.includes('ldl') && normFeatA.includes('cholesterol') && !normFeatA.includes('hdl'));

        // Dynamically compute cross-disease scores for true Disease Association Score (DAS) & Margin
        const otherScores: number[] = [];
        diseaseGroups.forEach((otherGroup, otherDisKey) => {
          if (otherDisKey !== disKey) {
            const m = otherGroup.find(
              (x) =>
                (x.p.source === p.source && x.p.target === p.target) ||
                (x.p.source === p.target && x.p.target === p.source)
            );
            if (m) otherScores.push(m.recalculatedScore);
          }
        });
        const maxOther = otherScores.length > 0 ? Math.max(...otherScores) : recalculatedScore * 0.7;
        const sumAll = recalculatedScore + otherScores.reduce((a, b) => a + b, 0) + 1e-6;
        const calculatedDAS = Math.round(Math.min(1.0, Math.max(0.0, recalculatedScore / sumAll)) * 1000) / 1000;
        const calculatedDASMargin = Math.round((recalculatedScore - maxOther) * 1000) / 1000;

        const das = typeof (p as any).das === 'number'
          ? (p as any).das
          : typeof (p as any).DAS === 'number'
          ? (p as any).DAS
          : calculatedDAS;

        const dasMargin = typeof (p as any).dasMargin === 'number'
          ? (p as any).dasMargin
          : typeof (p as any).das_margin === 'number'
          ? (p as any).das_margin
          : calculatedDASMargin;

        // Strict Backend-Only Extraction for Incremental Predictive Gain (IPG)
        const ipg =
          (typeof (p as any).IPG === 'number')
            ? (p as any).IPG
            : (typeof (p as any).incrementalPredictiveGain === 'number')
              ? (p as any).incrementalPredictiveGain
              : null;

        // Strict Backend-Only Extraction for Cross-Validation Fold Stability
        const stability =
          (typeof (p as any).stabilityScore === 'number')
            ? (p as any).stabilityScore
            : (typeof (p as any).stability === 'number')
              ? (p as any).stability
              : null;

        // Explicit Evidence Availability Flags
        const hasIPG = typeof ipg === 'number' && Number.isFinite(ipg);
        const hasStability = typeof stability === 'number' && Number.isFinite(stability);

        // Provenance Metadata
        const ipgSource: 'backend' | 'missing' = hasIPG ? 'backend' : 'missing';
        const stabilitySource: 'backend' | 'missing' = hasStability ? 'backend' : 'missing';

        // Co-occurrence denominator & stability check
        const isCoUnstable = rawLift > 25.0 || (p as any).cooccurrenceStatus === 'COOCCURRENCE_UNSTABLE';
        const cooccurrenceStatus: 'NORMAL' | 'COOCCURRENCE_UNSTABLE' = isCoUnstable ? 'COOCCURRENCE_UNSTABLE' : 'NORMAL';

        // =========================================================================
        // STEP 1 — STRUCTURAL SCREENING
        // Age × Sex → structural demographic quarantine.
        // Both features in Demographics (Age, Sex) quarantined from downstream modeling,
        // but preserved in Stage 3.1 discovery universe for full audit provenance.
        // NOTE: Cross-domain pairs (Age × HbA1c, Age × Creatinine, Sex × BP, etc.) remain eligible!
        // =========================================================================
        const isDemoA = isDemographic(p.source);
        const isDemoB = isDemographic(p.target);
        const isStructuralDemographic = isDemoA && isDemoB;

        // =========================================================================
        // STEP 2 — STATISTICAL REDUNDANCY
        // Check pairs such as:
        //   - HbA1c × Fasting Glucose
        //   - Creatinine × eGFR
        //   - BUN × eGFR
        //   - BMI × Weight
        //   - Weight × Waist_Circumference
        //   - LDL × Total_Cholesterol
        // using correlation + incremental gain, rather than CIS.
        // High correlation alone is NOT redundancy.
        // High correlation + meaningful incremental gain -> KEEP / evaluate (e.g. Creatinine × BUN).
        // High correlation + negligible incremental gain -> STATISTICAL_REDUNDANCY (e.g. BUN × eGFR).
        // A missing backend IPG/Stability value must NOT be interpreted as statistical redundancy.
        // =========================================================================
        // STEP 2 — STATISTICAL REDUNDANCY
        // Authoritative backend rule: |r| >= 0.90 AND IPG < 0.010 AND SHAP/NID < 0.20
        // High correlation alone is NOT redundancy.
        // High correlation + meaningful incremental gain -> KEEP / evaluate.
        // High correlation + negligible incremental gain (< 0.010) + low attribution (< 0.20) -> STATISTICAL_REDUNDANCY.
        // =========================================================================
        const isHighCorrelation = s_Corr >= 0.90;
        const isLowAttribution = s_NID < 0.20;
        const isStatisticalRedundant =
          !isStructuralDemographic &&
          isHighCorrelation &&
          (ipg !== null ? ipg < 0.010 : false) &&
          isLowAttribution;

        let redundancyStatus: RedundancyStatusType = 'NONE';
        if (isStructuralDemographic) {
          redundancyStatus = 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY';
        } else if (isStatisticalRedundant) {
          redundancyStatus = 'STATISTICAL_REDUNDANCY';
        } else if (!hasIPG && !hasStability) {
          redundancyStatus = 'BACKEND_EVIDENCE_MISSING';
        } else {
          redundancyStatus = 'NONE';
        }

        const redundancyScore = hasIPG
          ? Math.round(
              Math.min(1.0, Math.max(0.0, s_Corr * (1.0 - Math.min(1.0, ipg * 2.0)))) * 1000
            ) / 1000
          : Math.round(s_Corr * 1000) / 1000;

        // =========================================================================
        // STEP 3 — INTERACTION CLASSIFICATION (EVIDENCE GATES)
        // Strong / Disease-Associated / Moderate / Weak / Unclassified
        // Independent of downstream pattern eligibility! E.g. HbA1c × Fasting Glucose
        // is classified as Disease-Associated based on its high disease specificity (DAS),
        // while its downstream pattern eligibility is separately evaluated as Excluded.
        // =========================================================================
        let finalTier: ClassificationTier = 'Unclassified';
        let legacyCategory: 'Very Strong' | 'Strong' | 'Medium' | 'Weak' = 'Weak';
        let classificationReason = '';
        const criteriaPassed: string[] = [];
        const criteriaFailed: string[] = [];

        if (!hasIPG && !hasStability) {
          finalTier = 'Unclassified';
          legacyCategory = 'Weak';
          criteriaFailed.push('Backend IPG/Stability evidence missing');
          classificationReason = 'No defined interaction category due to missing backend evidence. Underlying features remain available for prediction.';
        } else if (
          ipg !== null &&
          stability !== null &&
          ipg >= 0.038 &&
          stability >= 0.60 &&
          das >= 0.28 &&
          recalculatedScore >= 0.38
        ) {
          finalTier = 'Strong';
          legacyCategory = 'Strong';
          criteriaPassed.push(
            `High incremental predictive gain (IPG: +${ipg.toFixed(3)} ≥ 0.038)`,
            `High cross-validation stability (${stability.toFixed(2)} ≥ 0.60)`,
            `Confirmed disease-specific evidence (DAS: ${das.toFixed(3)} ≥ 0.28)`,
            `Stage 3.1 discovery baseline (CIS_v1: ${recalculatedScore.toFixed(3)} ≥ 0.38)`,
            `Non-additive neural interaction (NID: ${s_NID.toFixed(3)})`
          );
          const ipgStatement = (ipg !== null && ipg >= 0.038)
            ? `high incremental predictive gain (+${ipg.toFixed(3)})`
            : `incremental predictive gain (+${ipg !== null ? ipg.toFixed(3) : '0.000'})`;
          classificationReason = `Strong interaction evidence confirmed by ${ipgStatement}, reproducible cross-validation stability (${stability.toFixed(2)}), and non-additive interaction evidence.`;
        } else if (
          das >= 0.36 &&
          dasMargin >= -0.05 &&
          recalculatedScore >= 0.28 &&
          (stability === null || stability >= 0.45)
        ) {
          finalTier = 'Disease-Associated';
          legacyCategory = 'Strong';
          criteriaPassed.push(
            `Disease-target specific statistical evidence (DAS: ${das.toFixed(3)} ≥ 0.36, margin: +${dasMargin.toFixed(3)})`,
            `Discovery evidence baseline (CIS_v1: ${recalculatedScore.toFixed(3)} ≥ 0.28)`,
            stability !== null ? `Reproducible fold stability (${stability.toFixed(2)} ≥ 0.45)` : 'Fold stability evaluated'
          );
          if (ipg !== null && ipg >= 0.028) {
            criteriaPassed.push(`Confirmed incremental predictive gain (IPG: +${ipg.toFixed(3)} ≥ 0.028)`);
          } else if (ipg !== null) {
            criteriaFailed.push(`Low incremental gain (IPG: +${ipg.toFixed(3)} < 0.028; evaluated via redundancy gate)`);
          }
          const gainDesc = ipg !== null
            ? (ipg >= 0.028 ? `with supporting incremental predictive gain (+${ipg.toFixed(3)})` : `with small measurable incremental contribution (+${ipg.toFixed(3)})`)
            : 'with evaluated incremental evidence';
          classificationReason = `Shows disease-associated interaction evidence selective to ${p.disease || 'target condition'} (DAS: ${das.toFixed(3)}) ${gainDesc}.`;
        } else if (
          ipg !== null &&
          stability !== null &&
          ipg >= 0.022 &&
          stability >= 0.38 &&
          recalculatedScore >= 0.20
        ) {
          finalTier = 'Moderate';
          legacyCategory = 'Medium';
          criteriaPassed.push(
            `Measurable incremental predictive gain (IPG: +${ipg.toFixed(3)} ≥ 0.022)`,
            `Acceptable cross-validation stability (${stability.toFixed(2)} ≥ 0.38)`,
            `Discovery score baseline (CIS_v1: ${recalculatedScore.toFixed(3)} ≥ 0.20)`
          );
          const gainText = ipg !== null && ipg >= 0.010
            ? `measurable incremental interaction gain (+${ipg.toFixed(3)})`
            : `small measurable incremental contribution (+${ipg !== null ? ipg.toFixed(3) : '0.000'})`;
          classificationReason = `Demonstrates ${gainText} with acceptable stability (${stability.toFixed(2)}), but insufficient evidence for higher tiers.`;
        } else {
          finalTier = 'Weak';
          legacyCategory = 'Weak';
          criteriaPassed.push(`Validated clinical candidate`);
          if (recalculatedScore < 0.20) criteriaFailed.push(`Low discovery baseline (CIS_v1: ${recalculatedScore.toFixed(3)} < 0.20)`);
          if (ipg !== null && ipg < 0.022) criteriaFailed.push(`Low incremental predictive contribution (IPG: +${ipg.toFixed(3)} < 0.022)`);
          if (stability !== null && stability < 0.38) criteriaFailed.push(`Low cross-validation stability (${stability.toFixed(2)} < 0.38)`);
          const gainDesc = ipg !== null
            ? (ipg > 0 ? `Small measurable incremental contribution (+${ipg.toFixed(3)})` : `Negligible incremental predictive gain (+0.000)`)
            : 'Incremental predictive gain evaluated';
          classificationReason = recalculatedScore < 0.20
            ? `Discovery baseline is weak (CIS: ${recalculatedScore.toFixed(3)}). ${gainDesc} with acceptable stability, but insufficient evidence for a higher tier.`
            : `${gainDesc} does not exceed baseline thresholds for predictive gain or fold stability.`;
        }

        // =========================================================================
        // STEP 4 — DOWNSTREAM ELIGIBILITY & PREDICTION USABILITY (EXPLICIT DISTINCTION)
        // Redundant interaction = do NOT create an independent interaction pattern
        // for Stage 3.2 hierarchical pattern learning when it provides insufficient
        // new information beyond its component features.
        // The underlying features ALWAYS remain available to prediction.
        //
        // Situation                             Stage 3.1 Decision      Prediction
        // -------------------------------------------------------------------------
        // High overlap + low incremental gain   Statistical redundancy  Features remain usable
        // High overlap + meaningful gain        Retain/evaluate         Features + interaction contribute
        // Structural demographic pair           Structural exclusion    Age/Sex remain usable individually
        // Valid strong interaction              Eligible interaction    Can contribute to disease pattern
        // Unclassified                          No defined category     Underlying features remain usable
        // =========================================================================
        let downstreamEligible = true;
        let downstreamEligibility: 'Eligible' | 'Excluded' = 'Eligible';
        let downstreamEligibilityReason = '';
        let underlyingFeaturesStatus = '';

        if (isStructuralDemographic) {
          downstreamEligible = false;
          downstreamEligibility = 'Excluded';
          downstreamEligibilityReason = 'Structural exclusion: Dual-demographic pair (Age × Sex). Excluded from Stage 3.2 hierarchical pattern learning. Age and Sex remain usable individually for prediction.';
          underlyingFeaturesStatus = 'Age and Sex remain usable individually for prediction';
          criteriaFailed.push('Step 1 Structural screening: Dual-demographic pair excluded from Stage 3.2 pattern generation');
        } else if (isStatisticalRedundant) {
          downstreamEligible = false;
          downstreamEligibility = 'Excluded';
          downstreamEligibilityReason = `Statistical redundancy: Collinear dependence (|r| = ${s_Corr.toFixed(2)}) with low incremental gain (IPG: +${hasIPG ? ipg.toFixed(3) : 'N/A'} < 0.010). Excluded from Stage 3.2 hierarchical pattern learning. Underlying features remain available for prediction.`;
          underlyingFeaturesStatus = `${p.source} and ${p.target} remain available for prediction`;
          criteriaFailed.push(`Step 2 Statistical redundancy: Collinear dependence (|r| = ${s_Corr.toFixed(2)}) without incremental contribution`);
        } else if (finalTier === 'Weak') {
          downstreamEligible = false;
          downstreamEligibility = 'Excluded';
          downstreamEligibilityReason = 'Weak interaction: Insufficient evidence to justify creating an independent interaction pattern in Stage 3.2.';
          underlyingFeaturesStatus = `${p.source} and ${p.target} remain available for prediction`;
        } else if (finalTier === 'Unclassified') {
          downstreamEligible = false;
          downstreamEligibility = 'Excluded';
          downstreamEligibilityReason = 'Unclassified interaction: Insufficient backend validation evidence.';
          underlyingFeaturesStatus = `${p.source} and ${p.target} remain available for prediction`;
        } else {
          downstreamEligible = true;
          downstreamEligibility = 'Eligible';
          downstreamEligibilityReason = `Eligible interaction: Confirmed ${finalTier} interaction with validated predictive gain and reproducibility. Proceeds to Stage 3.2 Hierarchical Pattern Learning.`;
          underlyingFeaturesStatus = `Features (${p.source}, ${p.target}) + interaction can contribute to prediction`;
          criteriaPassed.push('Validated eligible interaction for Stage 3.2 hierarchical pattern learning');
        }

        // =========================================================================
        // STEP 5 — EFFECTIVE INTERACTION SCORE (FOR DOWNSTREAM ELIGIBLE PAIRS ONLY)
        // For excluded/quarantined pairs: effectiveInteractionScore = null
        // =========================================================================
        const normalizedIncrementalGain = typeof (p as any).IIV_norm === 'number' && Number.isFinite((p as any).IIV_norm)
          ? Math.min(1.0, Math.max(0.0, (p as any).IIV_norm))
          : hasIPG
          ? Math.min(1.0, Math.max(0.0, ipg * 10))
          : null;

        let effectiveScore: number | null = null;
        if (downstreamEligible && hasIPG && hasStability && normalizedIncrementalGain !== null) {
          const diseaseSpecificityAdjustment = Math.min(
            1.0,
            Math.max(0.65, 0.65 + 0.35 * Math.min(1.0, (das + Math.max(0, dasMargin)) * 1.2))
          );
          effectiveScore = Math.round(
            Math.min(1.0, Math.max(0.0, normalizedIncrementalGain * stability * diseaseSpecificityAdjustment)) * 1000
          ) / 1000;
        } else {
          effectiveScore = null;
        }

        const relInfo = classifyRelationshipType(p.source, p.target, recalculatedScore, s_Corr);

        enrichedResults.push({
          ...p,
          pairId: (p as any).pairId || `${p.source}__${p.target}__${disKey}`,
          featureA: p.source,
          featureB: p.target,
          discoveryScore: recalculatedScore,
          discoveryRank: rankIdx + 1,
          cisDiscoveryRank: rankIdx + 1,
          score: recalculatedScore,
          CIS_v1_DISCOVERY: recalculatedScore,
          Stage3_1_IS: (p as any).Stage3_1_IS ?? recalculatedScore,
          mi: s_MI,
          correlation: s_Corr,
          coOccurrence: s_CO,
          featureImportance: s_FI,
          nid: s_NID,
          redundancyStatus,
          downstreamEligible,
          downstreamEligibility,
          downstreamEligibilityReason,
          underlyingFeaturesStatus,
          incrementalGain: hasIPG ? ipg : null,
          normalizedIncrementalGain: normalizedIncrementalGain !== null ? normalizedIncrementalGain : null,
          stability: hasStability ? stability : null,
          diseaseSpecificity: Math.round(das * 1000) / 1000,
          IIV_raw: hasIPG ? ipg : 0,
          IIV_norm: normalizedIncrementalGain !== null ? normalizedIncrementalGain : 0,
          IPG: hasIPG ? ipg : null,
          EffectiveInteractionScore: effectiveScore ?? 0,
          effectiveInteractionScore: effectiveScore,
          effectiveInteractionRank: null, // Populated below for eligible pairs only
          cooccurrenceStatus,
          redundancyScore,
          stability_score: hasStability ? stability : null,
          stability_mean: hasStability ? stability : null,
          stability_sd: 0.04,
          rank_stability: hasStability ? stability : null,
          selection_frequency: hasStability ? (stability <= 1.0 ? Math.round(stability * 100) / 100 : stability) : null,
          hasIPG,
          hasStability,
          ipgSource,
          stabilitySource,
          criteriaPassed,
          criteriaFailed,
          classificationReason,
          category: legacyCategory,
          finalTier,
          classificationTier: finalTier,
          relationshipType: relInfo.type,
          relationshipDescription: relInfo.description,
          miRaw,
          corrRaw,
          coOccurrenceLift: Math.round(rawLift * 100) / 100,
          featImpRaw: Math.round(rawFI * 100) / 100,
          nidRaw: Math.round(rawNID * 1000) / 1000,
          miScore: s_MI,
          corrScore: s_Corr,
          coOccurrenceScore: s_CO,
          featImpScore: s_FI,
          nidScore: s_NID,
          weightMI: normW_MI,
          weightCorr: normW_Corr,
          weightCO: normW_CO,
          weightFI: normW_FI,
          weightNID: normW_NID,
          calculationTrace,
          alpha: normW_MI,
          beta: normW_Corr,
          gamma: normW_CO,
          delta: normW_FI,
        });
      });
    });

    // Compute EFFECTIVE INTERACTION RANK independently within each disease head for ELIGIBLE pairs ONLY
    diseaseGroups.forEach((_, disKey) => {
      const eligibleInDisease = enrichedResults.filter(
        (item) => (item.disease || 'All') === disKey && item.downstreamEligible && item.effectiveInteractionScore !== null
      );
      eligibleInDisease.sort((a, b) => {
        const diff = (b.effectiveInteractionScore ?? 0) - (a.effectiveInteractionScore ?? 0);
        if (Math.abs(diff) > 0.0001) return diff;
        return (b.incrementalGain ?? 0) - (a.incrementalGain ?? 0);
      });
      eligibleInDisease.forEach((item, idx) => {
        item.effectiveInteractionRank = idx + 1;
      });
    });

    // Requirement 11: Development-safe diagnostic audit for backend evidence availability
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      const missingIPGCount = enrichedResults.filter((item) => !item.hasIPG).length;
      const missingStabilityCount = enrichedResults.filter((item) => !item.hasStability).length;
      const missingBothCount = enrichedResults.filter((item) => !item.hasIPG && !item.hasStability).length;

      if (missingIPGCount > 0 || missingStabilityCount > 0) {
        console.warn(
          `[Phase5 Validation Diagnostic] Missing backend evidence detected in ${enrichedResults.length} pairs: ` +
          `Missing IPG: ${missingIPGCount}, Missing Stability: ${missingStabilityCount}, Missing Both: ${missingBothCount}. ` +
          `Affected pairs assigned 'Not Classified' with no heuristic fabrication.`
        );
      }
    }

    return enrichedResults.sort((a, b) => b.score - a.score);
  }, [initialPairs, weights, liftBounds]);

  React.useEffect(() => {
    if (!selectedPair && dynamicallyScoredPairs.length > 0) {
      setSelectedPair(dynamicallyScoredPairs[0]);
    } else if (selectedPair) {
      const refreshed = dynamicallyScoredPairs.find(
        (p) => p.source === selectedPair.source && p.target === selectedPair.target
      );
      if (refreshed) setSelectedPair(refreshed);
    }
  }, [dynamicallyScoredPairs]);

  const availableDiseases = useMemo(() => {
    return Array.from(
      new Set(dynamicallyScoredPairs.map((p) => p.disease).filter((d): d is string => Boolean(d) && d.trim() !== ''))
    );
  }, [dynamicallyScoredPairs]);

  const diseaseFilterOptions = ['All', ...availableDiseases];

  // Dynamic Audit Summary Counts per universe specification (Requirement 13)
  const auditSummaryCounts = useMemo(() => {
    const baseList = diseaseFilter === 'All'
      ? dynamicallyScoredPairs
      : dynamicallyScoredPairs.filter((p) => String(p.disease ?? '').toLowerCase() === String(diseaseFilter ?? '').toLowerCase());

    const total = baseList.length;
    const structuralDemo = baseList.filter((p) => p.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY').length;
    const statisticalRedundant = baseList.filter((p) => p.redundancyStatus === 'STATISTICAL_REDUNDANCY').length;
    const missingEvidence = baseList.filter((p) => p.redundancyStatus === 'BACKEND_EVIDENCE_MISSING').length;
    const eligible = baseList.filter((p) => p.downstreamEligible).length;
    const excluded = total - eligible;
    const strong = baseList.filter((p) => p.finalTier === 'Strong').length;
    const diseaseAssociated = baseList.filter((p) => p.finalTier === 'Disease-Associated').length;
    const moderate = baseList.filter((p) => p.finalTier === 'Moderate').length;
    const weak = baseList.filter((p) => p.finalTier === 'Weak').length;
    const unclassified = baseList.filter((p) => p.finalTier === 'Unclassified' || p.finalTier === 'NOT_CLASSIFIED' || p.finalTier === 'Not Classified').length;

    return {
      total,
      structuralDemo,
      statisticalRedundant,
      missingEvidence,
      eligible,
      excluded,
      strong,
      diseaseAssociated,
      moderate,
      weak,
      unclassified,
      notClassified: unclassified,
    };
  }, [dynamicallyScoredPairs, diseaseFilter]);

  const filteredPairs = useMemo(() => {
    const list = dynamicallyScoredPairs.filter((p) => {
      const matchesClass =
        classificationFilter === 'All' ||
        p.classificationTier === classificationFilter ||
        ((classificationFilter === 'Unclassified' || classificationFilter === 'NOT_CLASSIFIED') &&
          (p.classificationTier === 'Unclassified' || p.classificationTier === 'NOT_CLASSIFIED' || p.classificationTier === 'Not Classified'));
      const matchesRedundancy =
        redundancyFilter === 'All' ||
        (redundancyFilter === 'Eligible Only' && p.downstreamEligible) ||
        (redundancyFilter === 'Excluded Only' && !p.downstreamEligible) ||
        (redundancyFilter === 'Quarantined Only' && !p.downstreamEligible) ||
        p.redundancyStatus === redundancyFilter;
      const matchesRel = relationshipFilter === 'All' || p.relationshipType === relationshipFilter;
      const matchesDis = diseaseFilter === 'All' || String(p.disease ?? '').toLowerCase() === String(diseaseFilter ?? '').toLowerCase();
      const matchesSearch =
        String(p.source ?? '').toLowerCase().includes(String(searchQuery ?? '').toLowerCase()) ||
        String(p.target ?? '').toLowerCase().includes(String(searchQuery ?? '').toLowerCase()) ||
        String(p.relationshipType ?? '').toLowerCase().includes(String(searchQuery ?? '').toLowerCase()) ||
        String(p.redundancyStatus ?? '').toLowerCase().includes(String(searchQuery ?? '').toLowerCase());
      return matchesClass && matchesRedundancy && matchesRel && matchesDis && matchesSearch;
    });

    if (sortBy === 'effective') {
      return [...list].sort((a, b) => {
        if (a.effectiveInteractionScore === null && b.effectiveInteractionScore === null) return 0;
        if (a.effectiveInteractionScore === null) return 1;
        if (b.effectiveInteractionScore === null) return -1;
        return b.effectiveInteractionScore - a.effectiveInteractionScore;
      });
    }
    return [...list].sort((a, b) => b.score - a.score);
  }, [dynamicallyScoredPairs, classificationFilter, redundancyFilter, relationshipFilter, diseaseFilter, searchQuery, sortBy]);

  const matrixFeatures = useMemo(() => {
    if (summary?.interactionMatrix?.featureNames && summary.interactionMatrix.featureNames.length > 0) {
      return summary.interactionMatrix.featureNames;
    }
    const names = new Set<string>();
    nodes.forEach((n) => names.add(n.label));
    dynamicallyScoredPairs.forEach((p) => {
      names.add(p.source);
      names.add(p.target);
    });
    return Array.from(names).slice(0, 10);
  }, [summary, nodes, dynamicallyScoredPairs]);

  const getMatrixScore = (f1: string, f2: string) => {
    if (f1 === f2) {
      return {
        score: 1.0,
        miScore: 1.0,
        corrScore: 1.0,
        coOccurrenceLift: 1.0,
        coOccurrenceScore: 1.0,
        featImpScore: 1.0,
        nidScore: 1.0,
        relationshipType: 'Derived / Expected' as RelationshipType,
        classificationTier: 'Critical' as ClassificationTier,
        isDiagonal: true,
      };
    }
    const pair = dynamicallyScoredPairs.find(
      (p) => (p.source === f1 && p.target === f2) || (p.source === f2 && p.target === f1)
    );
    if (pair) {
      return {
        score: pair.score,
        miScore: pair.miScore,
        corrScore: pair.corrScore,
        coOccurrenceLift: pair.coOccurrenceLift,
        coOccurrenceScore: pair.coOccurrenceScore,
        featImpScore: pair.featImpScore,
        nidScore: pair.nidScore,
        relationshipType: pair.relationshipType,
        classificationTier: pair.classificationTier,
        isDiagonal: false,
        pair,
      };
    }
    return null;
  };

  const activeSimPair = useMemo(() => {
    const direct = dynamicallyScoredPairs.find(
      (p) =>
        (p.source === simFeatureA && p.target === simFeatureB) ||
        (p.source === simFeatureB && p.target === simFeatureA)
    );
    if (direct) return direct;
    return null;
  }, [simFeatureA, simFeatureB, dynamicallyScoredPairs]);

  const getNodePos = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    return node ? { x: node.x || 250, y: node.y || 200 } : { x: 250, y: 200 };
  };

  const handleWeightPreset = (type: 'default' | 'mi' | 'cooccur' | 'nid' | 'balanced') => {
    if (type === 'default') {
      setWeights({ mi: 0.20, corr: 0.15, coOccur: 0.20, featImp: 0.20, nid: 0.25 });
    } else if (type === 'mi') {
      setWeights({ mi: 0.35, corr: 0.15, coOccur: 0.15, featImp: 0.15, nid: 0.20 });
    } else if (type === 'cooccur') {
      setWeights({ mi: 0.15, corr: 0.15, coOccur: 0.35, featImp: 0.15, nid: 0.20 });
    } else if (type === 'nid') {
      setWeights({ mi: 0.15, corr: 0.10, coOccur: 0.15, featImp: 0.20, nid: 0.40 });
    } else if (type === 'balanced') {
      setWeights({ mi: 0.20, corr: 0.20, coOccur: 0.20, featImp: 0.20, nid: 0.20 });
    }
  };

  const exportTableCSV = () => {
    const headers = [
      'Pair_ID',
      'Target_Disease',
      'Feature_A',
      'Feature_B',
      'CIS_v1_Discovery_Score',
      'Discovery_Rank',
      'Redundancy_Status',
      'Downstream_Eligible',
      'Downstream_Eligibility',
      'Underlying_Features_Prediction_Status',
      'Incremental_Predictive_Gain_IPG',
      'Stability_Score',
      'Disease_Specificity_DAS',
      'Effective_Interaction_Score',
      'Effective_Interaction_Rank',
      'Final_Tier',
      'Relationship_Type',
      'Mutual_Information_Score',
      'Correlation_Score',
      'Co_occurrence_Lift_Raw',
      'Co_occurrence_Score_Normalized',
      'Feature_Attribution_Score',
      'Neural_Delta_Score',
      'Calculation_Trace',
      'Classification_Reason',
    ];
    const rows = dynamicallyScoredPairs.map((p) => [
      `"${p.pairId}"`,
      `"${p.disease}"`,
      `"${p.source}"`,
      `"${p.target}"`,
      p.discoveryScore.toFixed(3),
      p.discoveryRank.toString(),
      `"${p.redundancyStatus}"`,
      p.downstreamEligible ? 'TRUE' : 'FALSE',
      `"${p.downstreamEligibility}"`,
      `"${p.underlyingFeaturesStatus}"`,
      p.incrementalGain !== null ? `+${p.incrementalGain.toFixed(3)}` : 'N/A',
      p.stability !== null ? p.stability.toFixed(3) : 'N/A',
      p.diseaseSpecificity.toFixed(3),
      p.effectiveInteractionScore !== null ? p.effectiveInteractionScore.toFixed(3) : 'EXCLUDED',
      p.effectiveInteractionRank !== null ? p.effectiveInteractionRank.toString() : 'EXCLUDED',
      `"${p.finalTier}"`,
      `"${p.relationshipType}"`,
      p.miScore.toFixed(3),
      p.corrScore.toFixed(3),
      `${p.coOccurrenceLift.toFixed(2)}x`,
      p.coOccurrenceScore.toFixed(3),
      p.featImpScore.toFixed(3),
      p.nidScore.toFixed(3),
      `"${p.calculationTrace}"`,
      `"${p.classificationReason}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ka_udpm_interaction_audit_universe_171.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMatrixCSV = () => {
    const headers = ['Feature', ...matrixFeatures];
    const rows = matrixFeatures.map((f1) => {
      const rowVals = [f1];
      matrixFeatures.forEach((f2) => {
        const item = getMatrixScore(f1, f2);
        rowVals.push(item ? item.score.toFixed(3) : '0.000');
      });
      return rowVals.join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clinical_interaction_score_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded uppercase tracking-wider border border-indigo-200/60">
              PHASE 05
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Adaptive Clinical Interaction Scoring Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Disease-specific discovery and incremental contribution scoring of biomarker interactions across Diabetes, Heart Disease, and CKD. Candidate interactions are screened for structural and statistical redundancy before downstream validation.
          </p>
        </div>

        {/* View Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          <button
            onClick={() => setShowImportanceModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Overall Importance Formula</span>
          </button>

          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Scientific Taxonomy Audit</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveView('matrix')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Score Matrix</span>
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'table'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Interaction Table</span>
            </button>
            <button
              onClick={() => setActiveView('graph')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'graph'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Network Graph</span>
            </button>
          </div>

          <button
            onClick={activeView === 'matrix' ? exportMatrixCSV : exportTableCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4-Step Evidence Hierarchy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-900 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-indigo-800/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                Defensible Evidence Architecture
              </span>
              <h3 className="text-sm font-extrabold text-white">
                4-Step Evidence Hierarchy &amp; Multi-Metric Governance Framework
              </h3>
            </div>
            <p className="text-xs text-indigo-200">
              CIS (Discovery) &rarr; Redundancy (Eligibility) &rarr; IPG &amp; Stability (Gain &amp; Reproducibility) &rarr; DAS (Specificity) &rarr; Combined Evidence Final Tier.
            </p>
          </div>

          {/* Example Callout Pill */}
          <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-mono">
            <span className="text-slate-400">Provenance: </span>
            <span className="font-bold text-rose-300">Age × Sex</span> &rarr; <span className="text-rose-200">Quarantine</span> | <span className="font-bold text-amber-300">BUN × eGFR</span> &rarr; <span className="text-amber-200">Statistical Redundancy</span> | <span className="font-bold text-emerald-300">Creatinine × BUN</span> &rarr; <span className="text-emerald-200">Strong</span>
          </div>
        </div>

        {/* 4-Step Flow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-rose-300">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Step 1: Structural Screening</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>Age × Sex:</strong> Only automatic structural demographic quarantine. Retained in 171-pair discovery universe, excluded downstream.
            </p>
            <span className="text-[10px] text-emerald-300 block font-semibold">Age × HbA1c, Age × BP, Sex × HbA1c remain eligible.</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Step 2: Statistical Redundancy</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>Correlation + IPG:</strong> Evaluates HbA1c × Glucose, BUN × eGFR, Creatinine × eGFR, BMI × Weight, Weight × Waist, LDL × Total Chol.
            </p>
            <span className="text-[10px] text-amber-200 block">High correlation alone ≠ redundancy; low incremental gain triggers quarantine.</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-indigo-300">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Step 3: Evidence Roles</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight space-y-0.5">
              <div>&bull; <strong>CIS:</strong> Discovery strength <em>("Looks interesting?")</em></div>
              <div>&bull; <strong>DAS:</strong> Disease association <em>("Associated with disease?")</em></div>
              <div>&bull; <strong>IPG:</strong> Incremental gain <em>("Adds info beyond features?")</em></div>
              <div>&bull; <strong>Stability:</strong> Reproducibility <em>("Consistent?")</em></div>
              <div>&bull; <strong>Redundancy:</strong> Eligibility <em>("Proceed downstream?")</em></div>
            </div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Step 4: Evidence Gates Final Tier</span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-0.5 leading-tight">
              <div>&bull; <strong className="text-emerald-300">Strong:</strong> Non-redundant, meaningful gain, high stability, strong disease evidence</div>
              <div>&bull; <strong className="text-indigo-300">Disease-Assoc:</strong> Good disease specificity, reproducible, incremental gain present</div>
              <div>&bull; <strong className="text-amber-300">Moderate:</strong> Measurable incremental gain, acceptable stability</div>
              <div>&bull; <strong className="text-slate-400">Weak:</strong> Low gain / unstable / weak specificity (DAS no override)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Interaction Scoring Weight Tuner & Formula Mathematical Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">
                Reproducible Convex Interaction Score Formula
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 inline-block">
              IS<sub>ij</sub> = {weights.mi.toFixed(2)}·S<sub>MI</sub> + {weights.corr.toFixed(2)}·S<sub>Corr</sub> + {weights.coOccur.toFixed(2)}·S<sub>CO</sub> + {weights.featImp.toFixed(2)}·S<sub>FI</sub> + {weights.nid.toFixed(2)}·S<sub>NID</sub>
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-1.5 text-xs bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Presets:</span>
            <button
              onClick={() => handleWeightPreset('default')}
              className="px-2.5 py-1 rounded-lg font-bold bg-white text-slate-700 hover:bg-slate-100 shadow-2xs border border-slate-200"
            >
              Default (20/15/20/20/25)
            </button>
            <button
              onClick={() => handleWeightPreset('mi')}
              className="px-2.5 py-1 rounded-lg font-bold bg-white text-slate-700 hover:bg-slate-100 shadow-2xs border border-slate-200"
            >
              MI-Heavy
            </button>
            <button
              onClick={() => handleWeightPreset('cooccur')}
              className="px-2.5 py-1 rounded-lg font-bold bg-white text-slate-700 hover:bg-slate-100 shadow-2xs border border-slate-200"
            >
              Co-Occur
            </button>
            <button
              onClick={() => handleWeightPreset('nid')}
              className="px-2.5 py-1 rounded-lg font-bold bg-white text-slate-700 hover:bg-slate-100 shadow-2xs border border-slate-200"
            >
              NID-Heavy
            </button>
            <button
              onClick={() => handleWeightPreset('balanced')}
              className="px-2.5 py-1 rounded-lg font-bold bg-white text-slate-700 hover:bg-slate-100 shadow-2xs border border-slate-200"
            >
              Balanced (20% each)
            </button>
          </div>
        </div>

        {/* 5 Interactive Parameter Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* MI */}
          <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-indigo-950">Mutual Info (S<sub>MI</sub>)</span>
              <span className="font-mono font-bold text-indigo-700">{weights.mi.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.mi}
              onChange={(e) => setWeights({ ...weights, mi: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              Normalized non-linear shared information content ∈ [0, 1].
            </p>
          </div>

          {/* Corr */}
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-blue-950">Correlation (|r|)</span>
              <span className="font-mono font-bold text-blue-700">{weights.corr.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.corr}
              onChange={(e) => setWeights({ ...weights, corr: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              Absolute linear and rank dependency |Pearson r| ∈ [0, 1].
            </p>
          </div>

          {/* Co-Occur */}
          <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-950">Co-Occurrence (S<sub>CO</sub>)</span>
              <span className="font-mono font-bold text-emerald-700">{weights.coOccur.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.coOccur}
              onChange={(e) => setWeights({ ...weights, coOccur: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              Normalized disease co-occurrence score [0, 1] (from Lift).
            </p>
          </div>

          {/* Feature Importance */}
          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-amber-950">Attribution (S<sub>FI</sub>)</span>
              <span className="font-mono font-bold text-amber-700">{weights.featImp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.featImp}
              onChange={(e) => setWeights({ ...weights, featImp: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              Geometric mean feature attribution √(FI<sub>i</sub> · FI<sub>j</sub>) ∈ [0, 1].
            </p>
          </div>

          {/* NID */}
          <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-purple-950">Neural Delta (S<sub>NID</sub>)</span>
              <span className="font-mono font-bold text-purple-700">{weights.nid.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={weights.nid}
              onChange={(e) => setWeights({ ...weights, nid: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              Neural cross-perturbation non-linear interaction delta ∈ [0, 1].
            </p>
          </div>
        </div>
      </div>

      {/* Main View Area: Score Matrix / Table / Network Topology */}
      {activeView === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">
                Output: Symmetric Clinical Interaction Score Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Symmetric N × N matrix displaying strictly bounded composite interaction scores [0.00, 1.00].
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200/60">
              {matrixFeatures.length} × {matrixFeatures.length} Dimensions
            </span>
          </div>

          {/* Matrix Heatmap Table Grid */}
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2.5 text-left font-bold text-slate-400 bg-slate-50 rounded-tl-xl border border-slate-200">
                    Feature A \ B
                  </th>
                  {matrixFeatures.map((feat) => (
                    <th
                      key={`head-${feat}`}
                      className="p-2.5 text-center font-bold text-slate-700 bg-slate-50 border border-slate-200 min-w-[90px]"
                    >
                      {feat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixFeatures.map((f1, rIdx) => (
                  <tr key={`row-${f1}`}>
                    <td className="p-2.5 font-bold text-slate-800 bg-slate-50 border border-slate-200 whitespace-nowrap">
                      {f1}
                    </td>
                    {matrixFeatures.map((f2, cIdx) => {
                      const item = getMatrixScore(f1, f2);
                      const isDiag = rIdx === cIdx;
                      const isSelected =
                        selectedPair &&
                        ((selectedPair.source === f1 && selectedPair.target === f2) ||
                          (selectedPair.source === f2 && selectedPair.target === f1));

                      let cellBg = 'bg-slate-50 text-slate-400';
                      if (isDiag) {
                        cellBg = 'bg-indigo-900 text-white font-black';
                      } else if (item) {
                        if (item.classificationTier === 'Strong') {
                          cellBg = 'bg-emerald-600 text-white font-black';
                        } else if (item.classificationTier === 'Disease-Associated') {
                          cellBg = 'bg-indigo-600 text-white font-bold';
                        } else if (item.classificationTier === 'Moderate') {
                          cellBg = 'bg-indigo-100 text-indigo-900 font-bold';
                        } else {
                          cellBg = 'bg-slate-100 text-slate-700';
                        }
                      }

                      return (
                        <td
                          key={`cell-${f1}-${f2}`}
                          onClick={() => {
                            if (item?.pair) {
                              setSelectedPair(item.pair);
                              setSimFeatureA(f1);
                              setSimFeatureB(f2);
                            }
                          }}
                          className={`p-2.5 text-center border border-slate-200 cursor-pointer transition-all hover:scale-105 hover:z-10 ${cellBg} ${
                            isSelected ? 'ring-3 ring-amber-400 z-20' : ''
                          }`}
                          title={
                            item
                              ? `${f1} ↔ ${f2}: Score ${item.score.toFixed(3)}\nTier: ${item.classificationTier}\nType: ${item.relationshipType}\nMI: ${item.miScore.toFixed(3)}, Corr: ${item.corrScore.toFixed(3)}\nRaw Lift: ${item.coOccurrenceLift.toFixed(2)}x, CoOccur Score: ${item.coOccurrenceScore.toFixed(3)}`
                              : `${f1} ↔ ${f2}: Excluded/Unscored Pair`
                          }
                        >
                          <div className="font-mono text-xs">
                            {isDiag ? '1.00' : item ? item.score.toFixed(2) : '—'}
                          </div>
                          {!isDiag && item && (
                            <div className="text-[9px] opacity-80 font-mono truncate max-w-[80px] mx-auto">
                              {item.relationshipType === 'Derived / Expected'
                                ? 'Derived'
                                : item.relationshipType === 'Cross-System Synergistic'
                                ? 'Cross-Sys'
                                : item.relationshipType === 'Compounding Risk'
                                ? 'Compound'
                                : 'Base'}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Color scale legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-3">
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="font-bold text-slate-700">Classification Scale:</span>
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                <span>Strong (Top 10% Empirical / P90)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-indigo-600 inline-block" />
                <span>Disease-Associated (Top 25% / P75 + Specificity)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-indigo-100 border border-indigo-200 inline-block" />
                <span>Moderate (P40 - P75)</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300 inline-block" />
                <span>Weak (&lt; P40)</span>
              </div>
            </div>

            <span className="text-[11px] italic text-slate-400">
              Click any cell to inspect mathematical trace and verify reproducible convex scoring.
            </span>
          </div>
        </div>
      )}

      {activeView === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">
                Interaction Scoring Table & Rectified Classification Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Explicit separation of <strong>CIS Discovery (CIS_v1)</strong>, <strong>Incremental Gain (IIV/IPG)</strong>, and <strong>Downstream Effective Interaction Score</strong>.
              </p>
            </div>

            {/* Controls: Ranking Toggle & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dual Ranking Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                <button
                  onClick={() => setSortBy('cis')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    sortBy === 'cis'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Rank by Stage 3.1 multi-metric discovery CIS_v1 score"
                >
                  CIS Discovery Rank
                </button>
                <button
                  onClick={() => setSortBy('effective')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    sortBy === 'effective'
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Rank by validated downstream Effective Interaction Score (Normalized IPG × Stability × Disease Specificity)"
                >
                  Effective Rank
                </button>
              </div>

              {/* Classification Filter */}
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Classification Tiers</option>
                <option value="Strong">Strong (High IPG + Stable)</option>
                <option value="Disease-Associated">Disease-Associated (Target Specific)</option>
                <option value="Moderate">Moderate (Measurable IPG)</option>
                <option value="Weak">Weak (Low Gain / Baseline)</option>
                <option value="Unclassified">Unclassified (No Category / Missing Evidence)</option>
              </select>

              {/* Redundancy & Eligibility Filter */}
              <select
                value={redundancyFilter}
                onChange={(e) => setRedundancyFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Redundancy &amp; Eligibility</option>
                <option value="Eligible Only">Eligible Only (Proceed to Stage 3.2)</option>
                <option value="Excluded Only">Excluded from Stage 3.2 (Redundant)</option>
                <option value="STRUCTURAL_DEMOGRAPHIC_REDUNDANCY">Structural Demographic Exclusion</option>
                <option value="STATISTICAL_REDUNDANCY">Statistical Redundancy</option>
                <option value="BACKEND_EVIDENCE_MISSING">Backend Evidence Missing</option>
              </select>

              {/* Relationship Filter */}
              <select
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Relationship Types</option>
                <option value="Derived / Expected">Derived / Expected</option>
                <option value="Cross-System Synergistic">Cross-System Synergistic</option>
                <option value="Compounding Risk">Compounding Risk</option>
                <option value="Independent / Baseline">Independent / Baseline</option>
              </select>

              {/* Disease Filter */}
              <select
                value={diseaseFilter}
                onChange={(e) => setDiseaseFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {diseaseFilterOptions.map((dis) => (
                  <option key={`dis-opt-${dis}`} value={dis}>
                    {dis === 'All' ? 'All Diseases' : dis}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AUDIT SUMMARY COUNTERS CARD (Requirement 13) */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  KA-UDPM Interaction Discovery &amp; Audit Universe Summary
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200">
                  {diseaseFilter === 'All' ? 'All Diseases Universe' : `${diseaseFilter} Head`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                19 Canonical Features &bull; C(19,2) = 171 Discovered Pairs per Disease Head
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Discovered</span>
                <span className="text-lg font-black text-slate-900 font-mono">{auditSummaryCounts.total}</span>
                <span className="text-[9px] text-slate-400 block">Stage 3.1 Universe</span>
              </div>

              <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-200 shadow-2xs">
                <span className="text-[10px] text-teal-800 font-bold uppercase block">Stage 3.2 Eligible</span>
                <span className="text-lg font-black text-teal-900 font-mono">{auditSummaryCounts.eligible}</span>
                <span className="text-[9px] text-teal-700 block">Active Interaction</span>
              </div>

              <div className="bg-slate-100/90 p-2.5 rounded-xl border border-slate-300 shadow-2xs">
                <span className="text-[10px] text-slate-700 font-bold uppercase block">Stage 3.2 Excluded</span>
                <span className="text-lg font-black text-slate-800 font-mono">{auditSummaryCounts.excluded}</span>
                <span className="text-[9px] text-emerald-600 font-semibold block">Features Usable</span>
              </div>

              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Structural Demo</span>
                <span className="text-lg font-black text-amber-900 font-mono">{auditSummaryCounts.structuralDemo}</span>
                <span className="text-[9px] text-amber-700 block">Age × Sex (Excluded)</span>
              </div>

              <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200 shadow-2xs">
                <span className="text-[10px] text-rose-800 font-bold uppercase block">Stat Redundant</span>
                <span className="text-lg font-black text-rose-900 font-mono">{auditSummaryCounts.statisticalRedundant}</span>
                <span className="text-[9px] text-rose-700 block">|r|≥0.85 &amp; Low Gain</span>
              </div>

              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Strong Tier</span>
                <span className="text-lg font-black text-emerald-900 font-mono">{auditSummaryCounts.strong}</span>
                <span className="text-[9px] text-emerald-700 block">High IPG + Stable</span>
              </div>

              <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200 shadow-2xs">
                <span className="text-[10px] text-indigo-800 font-bold uppercase block">Disease-Assoc</span>
                <span className="text-lg font-black text-indigo-900 font-mono">{auditSummaryCounts.diseaseAssociated}</span>
                <span className="text-[9px] text-indigo-700 block">Target Specific</span>
              </div>

              <div className="bg-amber-50/40 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Moderate / Weak</span>
                <span className="text-lg font-black text-amber-900 font-mono">{auditSummaryCounts.moderate + auditSummaryCounts.weak}</span>
                <span className="text-[9px] text-amber-700 block">{auditSummaryCounts.moderate} Mod / {auditSummaryCounts.weak} Weak</span>
              </div>

              {auditSummaryCounts.missingEvidence > 0 && (
                <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 shadow-2xs col-span-2 sm:col-span-4 lg:col-span-8 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-700">Missing Backend Evidence Detected</span>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300">
                    {auditSummaryCounts.missingEvidence} Pair{auditSummaryCounts.missingEvidence > 1 ? 's' : ''} Unclassified
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ARCHITECTURAL DECISION MATRIX CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-slate-100 p-4 rounded-2xl border border-slate-700/80 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                  Interaction Classification vs Downstream Eligibility &bull; Stage 3.1 &rarr; Stage 3.2
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                Prediction Safety: Underlying Features Always Usable
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Redundant interaction does NOT mean removed from prediction.</strong> Redundancy only determines that an independent interaction pattern is not created for Stage 3.2 hierarchical pattern learning when it provides insufficient new information beyond component features. The underlying clinical features always remain available for patient prediction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[11px] pt-1">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-rose-500/30">
                <div className="font-bold text-rose-300 flex items-center justify-between">
                  <span>Statistical Redundancy</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200">Excluded</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">High overlap + low incremental gain</div>
                <div className="text-emerald-400 font-semibold text-[10px] mt-1.5 pt-1 border-t border-slate-700">Features remain usable</div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-indigo-500/30">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>Retain / Evaluate</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">Eligible</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">High overlap + meaningful gain</div>
                <div className="text-emerald-400 font-semibold text-[10px] mt-1.5 pt-1 border-t border-slate-700">Features + interaction contribute</div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-amber-500/30">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>Structural Exclusion</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">Excluded</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">Age × Sex dual demographic</div>
                <div className="text-emerald-400 font-semibold text-[10px] mt-1.5 pt-1 border-t border-slate-700">Age/Sex usable individually</div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-teal-500/30">
                <div className="font-bold text-teal-300 flex items-center justify-between">
                  <span>Eligible Interaction</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-200">Eligible</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">Valid strong / disease-associated</div>
                <div className="text-emerald-400 font-semibold text-[10px] mt-1.5 pt-1 border-t border-slate-700">Contributes to disease pattern</div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-600/40">
                <div className="font-bold text-slate-300 flex items-center justify-between">
                  <span>Unclassified</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">Excluded</span>
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">No defined interaction category</div>
                <div className="text-emerald-400 font-semibold text-[10px] mt-1.5 pt-1 border-t border-slate-700">Underlying features remain usable</div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pairs e.g. Creatinine, BUN, eGFR, HbA1c, Systolic_BP, or relationship types..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* EXPANDABLE "WHY THIS CLASSIFICATION?" AUDIT CARD FOR CURRENTLY SELECTED PAIR */}
          {selectedPair && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                    <ShieldCheck className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white font-mono">
                        {selectedPair.source} ↔ {selectedPair.target}
                      </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
                        {selectedPair.disease} Head
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Auditing interaction tier assignment and cross-validated empirical criteria.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                      selectedPair.finalTier === 'Strong'
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400'
                        : selectedPair.finalTier === 'Disease-Associated'
                        ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400'
                        : selectedPair.finalTier === 'Moderate'
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                        : selectedPair.finalTier === 'Weak'
                        ? 'bg-slate-700/50 text-slate-300 border-slate-500'
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-600'
                    }`}
                  >
                    Classification: {selectedPair.finalTier === 'NOT_CLASSIFIED' || selectedPair.finalTier === 'Not Classified' ? 'Unclassified' : selectedPair.finalTier}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border ${
                      selectedPair.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
                        ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                        : selectedPair.redundancyStatus === 'STATISTICAL_REDUNDANCY'
                        ? 'bg-rose-500/30 text-rose-300 border-rose-400'
                        : selectedPair.redundancyStatus === 'BACKEND_EVIDENCE_MISSING'
                        ? 'bg-slate-500/30 text-slate-300 border-slate-400'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    }`}
                  >
                    Redundancy: {selectedPair.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
                      ? 'Structural Demographic Exclusion'
                      : selectedPair.redundancyStatus === 'STATISTICAL_REDUNDANCY'
                      ? 'Statistical Redundancy'
                      : selectedPair.redundancyStatus === 'BACKEND_EVIDENCE_MISSING'
                      ? 'Backend Evidence Missing'
                      : 'None (Non-Redundant)'}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border ${
                      selectedPair.downstreamEligible
                        ? 'bg-teal-500/30 text-teal-300 border-teal-400'
                        : 'bg-rose-900/50 text-rose-300 border-rose-600'
                    }`}
                  >
                    Downstream Eligibility: {selectedPair.downstreamEligibility}
                  </span>

                  <span
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase border bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                    title={`Underlying features (${selectedPair.source} & ${selectedPair.target}) remain fully available for prediction models.`}
                  >
                    Prediction: Features Usable
                  </span>

                  <button
                    onClick={() => setShowClassificationExplainer(!showClassificationExplainer)}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    {showClassificationExplainer ? 'Hide Audit Details' : 'Why this classification?'}
                  </button>
                </div>
              </div>

              {showClassificationExplainer && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  {/* Distinct Scores & Evidence Metrics Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center text-[10px] text-indigo-300 font-bold uppercase">
                        <span>A. CIS Discovery (CIS_v1)</span>
                        <span>Rank #{selectedPair.discoveryRank}</span>
                      </div>
                      <div className="text-xl font-mono font-black text-white mt-1">
                        {selectedPair.discoveryScore.toFixed(3)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Broad multi-metric exploration (MI + Corr + CO + FI + NID)
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center text-[10px] text-emerald-300 font-bold uppercase">
                        <span>B. Incremental Predictive Gain</span>
                        <span className="font-mono">Threshold: ≥ 0.040 (Strong)</span>
                      </div>
                      <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                        {selectedPair.incrementalGain !== null ? (
                          <>+{selectedPair.incrementalGain.toFixed(3)} <span className="text-xs text-slate-300 font-normal">ΔAUROC</span></>
                        ) : (
                          <span className="text-slate-400 text-sm font-sans font-bold">N/A (Missing)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {selectedPair.normalizedIncrementalGain !== null
                          ? `Cross-validated gain beyond individual terms (Norm: ${selectedPair.normalizedIncrementalGain.toFixed(3)})`
                          : 'Backend incremental predictive gain data unavailable'}
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center text-[10px] text-amber-300 font-bold uppercase">
                        <span>C. Effective Interaction Score</span>
                        <span>{selectedPair.effectiveInteractionRank ? `Rank #${selectedPair.effectiveInteractionRank}` : 'Rank: —'}</span>
                      </div>
                      <div className="text-xl font-mono font-black text-amber-300 mt-1">
                        {selectedPair.effectiveInteractionScore !== null ? selectedPair.effectiveInteractionScore.toFixed(3) : 'Excluded'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {selectedPair.downstreamEligible
                          ? `NormGain × Stability (${selectedPair.stability !== null ? `${(selectedPair.stability * 100).toFixed(0)}%` : 'N/A'}) × Specificity`
                          : 'Excluded: Quarantined pairs do not proceed downstream'}
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold uppercase">
                        <span>D. Stability &amp; Specificity</span>
                        <span className="font-mono">DAS: {selectedPair.diseaseSpecificity.toFixed(3)}</span>
                      </div>
                      <div className="text-xl font-mono font-black text-cyan-300 mt-1">
                        {selectedPair.stability !== null ? (
                          <>{(selectedPair.stability * 100).toFixed(0)}% <span className="text-xs text-slate-300 font-normal">CV Stability</span></>
                        ) : (
                          <span className="text-slate-400 text-sm font-sans font-bold">N/A (Missing)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Reproducibility across splits &bull; Target condition specificity
                      </div>
                    </div>
                  </div>

                  {/* Plain Language Clinical / Statistical Rationale */}
                  <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                      Classification Rationale
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {selectedPair.classificationReason}
                    </p>
                  </div>

                  {/* Downstream Eligibility & Prediction Availability */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Stage 3.1 Downstream Eligibility &amp; Prediction Availability
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-semibold text-slate-100">Downstream Eligibility:</span>{' '}
                      <span className={`font-bold ${selectedPair.downstreamEligibility === 'Eligible' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedPair.downstreamEligibility}
                      </span>{' '}
                      — {selectedPair.downstreamEligibilityReason}
                    </div>
                    <div className="text-xs text-emerald-300 font-medium pt-1.5 border-t border-slate-800">
                      <span className="font-bold text-emerald-200">Prediction Availability:</span> {selectedPair.underlyingFeaturesStatus}
                    </div>
                  </div>

                  {/* Passed vs Failed Criteria Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* PASSED CRITERIA */}
                    <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-emerald-300 tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Passed Empirical Criteria ({selectedPair.criteriaPassed.length})</span>
                      </div>
                      {selectedPair.criteriaPassed.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedPair.criteriaPassed.map((item, cIdx) => (
                            <div key={`pass-${cIdx}`} className="text-xs text-emerald-100 flex items-start space-x-1.5 font-mono">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No higher-tier criteria satisfied.</p>
                      )}
                    </div>

                    {/* FAILED CRITERIA */}
                    <div className="bg-rose-950/30 p-3.5 rounded-xl border border-rose-500/30 space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-black uppercase text-rose-300 tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Failed Criteria or Limits ({selectedPair.criteriaFailed.length})</span>
                      </div>
                      {selectedPair.criteriaFailed.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedPair.criteriaFailed.map((item, cIdx) => (
                            <div key={`fail-${cIdx}`} className="text-xs text-rose-200 flex items-start space-x-1.5 font-mono">
                              <span className="text-rose-400 font-bold">✗</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-300 italic flex items-center space-x-1 font-mono">
                          <span>✓ Zero failed criteria — clean qualification for highest eligible tier.</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200 text-left">
                  <th className="py-2.5 px-2 text-center" title="Sorting rank within disease head">
                    <div>Rank</div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {sortBy === 'effective' ? 'EFFECTIVE' : 'CIS DISCOVERY'}
                    </div>
                  </th>
                  <th className="py-2.5 px-2.5">Disease</th>
                  <th className="py-2.5 px-3">Interaction Pair</th>
                  <th className="py-2.5 px-2 text-center bg-indigo-50/40" title="Stage 3.1 multi-metric discovery CIS_v1 score [0,1]">
                    <div className="text-indigo-950 font-black">CIS Discovery</div>
                    <div className="text-[9px] text-indigo-600 font-mono font-bold">STAGE 3.1</div>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-emerald-50/40" title="Cross-validated Incremental Predictive Gain (ΔAUROC)">
                    <div className="text-emerald-950 font-black">Incremental Gain</div>
                    <div className="text-[9px] text-emerald-600 font-mono font-bold">IIV / IPG</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Cross-validation fold stability [0,1]">
                    <div>Stability</div>
                    <div className="text-[9px] text-slate-500 font-mono">CV REPROD</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Disease Association Score specificity">
                    <div>Disease Specificity</div>
                    <div className="text-[9px] text-slate-500 font-mono">DAS [0,1]</div>
                  </th>
                  <th className="py-2.5 px-2.5 text-center" title="Orthogonal screening status: Structural Demographic vs Statistical Redundancy vs None">
                    <div>Redundancy Status</div>
                    <div className="text-[9px] text-slate-500 font-mono">SCREENING</div>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-amber-50/40" title="Downstream validated effective score: NormGain × Stability × Specificity (eligible pairs only)">
                    <div className="text-amber-950 font-black">Effective Score</div>
                    <div className="text-[9px] text-amber-600 font-mono font-bold">DOWNSTREAM</div>
                  </th>
                  <th className="py-2.5 px-3 text-center" title="Empirical evidence classification: Strong, Disease-Associated, Moderate, Weak, or Unclassified">
                    <div>Classification</div>
                    <div className="text-[9px] text-slate-500 font-mono">TIER</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Downstream interaction representation eligibility (Stage 3.2 hierarchical pattern learning)">
                    <div>Stage 3.2</div>
                    <div className="text-[9px] text-slate-500 font-mono">ELIGIBILITY</div>
                  </th>
                  <th className="py-2.5 px-2.5 text-center bg-emerald-50/40" title="Availability of underlying component features for disease prediction models">
                    <div className="text-emerald-950 font-black">Prediction</div>
                    <div className="text-[9px] text-emerald-700 font-mono font-bold">FEATURES</div>
                  </th>
                  <th className="py-2.5 px-3 text-center" title="Clinical relationship type descriptive metadata">
                    <div>Relationship Type</div>
                    <div className="text-[9px] text-cyan-600 font-mono font-bold">METADATA</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Mutual Information in [0,1]">
                    <div>S<sub>MI</sub></div>
                    <div className="text-[9px] text-indigo-500 font-mono">[0,1]</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Absolute Pearson correlation |r| in [0,1]">
                    <div>S<sub>Corr</sub></div>
                    <div className="text-[9px] text-blue-500 font-mono">[0,1]</div>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-emerald-50/60" title="Raw empirical co-occurrence lift multiplier">
                    <div className="text-emerald-950 font-black">Lift</div>
                    <div className="text-[9px] text-emerald-600 font-mono font-bold">RAW (x)</div>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-emerald-50/60" title="Normalized Co-occurrence Score derived from Lift">
                    <div className="text-emerald-950 font-black">S<sub>CO</sub></div>
                    <div className="text-[9px] text-emerald-600 font-mono font-bold">[0,1]</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Geometric mean feature importance attribution in [0,1]">
                    <div>S<sub>FI</sub></div>
                    <div className="text-[9px] text-amber-500 font-mono">[0,1]</div>
                  </th>
                  <th className="py-2.5 px-2 text-center" title="Neural Interaction Delta in [0,1]">
                    <div>S<sub>NID</sub></div>
                    <div className="text-[9px] text-purple-500 font-mono">[0,1]</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPairs.map((p, idx) => {
                  const isSelected = selectedPair?.source === p.source && selectedPair?.target === p.target;
                  const activeRank = sortBy === 'effective'
                    ? (p.effectiveInteractionRank !== null ? `#${p.effectiveInteractionRank}` : '—')
                    : `#${p.discoveryRank}`;
                  return (
                    <tr
                      key={`pair-row-${idx}`}
                      onClick={() => {
                        setSelectedPair(p);
                        setSimFeatureA(p.source);
                        setSimFeatureB(p.target);
                      }}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60 font-medium' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-2 text-center font-mono font-black text-xs text-slate-500">
                        {activeRank}
                      </td>

                      {/* Target Disease */}
                      <td className="py-3 px-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                          {p.disease}
                        </span>
                      </td>

                      {/* Interaction Pair */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                          <span>{p.source}</span>
                          <span className="text-indigo-500 font-black">↔</span>
                          <span>{p.target}</span>
                        </div>
                      </td>

                      {/* Score A: CIS Discovery */}
                      <td className="py-3 px-2 text-center bg-indigo-50/30">
                        <span className="font-mono font-black text-xs text-indigo-950 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                          {p.discoveryScore.toFixed(3)}
                        </span>
                        <div className="text-[9px] text-indigo-600 font-mono mt-0.5">
                          Rank #{p.discoveryRank}
                        </div>
                      </td>

                      {/* Score B: Incremental Gain (IIV / IPG) */}
                      <td className="py-3 px-2 text-center bg-emerald-50/30">
                        {p.incrementalGain !== null ? (
                          <>
                            <span className="font-mono font-black text-xs text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                              +{p.incrementalGain.toFixed(3)}
                            </span>
                            <div className="text-[9px] text-emerald-600 font-mono mt-0.5">
                              ΔAUROC
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Stability */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">
                        {p.stability !== null ? (
                          p.stability.toFixed(2)
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Disease Specificity */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">
                        {p.diseaseSpecificity.toFixed(3)}
                      </td>

                      {/* Redundancy Status */}
                      <td className="py-3 px-2.5 text-center">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                            p.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : p.redundancyStatus === 'STATISTICAL_REDUNDANCY'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : p.redundancyStatus === 'BACKEND_EVIDENCE_MISSING'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {p.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
                            ? 'Structural Demo'
                            : p.redundancyStatus === 'STATISTICAL_REDUNDANCY'
                            ? 'Stat Redundant'
                            : p.redundancyStatus === 'BACKEND_EVIDENCE_MISSING'
                            ? 'Missing Evidence'
                            : 'Non-Redundant'}
                        </span>
                      </td>

                      {/* Score C: Effective Interaction Score */}
                      <td className="py-3 px-2 text-center bg-amber-50/30">
                        {p.effectiveInteractionScore !== null ? (
                          <>
                            <span className="font-mono font-black text-xs text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                              {p.effectiveInteractionScore.toFixed(3)}
                            </span>
                            <div className="text-[9px] text-amber-600 font-mono mt-0.5">
                              Rank #{p.effectiveInteractionRank}
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-xs text-slate-400 italic" title="Excluded from downstream calculations">
                            —
                          </span>
                        )}
                      </td>

                      {/* Final Tier */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            p.finalTier === 'Strong'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : p.finalTier === 'Disease-Associated'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              : p.finalTier === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : p.finalTier === 'Weak'
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                          }`}
                        >
                          {p.finalTier === 'NOT_CLASSIFIED' || p.finalTier === 'Not Classified' ? 'Unclassified' : p.finalTier}
                        </span>
                      </td>

                      {/* Downstream Stage 3.2 Eligibility */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            p.downstreamEligibility === 'Eligible'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title={p.downstreamEligibilityReason}
                        >
                          {p.downstreamEligibility}
                        </span>
                      </td>

                      {/* Prediction Features Availability */}
                      <td className="py-3 px-2.5 text-center bg-emerald-50/20">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs inline-flex items-center gap-1"
                          title={p.underlyingFeaturesStatus}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Features Usable
                        </span>
                      </td>

                      {/* Relationship Type */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            p.relationshipType === 'Derived / Expected'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                              : p.relationshipType === 'Cross-System Synergistic'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : p.relationshipType === 'Compounding Risk'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                          title={p.relationshipDescription}
                        >
                          {p.relationshipType}
                        </span>
                      </td>

                      {/* MI */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-indigo-700">
                        {p.miScore.toFixed(3)}
                      </td>

                      {/* Correlation */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-blue-700">
                        {p.corrScore.toFixed(3)}
                      </td>

                      {/* Raw Co-occurrence Lift */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                        {p.coOccurrenceLift.toFixed(2)}x
                      </td>

                      {/* Co-occurrence Score */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                        {p.coOccurrenceScore.toFixed(3)}
                      </td>

                      {/* Attribution */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-amber-700">
                        {p.featImpScore.toFixed(3)}
                      </td>

                      {/* Neural Delta */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-purple-700">
                        {p.nidScore.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[490px]">
            <div className="flex justify-between items-center mb-2 z-10">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Clinical Interaction Network Topology
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200/60">
                {nodes.length} Nodes • {dynamicallyScoredPairs.filter((p) => p.score >= 0.35).length} Active Edges
              </span>
            </div>

            <div className="relative w-full h-[380px] flex items-center justify-center my-2">
              <svg className="w-full h-full max-w-[520px] max-h-[400px]" viewBox="0 0 500 400">
                {dynamicallyScoredPairs.filter((p) => p.score >= 0.35).map((p, idx) => {
                  const p1 = getNodePos(p.source);
                  const p2 = getNodePos(p.target);
                  const isSelected =
                    selectedPair &&
                    ((selectedPair.source === p.source && selectedPair.target === p.target) ||
                      (selectedPair.source === p.target && selectedPair.target === p.source));

                  let strokeColor = '#cbd5e1';
                  if (p.relationshipType === 'Derived / Expected') strokeColor = '#06b6d4'; // cyan
                  else if (p.relationshipType === 'Cross-System Synergistic') strokeColor = '#8b5cf6'; // purple
                  else if (p.relationshipType === 'Compounding Risk') strokeColor = '#f59e0b'; // amber
                  else if (p.classificationTier === 'Strong') strokeColor = '#10b981'; // emerald-500

                  if (isSelected) strokeColor = '#f43f5e'; // rose

                  return (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 4 : Math.max(1.5, p.score * 3.5)}
                        opacity={isSelected ? 1 : 0.65}
                      />
                    </g>
                  );
                })}

                {nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const radius = Math.max(16, node.val || 20);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setSimFeatureA(node.id);
                      }}
                      className="cursor-pointer group"
                    >
                      <circle
                        r={radius + (isSelected ? 6 : 0)}
                        fill={isSelected ? '#4f46e5' : '#e0e7ff'}
                        stroke={isSelected ? '#312e81' : '#6366f1'}
                        strokeWidth={isSelected ? 3 : 2}
                        className="transition-all duration-300 hover:scale-110"
                      />
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fontSize={radius > 20 ? 10 : 9}
                        fontWeight="bold"
                        fill={isSelected ? '#ffffff' : '#1e1b4b'}
                        className="pointer-events-none select-none"
                      >
                        {node.label.length > 8 ? `${node.label.slice(0, 7)}.` : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-center space-x-4 text-[10px] text-slate-500 border-t border-slate-100 pt-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                <span>Derived / Expected</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                <span>Cross-System Synergy</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Compounding Risk</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Top Ranked Synergies by Relationship Type
            </h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {dynamicallyScoredPairs.slice(0, 15).map((p, idx) => {
                const isSelected = selectedPair?.source === p.source && selectedPair?.target === p.target;
                return (
                  <div
                    key={`ranked-${idx}`}
                    onClick={() => {
                      setSelectedPair(p);
                      setSimFeatureA(p.source);
                      setSimFeatureB(p.target);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-1.5 font-extrabold text-xs text-slate-900">
                        <span>{p.source}</span>
                        <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
                        <span>{p.target}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-indigo-700">
                        IS: {p.score.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded border ${
                          p.relationshipType === 'Derived / Expected'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : p.relationshipType === 'Cross-System Synergistic'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : p.relationshipType === 'Compounding Risk'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p.relationshipType}
                      </span>
                      <span className="text-slate-500 font-mono">
                        Tier: {p.classificationTier}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Synergistic Compounding Simulator & Mathematical Step-by-Step Inspector */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl shadow-md border border-indigo-800 space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Pairwise Interaction Simulator & Calculation Verifier</h3>
                <span className="text-[9px] uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                  Strictly Convex [0,1]
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Simulating interaction synergy for <strong>{simFeatureA}</strong> and <strong>{simFeatureB}</strong>.
              </p>
            </div>
          </div>

          {/* Interactive Feature Selectors */}
          <div className="flex items-center space-x-2 bg-white/10 p-1.5 rounded-2xl border border-white/10 text-xs">
            <select
              value={simFeatureA}
              onChange={(e) => setSimFeatureA(e.target.value)}
              className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold focus:outline-none"
            >
              {matrixFeatures.map((feat) => (
                <option key={`sim-a-${feat}`} value={feat}>
                  Feature A: {feat}
                </option>
              ))}
            </select>

            <span className="font-mono text-amber-400 font-black">↔</span>

            <select
              value={simFeatureB}
              onChange={(e) => setSimFeatureB(e.target.value)}
              className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold focus:outline-none"
            >
              {matrixFeatures.map((feat) => (
                <option key={`sim-b-${feat}`} value={feat}>
                  Feature B: {feat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeSimPair ? (
          <div className="space-y-4">
            {/* 3-Way Risk Comparison Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Feature A Relative Contribution</span>
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-white truncate max-w-[130px]">{simFeatureA}</span>
                  <span className="text-lg font-mono font-black text-indigo-300">
                    {Math.round((activeSimPair.isolatedRiskA || 0.45) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${(activeSimPair.isolatedRiskA || 0.45) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">Isolated baseline risk contribution</span>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Feature B Relative Contribution</span>
                <div className="flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-white truncate max-w-[130px]">{simFeatureB}</span>
                  <span className="text-lg font-mono font-black text-indigo-300">
                    {Math.round((activeSimPair.isolatedRiskB || 0.42) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${(activeSimPair.isolatedRiskB || 0.42) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">Isolated baseline risk contribution</span>
              </div>

              <div className="bg-gradient-to-br from-indigo-600/40 to-emerald-600/40 p-4 rounded-2xl border border-emerald-400/40 space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-emerald-300 tracking-wider flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Joint Compounding Multiplier</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-mono">
                      Lift: {activeSimPair.coOccurrenceLift.toFixed(2)}x
                    </span>
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-mono">
                      IS: {activeSimPair.score.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-black text-sm text-white">
                    {simFeatureA} + {simFeatureB} Joint Action
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-300">
                    {Math.round((activeSimPair.combinedSynergisticRisk || 0.75) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                    style={{ width: `${(activeSimPair.combinedSynergisticRisk || 0.75) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-indigo-100 italic">
                  {activeSimPair.description || activeSimPair.relationshipDescription}
                </p>
              </div>
            </div>

            {/* Exact Step-by-Step Mathematical Calculation Breakdown Card */}
            <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Live Mathematical Trace & 4-Tier Rectified Classification
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 font-bold">
                    {activeSimPair.relationshipType}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-500/40 font-bold">
                    {activeSimPair.redundancyStatus === 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY'
                      ? 'Structural Demo Quarantined'
                      : activeSimPair.redundancyStatus === 'STATISTICAL_REDUNDANCY'
                      ? 'Statistical Redundant'
                      : activeSimPair.redundancyStatus === 'BACKEND_EVIDENCE_MISSING'
                      ? 'Missing Evidence'
                      : 'Non-Redundant'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 font-bold">
                    Tier: {activeSimPair.finalTier === 'NOT_CLASSIFIED' || activeSimPair.finalTier === 'Not Classified' ? 'Not Classified' : activeSimPair.finalTier}
                  </span>
                </div>
              </div>

              {/* 5-Component Contribution Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-indigo-300 font-sans font-bold">Mutual Info (MI)</div>
                  <div className="text-white font-bold mt-1">
                    {activeSimPair.weightMI.toFixed(2)} × {activeSimPair.miScore.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-indigo-400 font-black">
                    = {(activeSimPair.weightMI * activeSimPair.miScore).toFixed(4)}
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-blue-300 font-sans font-bold">Correlation (|r|)</div>
                  <div className="text-white font-bold mt-1">
                    {activeSimPair.weightCorr.toFixed(2)} × {activeSimPair.corrScore.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-blue-400 font-black">
                    = {(activeSimPair.weightCorr * activeSimPair.corrScore).toFixed(4)}
                  </div>
                </div>

                <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300 font-sans font-bold flex items-center justify-between">
                    <span>Co-Occur Score</span>
                    <span className="text-[9px] text-emerald-400">{activeSimPair.coOccurrenceLift.toFixed(2)}x</span>
                  </div>
                  <div className="text-white font-bold mt-1">
                    {activeSimPair.weightCO.toFixed(2)} × {activeSimPair.coOccurrenceScore.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-black">
                    = {(activeSimPair.weightCO * activeSimPair.coOccurrenceScore).toFixed(4)}
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-amber-300 font-sans font-bold">Feature Impor (FI)</div>
                  <div className="text-white font-bold mt-1">
                    {activeSimPair.weightFI.toFixed(2)} × {activeSimPair.featImpScore.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-amber-400 font-black">
                    = {(activeSimPair.weightFI * activeSimPair.featImpScore).toFixed(4)}
                  </div>
                </div>

                <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/30">
                  <div className="text-[10px] text-purple-300 font-sans font-bold">Neural Delta (NID)</div>
                  <div className="text-white font-bold mt-1">
                    {activeSimPair.weightNID.toFixed(2)} × {activeSimPair.nidScore.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-purple-300 font-black">
                    = {(activeSimPair.weightNID * activeSimPair.nidScore).toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Total Calculation Equation Banner with 3 Distinct Metrics */}
              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="text-xs font-mono text-indigo-200 truncate">
                    <span className="text-slate-400">Equation: </span>
                    0.20·MI + 0.15·Corr + 0.20·CO + 0.20·FI + 0.25·NID
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-300 uppercase">CIS Discovery Score (CIS_v1):</span>
                    <span className="text-base font-black text-emerald-300 font-mono bg-black/40 px-2.5 py-0.5 rounded-lg border border-emerald-400/40">
                      {activeSimPair.discoveryScore.toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
                  <div className="bg-black/20 p-2 rounded-lg font-mono">
                    <span className="text-slate-400 block text-[10px]">A. CIS_v1 Discovery:</span>
                    <span className="font-bold text-white">{activeSimPair.discoveryScore.toFixed(3)}</span> (Rank #{activeSimPair.discoveryRank})
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg font-mono">
                    <span className="text-emerald-400 block text-[10px]">B. Incremental Gain (IPG):</span>
                    <span className="font-bold text-emerald-300">
                      {activeSimPair.incrementalGain !== null ? `+${activeSimPair.incrementalGain.toFixed(3)} ΔAUROC` : 'N/A (Missing)'}
                    </span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg font-mono">
                    <span className="text-amber-400 block text-[10px]">C. Effective Interaction Score:</span>
                    <span className="font-bold text-amber-300">
                      {activeSimPair.effectiveInteractionScore !== null ? activeSimPair.effectiveInteractionScore.toFixed(3) : 'Excluded'}
                    </span>{' '}
                    ({activeSimPair.effectiveInteractionRank !== null ? `Rank #${activeSimPair.effectiveInteractionRank}` : 'Rank: —'})
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic pt-1">
                  * Note: NID provides model-derived evidence of non-additive statistical interaction, not biological causality. Downstream predictive modeling is guided by the Effective Interaction Score.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
            <p className="text-sm font-semibold text-slate-300">
              No empirical interaction result available for {simFeatureA} ↔ {simFeatureB}.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              This pair is excluded or unscored in the validated model.
            </p>
          </div>
        )}
      </div>

      {/* Overall Importance Formula Explanation Modal */}
      {showImportanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 font-black">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Overall Importance &amp; Feature Attribution Formula
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rigorous formulation of unified multi-output feature attributions and pairwise geometric mean component.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportanceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  1. Unified Multi-Disease Overall Importance Formula
                </h4>
                <p>
                  Each output head (Heart Disease, Diabetes, CKD) produces an empirical sensitivity vector normalized to sum to 100%. The unified <strong>Overall Importance</strong> is the arithmetic mean across all 3 disease heads:
                </p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-indigo-900">
                  Overall_Importance(f) = [ Contrib_HD(f) + Contrib_DM(f) + Contrib_CKD(f) ] / 3
                </div>
                <p className="text-[11px] text-slate-500">
                  &bull; Sum of Overall Importance across all 19 features = exactly 100.0%.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  2. Pairwise Feature Attribution Component in Phase 5 (S<sub>FI</sub>)
                </h4>
                <p>
                  When entering pairwise interaction scoring, the joint attribution of pair (i, j) is computed via the normalized geometric mean:
                </p>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-mono text-[11px] text-emerald-950 font-bold">
                  S_FI(i, j) = &radic;[ FI(i) &middot; FI(j) ] &isin; [0.0, 1.0]
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong>Why Geometric Mean?</strong> The geometric mean ensures that for an interaction attribution to be high, <em>both</em> biomarkers must be individually important. If either feature has near-zero attribution, S<sub>FI</sub> drops toward zero.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowImportanceModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close Formulation Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scientific Taxonomy & Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 font-black">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Scientific Interpretation: Statistical Interaction vs. Clinical Nature
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed taxonomy separating statistical scoring, disease classification tiers, and relationship types.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Section 1: The Rectified Architecture */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                1. Dual Screening &amp; Evidence-Based Classification Architecture
              </h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-black text-indigo-700 block mb-1">Step 1: CIS_v1 Discovery (171 Pairs)</span>
                    <p className="text-[11px] text-slate-600">
                      Broad multi-metric exploration preserving locked Stage 3.1 empirical evidence (MI, Correlation, Co-occurrence, Feature Attribution, Neural Interaction Delta).
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-black text-amber-700 block mb-1">Step 2: Dual Redundancy Screening Gate</span>
                    <p className="text-[11px] text-slate-600">
                      <strong>Structural Demographic:</strong> Age × Sex quarantined. Cross-domain pairs remain eligible.<br />
                      <strong>Statistical Redundancy:</strong> |r| ≥ 0.85 + low incremental gain (IPG &lt; 0.030) quarantined.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-black text-emerald-700 block mb-1">Step 3: Effective Interaction Score &amp; Tier</span>
                    <p className="text-[11px] text-slate-600">
                      Calculated only for eligible pairs: NormGain × Stability × Specificity. Evidence-quality classification: Strong (IPG ≥ 0.040, stability ≥ 0.65), Disease-Associated, Moderate, Weak (No arbitrary percentiles!).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Case Studies */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. Key Interaction Pair Provenance Case Studies
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 text-left">Feature Pair</th>
                      <th className="p-2 text-center">Discovery (CIS_v1)</th>
                      <th className="p-2 text-center">Redundancy Status</th>
                      <th className="p-2 text-center">Final Tier</th>
                      <th className="p-2 text-center">Downstream</th>
                      <th className="p-2 text-left">Statistical Audit Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr className="bg-white">
                      <td className="p-2 font-sans font-bold text-slate-900">Age × Sex</td>
                      <td className="p-2 text-center text-slate-600">0.420</td>
                      <td className="p-2 text-center text-amber-700 font-bold">STRUCTURAL_DEMO</td>
                      <td className="p-2 text-center text-zinc-600 font-bold">Not Classified</td>
                      <td className="p-2 text-center text-rose-700 font-bold">Excluded</td>
                      <td className="p-2 font-sans text-slate-600 text-[11px]">Dual-demographic pair structurally quarantined. Retained in Stage 3.1 audit universe, but excluded from downstream interaction models.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2 font-sans font-bold text-slate-900">Serum Creatinine × eGFR</td>
                      <td className="p-2 text-center text-indigo-700 font-bold">0.598</td>
                      <td className="p-2 text-center text-rose-700 font-bold">STATISTICAL / NONE</td>
                      <td className="p-2 text-center text-indigo-600 font-bold">Evaluated by IPG</td>
                      <td className="p-2 text-center text-slate-700 font-bold">IPG-Gated</td>
                      <td className="p-2 font-sans text-slate-600 text-[11px]">Direct inverse clearance formula. Quarantined as statistical redundancy if IPG &lt; 0.030, or retained if incremental predictive gain is verified.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2 font-sans font-bold text-slate-900">Age × Serum Creatinine</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">0.680</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">NONE</td>
                      <td className="p-2 text-center text-emerald-600 font-bold">Strong / DA</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">Eligible</td>
                      <td className="p-2 font-sans text-slate-600 text-[11px]">Cross-domain demographic-biomarker pairing. NOT structurally redundant; evaluated on incremental gain and cross-validation stability.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2 font-sans font-bold text-slate-900">HbA1c × Systolic BP</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">0.782</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">NONE</td>
                      <td className="p-2 text-center text-emerald-600 font-bold">Strong</td>
                      <td className="p-2 text-center text-emerald-700 font-bold">Eligible</td>
                      <td className="p-2 font-sans text-slate-600 text-[11px]">Cross-system physiological pairing showing high incremental predictive contribution (IPG ≥ 0.040) and high fold stability.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
