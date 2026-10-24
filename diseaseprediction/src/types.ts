export type DiseaseType = 'Healthy' | 'Diabetes' | 'Heart Disease' | 'CKD';

export interface RawRow {
  [key: string]: string | number | null | undefined;
}

export type ClinicalInputCategory =
  | 'Age & Demographics'
  | 'Gender'
  | 'Laboratory Results'
  | 'Vital Signs'
  | 'Medical History'
  | 'Lifestyle Factors'
  | 'Medical Images & Modalities'
  | 'Target Outcome'
  | 'Metadata';

export interface ClinicalRangeDefinition {
  column: string;
  min: number;
  max: number;
  unit: string;
  category: ClinicalInputCategory;
  description: string;
}

export interface RangeValidationResult {
  column: string;
  category: ClinicalInputCategory;
  unit: string;
  definedMin: number;
  definedMax: number;
  actualMin: number;
  actualMax: number;
  outOfRangeCount: number;
  outOfRangePercent: number;
  status: 'valid' | 'warning' | 'critical';
  clinicalNote: string;
}

export interface ColumnTypeVerification {
  column: string;
  inferredType: 'continuous_numeric' | 'discrete_numeric' | 'binary_categorical' | 'multiclass_categorical' | 'metadata_id' | 'image_reference';
  clinicalCategory: ClinicalInputCategory;
  sampleValues: (string | number)[];
  nullCount: number;
  nullPercentage: number;
  isConsistent: boolean;
  mismatchCount: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'file_type' | 'headers' | 'duplicates' | 'empty_rows' | 'schema' | 'missing_values' | 'range_anomaly' | 'type_mismatch';
  message: string;
  details?: string;
  column?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  totalRows: number;
  totalCols: number;
  headers: string[];
  duplicateCols: string[];
  duplicateRowCount: number;
  emptyRowCount: number;
  totalMissingCells: number;
  overallMissingPercent: number;
  fileInfo: {
    name: string;
    size: number;
    type: string;
  };
  typeVerifications: ColumnTypeVerification[];
  rangeValidations: RangeValidationResult[];
  categoryBreakdown: Record<ClinicalInputCategory, number>;
  validatedAt: string;
}

export interface DatasetSummary {
  totalRows: number;
  totalCols: number;
  diseaseDistribution: Record<string, number>;
  avgAge: number;
  avgBMI: number;
  avgHbA1c: number;
  totalMissingCells: number;
  missingPercentage: number;
  missingPerColumn: Record<string, number>;
  qualityScore: number; // 0-100
  featureTypes: Record<string, 'numeric' | 'categorical'>;
}

export interface MissingValueResult {
  column: string;
  type: 'numeric' | 'categorical';
  method: 'Mean Imputation' | 'Median Imputation' | 'Mode Imputation';
  imputedValue: number | string;
  filledCount: number;
  originalMissingCount: number;
  originalMissingPercent: number;
  exampleBeforeAfter?: { raw: string; cleaned: string };
}

export interface OutlierResult {
  column: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outliersFound: number;
  cappedMin: number;
  cappedMax: number;
}

export interface EncodingMapping {
  column: string;
  type: 'binary' | 'ordinal' | 'one_hot';
  mapping: Record<string, number>;
  originalUniqueValues: string[];
  sampleTransformed: { raw: string; encoded: number }[];
}

export interface NormalizationParam {
  column: string;
  method: 'Min-Max Scaling [0,1]' | 'Z-Score Normalization (StandardScaler)' | 'Robust Scaling';
  min: number;
  max: number;
  mean: number;
  std: number;
  median: number;
  iqr: number;
  formula: string;
  sampleTransformation: { raw: number; normalized: number; standardized: number };
}

export interface PreprocessingSummary {
  originalRows: number;
  processedRows: number;
  originalCols: number;
  processedCols: number;
  missingValuesFilled: number;
  missingResults: MissingValueResult[];
  outliersRemoved: number;
  outlierResults: OutlierResult[];
  encodingsUsed: EncodingMapping[];
  normalizationsUsed: NormalizationParam[];
  cleanedHeaders: string[];
  imputationStrategy: 'Median' | 'Mean' | 'Hybrid';
  normalizationStrategy: 'Min-Max' | 'Z-Score' | 'Robust';
  pipelineTimestamp: string;
}

export interface FeatureMetrics {
  featureName: string;
  miRaw: number;
  corrRaw: number;
  varRaw: number;
  mqRaw: number;
  
  // Triad evaluation criteria
  relevanceScore: number;       // Feature Relevance (target correlation & association)
  variabilityScore: number;     // Feature Variability (standard deviation & dispersion)
  informationContentScore: number; // Feature Information Content (Mutual Information & Entropy)
  entropyRaw: number;           // Shannon Entropy H(X)
  stdDevRaw: number;            // Sample standard deviation
  
  miNorm: number;
  corrNorm: number;
  varNorm: number;
  mqNorm: number;
  
  finalScore: number; // Triad Composite: Relevance, Variability, Information Content
  rank: number;
  isTopFeature: boolean;
  type: 'numeric' | 'categorical';
  clinicalCategory: string;
}

export interface InteractionPair {
  source: string; // Feature A
  target: string; // Feature B
  score: number; // Final Interaction Score: α(MI) + β(Corr) + γ(Co-occurrence) + δ(Disease Relevance)
  category: 'Very Strong' | 'Strong' | 'Medium' | 'Weak';
  mi: number; // Mutual Information (shared information)
  corr: number; // Correlation Strength (dependency)
  coOccurrence: number; // Co-occurrence Frequency in diseased cohort
  diseaseRelevance: number; // Combined contribution to disease prediction
  diseaseConsistency: number;
  featureImportance: number;
  alpha?: number; // Weight for Mutual Information
  beta?: number; // Weight for Correlation
  gamma?: number; // Weight for Co-occurrence
  delta?: number; // Weight for Disease Relevance
  thresholdPassed: boolean;
  disease: string;
  confidence: number;
  description: string;
  isolatedRiskA: number;
  isolatedRiskB: number;
  combinedSynergisticRisk: number;
  synergisticMultiplier: number;
  relationshipType?: 'Derived / Expected' | 'Cross-System Synergistic' | 'Compounding Risk' | 'Independent / Baseline';
  classificationTier?: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Weak' | 'NOT_CLASSIFIED' | 'Critical' | 'Review / Moderate' | 'Weak / Baseline';
  timestamp?: string;
  CIS_v1_DISCOVERY?: number;
  IIV_raw?: number;
  IIV_norm?: number;
  IPG?: number;
  EffectiveInteractionScore?: number;
  effectiveInteractionScore?: number;
  cooccurrenceStatus?: 'NORMAL' | 'COOCCURRENCE_UNSTABLE' | 'UNSTABLE';
  redundancyScore?: number;
  redundancyStatus?: 'REDUNDANT_QUARANTINE' | 'NON_REDUNDANT' | 'COMPLEMENTARY' | string;
  stability_mean?: number;
  stability_sd?: number;
  stability_score?: number;
  rank_stability?: number;
  selection_frequency?: number;
  criteriaPassed?: string[];
  criteriaFailed?: string[];
  classificationReason?: string;
  cisDiscoveryRank?: number;
  effectiveInteractionRank?: number | null;
  pairId?: string;
  featureA?: string;
  featureB?: string;
  discoveryScore?: number;
  discoveryRank?: number;
  downstreamEligible?: boolean;
  incrementalGain?: number;
  normalizedIncrementalGain?: number;
  stability?: number;
  diseaseSpecificity?: number;
  finalTier?: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Weak' | 'NOT_CLASSIFIED' | string;
}

export interface ClinicalInteractionMatrixCell {
  featureA: string;
  featureB: string;
  score: number;
  mi: number;
  corr: number;
  coOccurrence: number;
  diseaseRelevance: number;
  category: 'Very Strong' | 'Strong' | 'Medium' | 'Weak';
}

export interface ClinicalInteractionMatrix {
  featureNames: string[];
  cells: ClinicalInteractionMatrixCell[][];
  pairs: InteractionPair[];
}

export interface NetworkNode {
  id: string;
  label: string;
  score: number;
  clinicalCategory: string;
  val: number;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  category: 'Very Strong' | 'Strong' | 'Medium' | 'Weak';
  mi: number;
  corr: number;
  disease?: string;
}

export interface Phase5Summary {
  totalPairs: number;
  meanACIS: number;
  stdDevACIS: number;
  dynamicThreshold: number;
  passedPairsCount: number;
  pairs: InteractionPair[];
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  diseaseSpecificEdges: Record<string, NetworkEdge[]>;
  interactionMatrix?: ClinicalInteractionMatrix;
  weights?: {
    alpha: number;
    beta: number;
    gamma: number;
    delta: number;
  };
}

export interface CisPair {
  id: string;
  featureA: string;
  featureB: string;
  disease: string;
  acis: number;
  diseaseContribution: number;
  predictiveGain: number;
  stability: number;
  cis: number;
  category: 'Critical' | 'Strong' | 'Disease-Associated' | 'Moderate' | 'Weak' | 'Discarded';
  confidence: number;
  baselineAccuracy: number;
  enhancedAccuracy: number;
  clinicalNotes: string;
  timestamp: string;
}

export interface DiseaseInteractionPair {
  pairId: string;
  featureA: string;
  featureB: string;
  disease: 'Diabetes' | 'CKD' | 'Heart Disease';
  rank: number;
  interactionScore: number; // IS_{ij,d} = 0.20*MI + 0.15*C + 0.20*CO + 0.20*FI + 0.25*NID
  mi: number; // Normalized Mutual Information
  miRaw: number; // Raw MI in bits
  corr: number; // Normalized Absolute Correlation |rho|
  corrRaw: number; // Raw Pearson Correlation |r_ij|
  coOccurrence: number; // Normalized Disease-Specific Co-occurrence
  coOccurrenceRaw: number; // Joint elevated frequency ratio
  rawCoOccurrenceRatio?: number; // Explicit raw disease co-occurrence ratio (e.g. 2.73x, 8.12x)
  normalizedCoOccurrence?: number; // Explicit normalized co-occurrence strictly bounded to [0,1]
  weightedMI?: number; // 0.20 * MI_norm
  weightedCorr?: number; // 0.15 * correlation_norm
  weightedCO?: number; // 0.20 * coOccurrence_norm
  weightedFI?: number; // 0.20 * FI_norm
  weightedNID?: number; // 0.25 * NID_norm
  finalIS?: number; // Exact sum of weighted components
  auditIntegrityCheckPassed?: boolean; // abs(Final_IS - sum(weights * components)) < 1e-9
  featureImportanceContrib: number; // Normalized Feature Importance Contribution sqrt(FI_i * FI_j)
  featureImportanceRaw: number; // Geometric mean of disease head attributions
  nid: number; // Normalized Neural Interaction Delta (renamed from modelInteraction)
  nidRaw: number; // Raw NID: average |f_d(xi,xj) - f_d(xi,0) - f_d(0,xj) + f_d(0,0)|
  modelInteraction?: number; // Backward compatibility alias
  modelInteractionRaw?: number; // Backward compatibility alias
  redundancyFlag: 0 | 1; // 1 if |r_ij| > tau_r AND |NID_ij,d| < tau_n, otherwise 0
  status: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Review' | 'Redundant' | 'Weak' | 'NOT_CLASSIFIED';
  classification?: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Weak' | 'NOT_CLASSIFIED' | string;
  finalTier?: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Weak' | 'NOT_CLASSIFIED' | string;
  redundancyStatus?: 'NONE' | 'STRUCTURAL_DEMOGRAPHIC_REDUNDANCY' | 'STATISTICAL_REDUNDANCY' | string;
  redundancy_status?: string;
  downstreamEligible?: boolean;
  discoveryRank?: number;
  cisDiscoveryRank?: number;
  effectiveInteractionRank?: number | null;
  effectiveInteractionScore?: number | null;
  EffectiveInteractionScore?: number;
  incrementalGain?: number;
  normalizedIncrementalGain?: number;
  stability?: number;
  diseaseSpecificity?: number;
  CIS?: number;
  DAS?: number;
  cis?: number;
  das?: number;
  dasMargin?: number;
  incrementalPredictiveGain?: number;
  incremental_predictive_gain?: number;
  diseaseAssociation?: 'Disease-Associated' | 'Shared / General';
  disease_association?: 'Disease-Associated' | 'Shared / General';
  isDiseaseAssociated?: boolean;
  is_disease_associated?: boolean;
  auc_a?: number;
  auc_b?: number;
  aucA?: number;
  aucB?: number;
  individual_baseline_auc?: number;
  individualBaselineAuc?: number;
  auc_additive?: number;
  aucAdditive?: number;
  auc_interaction?: number;
  aucInteraction?: number;
  pair_gain?: number;
  pairGain?: number;
  interaction_synergy?: number;
  interactionSynergy?: number;
  xgbInteractionScore?: number;
  stabilityScore?: number;
  specificityScore?: number;
  specificityMargin?: number;
  specificity_margin?: number;
  das_margin?: number;
  mutual_information?: number;
  correlation?: number;
  spearman?: number;
  joint_abnormality?: number;
  jointAbnormality?: number;
  xgb_interaction?: number;
  specificity_score?: number;
  synergyAUC?: number;
  isRedundant?: boolean;
  delta_log_loss?: number;
  delta_deviance?: number;
  delta_p?: number;
  delta_i?: number;
  delta_auc?: number;
  delta_pr_auc?: number;
  delta_logloss?: number;
  stability_sd?: number;
  provenance_id?: string;
  Stage3_1_IS?: number;
  IIV_raw?: number;
  IIV_norm?: number;
  effective_interaction_score?: number;
  effective_sample_support?: number;
  cooccurrence_status?: string;
  redundancy_score?: number;
  stability_mean?: number;
  stability_score?: number;
  model_version?: string;
  source_stage?: string;
  explanation?: string;
  CIS_v1_DISCOVERY?: number;
  IPG?: number;
  cooccurrenceStatus?: 'NORMAL' | 'COOCCURRENCE_UNSTABLE' | 'UNSTABLE';
  criteriaPassed?: string[];
  criteriaFailed?: string[];
  classificationReason?: string;
  ipgNorm?: number;
  validationTier: 'Strong Predictive Interaction' | 'Disease-Associated Interaction' | 'Review / Moderate Interaction' | 'Redundant Association' | 'Weak Interaction';
  graphEligible: boolean; // Excluded from primary disease graph if redundant
  validationReport?: {
    bootstrap: {
      meanNID: number;
      ci95Lower: number;
      ci95Upper: number;
      replicates: number;
      stabilityScore: number; // 0.0 - 1.0 (e.g. 0.96)
      stable: boolean;
    };
    crossValidation: {
      foldAUCs: number[];
      meanOOF_AUC: number;
      baselineOOF_AUC: number;
      aucDelta: number; // e.g. +0.038
      pVal: number;
    };
    permutationTest: {
      nullMeanNID: number;
      nullStdNID: number;
      observedNID: number;
      permCount: number;
      empiricalPValue: number; // e.g. < 0.001
      significant: boolean;
    };
    ablation: {
      f_joint: number; // f(Xi, Xj)
      f_additive: number; // f(Xi) + f(Xj)
      interactionDelta: number; // f(Xi, Xj) - [f(Xi) + f(Xj)]
      logLossGain: number; // delta loss
      brierGain: number;
      synergyRatio: number; // e.g. +38.4% additional information
    };
  };
  clinicalInsight: string;
  clinicalDomainA?: string;
  clinicalDomainB?: string;
  modelPerturbations?: {
    f_ij: number;
    f_i0: number;
    f_0j: number;
    f_00: number;
    delta: number;
  };
}

export interface DiseaseGraphNode {
  id: string;
  name: string;
  domain: 'Glycemic' | 'Renal' | 'Lipid' | 'Vascular' | 'Anthropometric' | 'Hepatic' | 'Demographic';
  color: string;
  degree: number;
  weightedDegree: number;
  individualFeatureImportance: number; // Clarifying individual FI != pairwise interaction
  primaryInteractions: { target: string; is: number; nid: number }[];
}

export interface DiseaseGraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // IS_{ij,d}
  nid: number;
  correlation: number;
  rank: number;
  status: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Review' | 'Redundant' | 'Weak' | 'NOT_CLASSIFIED';
  classification?: string;
  finalTier?: string;
  diseaseAssociation?: 'Disease-Associated' | 'Shared / General';
  isDiseaseAssociated?: boolean;
  validationTier: string;
  isRedundant: boolean;
  isInPrimaryGraph: boolean; // E_d = E_{strong,d} \cup E_{validated-review,d}
}

export interface DiseaseGraph {
  disease: 'Heart Disease' | 'Diabetes' | 'CKD';
  nodes: DiseaseGraphNode[];
  edges: DiseaseGraphEdge[]; // All edges with inclusion flags
  primaryGraphEdges: DiseaseGraphEdge[]; // E_d = E_{strong,d} \cup E_{validated-review,d}
  density: number;
  avgDegree: number;
  topHubs: { feature: string; domain: string; connections: number; avgWeight: number }[];
  totalValidatedEdges: number; // E_{strong,d} + E_{validated-review,d}
  totalStrongEdges: number;
  totalReviewEdges: number;
  totalWeakEdges: number;
  totalRedundantEdges: number;
}

export interface DiseaseInteractionMatrix {
  disease: 'Heart Disease' | 'Diabetes' | 'CKD';
  featureNames: string[]; // 20 Features
  matrix: number[][]; // 20x20 Symmetric matrix with zero diagonal
  rankedPairs: DiseaseInteractionPair[]; // All 190 pairs sorted by IS
  top10: DiseaseInteractionPair[];
  top20: DiseaseInteractionPair[];
  graph: DiseaseGraph; // G_d = (V, E, W)
}

export interface Module3InteractionDiscoveryResult {
  featureNames: string[];
  totalCandidatePairs: number; // 190 = 20*(20-1)/2
  totalEvaluationsCount: number; // 570 = 190 * 3
  expectedPairsPerDisease: number; // 190
  validationPassed: boolean;
  diabetesMatrix: DiseaseInteractionMatrix;
  ckdMatrix: DiseaseInteractionMatrix;
  heartDiseaseMatrix: DiseaseInteractionMatrix;
  allPairs: DiseaseInteractionPair[]; // 570 pairs
  redundancyThresholds: {
    tau_r: number; // Default 0.80
    tau_n: number; // Default 0.15
  };
  weights: {
    mi: number;
    corr: number;
    coOccur: number;
    featImp: number;
    nid: number;
    modelInt?: number;
  };
  executionSummary: {
    totalRows: number;
    trainingSamples: number;
    validationSamples: number;
    equationsVerified: boolean;
    quarantinedVariables: string[];
    redundantPairCounts: Record<'Diabetes' | 'CKD' | 'Heart Disease', number>;
    strongPairCounts: Record<'Diabetes' | 'CKD' | 'Heart Disease', number>;
  };
}

export interface Level1FeatureRelevance {
  feature: string;
  scores: Record<string, number>; // Relevance score per disease (0.00 - 1.00)
  primaryDisease: string;
  clinicalCategory: string;
}

export interface Level2InteractionRelevance {
  pair: string;
  featureA: string;
  featureB: string;
  scores: Record<string, number>; // Relevance score per disease (0.00 - 1.00)
  primaryDisease: string;
  category: 'Critical' | 'Strong' | 'Moderate' | 'Weak';
}

export interface Level3DiseaseSignature {
  disease: string;
  importantFeatures: string[];
  importantInteractions: string[];
  diseasePattern: string;
  patternDescription: string;
  diagnosticConfidence?: number; // e.g. 0.96 (legacy optional)
  patternStrength?: number; // Normalized signature / pattern strength (0.00 - 1.00)
  pathologyMechanism?: string; // Optional clinical annotation if available from validated external knowledge
  signatureVector: string[];
}

export interface DiseaseKnowledgeMatrix {
  diseases: string[];
  level1Features: Level1FeatureRelevance[];
  level2Interactions: Level2InteractionRelevance[];
  level3Signatures: Level3DiseaseSignature[];
}

export interface Phase6Summary {
  pairs: CisPair[];
  criticalCount: number;
  strongCount: number;
  moderateCount: number;
  weakCount: number;
  discardedCount: number;
  diseaseBreakdown: Record<string, CisPair[]>;
  avgPredictiveGain: number;
  avgStability: number;
  knowledgeMatrix?: DiseaseKnowledgeMatrix;
}

export interface Level1Feature {
  featureName: string;
  importanceScore: number;
  clinicalCategory: string;
}

export interface BiologicalPattern {
  name: string; // e.g., 'Metabolic Pattern', 'Cardiovascular Pattern', 'Renal Pattern'
  system: 'Metabolism' | 'Cardiovascular' | 'Renal' | 'Other';
  features: string[]; // e.g., ['HbA1c', 'Glucose', 'BMI', 'Insulin']
  patternStrength: number; // e.g., 0.92
  strengthDescription: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';
  biologicalDescription: string;
  clinicalRelevance: string;
}

export interface Level2Interaction {
  pairId: string;
  featureA: string;
  featureB: string;
  cisScore: number;
  category: string;
}

export interface Level3Syndrome {
  syndromeName: string;
  description: string;
  keyFeatures: string[];
  severityIndex: number;
}

export interface DiseaseSignatureModel {
  disease: string;
  primaryPatternName: string; // e.g. 'Metabolic Pattern'
  primaryPatternStrength: number; // e.g. 0.92
  patternStrengthRating: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak'; // e.g. 'Very Strong'
  secondaryPatterns: { name: string; strength: number; rating: string }[];
  signatureFormula: string; // e.g. "0.65 * MetabolicPattern + 0.35 * CardiovascularPattern"
  signatureVector: string[];
  signatureExplanation: string;
}

export interface DiseasePattern {
  id: string;
  disease: string;
  features: string[];
  level1Features: Level1Feature[];
  level2Patterns: BiologicalPattern[]; // Step 1 & 2: Biological patterns (Metabolic, Cardio, Renal)
  level3DiseaseSignature: DiseaseSignatureModel; // Step 3: Disease Signature
  level4DiseaseName: string; // Level 4: Final Disease Target
  level2Interactions: Level2Interaction[];
  level3Syndromes: Level3Syndrome[];
  avgCis: number;
  diseaseAccuracy: number; // e.g. 0.96 (96%)
  coverage: number; // e.g. 0.94 (94% patient cohort coverage)
  patternScore: number; // Formula: Average(CIS) + DiseaseAccuracy + Coverage normalized or weighted
  clinicalNotes: string;
}

export interface Module2AuditMetadata {
  source_dataset: string;
  n_rows: number;
  n_features: number;
  dataset_hash: string;
  calculated_at: string;
  formula_version: string;
}

export interface Module2Feature {
  featureName: string;
  feature?: string;
  relevance: number;
  information: number;
  variability: number;
  weights: {
    relevance: number;
    information: number;
    variability: number;
  };
  weighted_contributions: {
    relevance: number;
    information: number;
    variability: number;
  };
  final_score: number;
  triadScore: number;
  raw: {
    mi: number;
    corr: number;
    variance: number;
    stdDev: number;
    entropy: number;
  };
  normalized: {
    relevance: number;
    information: number;
    variability: number;
  };
  audit: {
    varianceTransformation: string;
    entropyTransformation: string;
    targetAssociation: string;
  };
  status: 'KEPT' | 'NOT_KEPT';
  rank: number;
  clinicalCategory: string;
  interpretation: string;
}

export interface Module2Interaction {
  id: string;
  featureA: string;
  featureB: string;
  mi: number;
  correlation: number;
  coOccurrence: number;
  diseaseRelevance: number;
  weights: {
    mi: number;
    correlation: number;
    coOccurrence: number;
    diseaseRelevance: number;
  };
  weighted_contributions: {
    mi: number;
    correlation: number;
    coOccurrence: number;
    diseaseRelevance: number;
  };
  interactionScore: number;
  final_score: number;
  category: 'Very Strong' | 'Strong' | 'Medium' | 'Weak';
  clinicalInterpretation: string;
  calculationTrace: string;
}

export interface Module2Pattern {
  id: string;
  pattern_id?: string;
  name: string;
  pattern_name?: string;
  domain?: string;
  system: 'Metabolism' | 'Cardiovascular' | 'Renal' | 'Hepatic' | 'Other';
  contributingFeatures: string[];
  feature_members?: string[];
  featureContributions?: { feature: string; score: number; contribution: number }[];
  featureContribution: number;
  feature_contribution?: number;
  rawFeatureContribution?: number;
  supportingInteractions: string[];
  interaction_members?: string[];
  interactionContributions?: { interaction: string; score: number; contribution: number }[];
  interactionContribution: number;
  interaction_contribution?: number;
  rawInteractionContribution?: number;
  weights: {
    featureContrib: number;
    interactionContrib: number;
  };
  weighted_contributions: {
    featureContrib: number;
    interactionContrib: number;
  };
  patternStrength: number;
  pattern_strength?: number;
  rawPatternStrength?: number;
  final_pattern_strength: number;
  normalized_pattern_vector?: number[];
  pattern_vector?: number[];
  core_couplings?: string[];
  formula: string;
  formula_trace?: string;
  calculation_trace: string;
  cohortInterpretation: string;
}

export interface SignatureContributor {
  name: string;
  weight: number;
  rawWeight?: number;
  type: 'feature' | 'interaction';
  source?: string;
  sourcePattern?: string;
  patternWeight?: number;
  interactionWeight?: number;
  diseaseAttribution?: number;
  role: 'Core' | 'Supporting' | 'Interaction' | 'Shared contributor';
  sharingCount?: number;
  sharedAcrossDiseases?: string[];
  sharedWithDiseases?: string[];
  traceFormula?: string;
}

export interface Module2Signature {
  diseaseId: string;
  signature_id?: string;
  diseaseName: string;
  disease_name?: string;
  corePatternName: string;
  core_pattern?: string;
  secondaryPatternName?: string;
  vectorComponents: { name: string; weight: number }[];
  vectorValues: number[];
  rawSignatureVector?: number[];
  normalizedSignatureVector?: number[];
  raw_signature_vector?: number[];
  normalized_signature_vector?: number[];
  vectorSchema: string[];
  interaction_basis?: string[];
  patternMixtureFormula: string;
  pattern_mixture?: string;
  pattern_weights?: { primary: number; secondary: number };
  lambdaCoefficient: number;
  lambda?: number;
  lambda_reason?: string;
  lambda_source?: string;
  lambda_validation?: string;
  top_signature_contributors: SignatureContributor[];
  supporting_features: string[];
  supporting_interactions: string[];
  fold_vectors: number[][];
  fold_scores?: number[];
  prototype_similarity_metric: string;
  prototype_coherence?: number;
  prototypeCoherence?: number;
  stability_method_description: string;
  cosineSimilarity: number;
  representationStability: number;
  crossValMeanStability: number;
  crossValStdStability: number;
  positiveCohortSize: number;
  negativeCohortSize: number;
  vectorNorm: number;
  calculationTrace: string;
  clinicalInterpretation: string;
}

export interface Module2ValidationCheck {
  id: string;
  name: string;
  check_name?: string;
  category?: string;
  formulaOrRule: string;
  formula?: string;
  passed: boolean;
  expected: string;
  actual: string;
  difference: string;
  differenceNum?: number;
  tolerance: string;
  status: 'PASS' | 'FAIL';
  notes: string;
  severity?: 'MANDATORY' | 'WARNING';
  affectedTier?: string;
  affectedPatternOrSignature?: string;
  suggestedCorrection?: string;
}

export interface Module2ValidationResult {
  isValid: boolean;
  status: 'VALIDATED' | 'VALIDATION_FAILED';
  statusMessage: string;
  checks: Module2ValidationCheck[];
  totalChecks: number;
  passedChecks: number;
  rebuiltMemoryBankStatus: 'SYNCHRONIZED' | 'DESYNCHRONIZED';
  readinessStatus: string;
  timestamp: string;
}

export interface LearnedPatternInteraction {
  featureA: string;
  featureB: string;
  score: number;
  interactionClass: string;
  mi: number;
  corr: number;
  coOccur: number;
  fi: number;
  nid: number;
  primaryEdge: boolean;
}

export interface LearnedDiseasePattern {
  patternId: string; // e.g. 'DM-PAT-01'
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  patternName: string; // e.g. 'Glycemic Regulation Pattern'
  dominantDomain: string; // e.g. 'Glycemic'
  dominantEvidenceDomains?: string;
  rank: number;
  features: string[]; // List of core feature names
  coreFeatures: string[]; // Features with membership >= 0.60
  supportingFeatures: string[]; // Features with 0.25 <= membership < 0.60
  nonMemberFeatures: string[]; // Features with membership < 0.25
  interactions: LearnedPatternInteraction[];
  featureContribution: number; // mean(FI_{i,D} for i in Core(P))
  interactionContribution: number; // mean(IS_{i,j,D} for (i,j) in E(Core(P)))
  patternStrength: number; // 0.60 * FeatureContribution + 0.40 * InteractionContribution
  rawPatternScore?: number; // Raw aggregate score from feature and interaction components
  crossDomainLinkCount: number;
  patternStatus: 'Validated Active Pattern' | 'Strong Sub-Pattern' | 'Feature Cluster (Zero Retained Graph Edges)' | string;
  membershipScores: Record<string, number>; // feature -> membership score in [0, 1]
  patternVector: number[]; // 19-dimensional raw membership vector
  normalizedPatternVector: number[]; // 19-dimensional L2-normalized vector (||V||_2 = 1.0000)
  l1Norm: number;
  l2Norm: number;
  calculationTrace: {
    featureMeanFormula: string;
    interactionMeanFormula: string;
    patternStrengthFormula: string;
    vectorNormFormula: string;
  };
  subPatterns?: any[];
}

export interface PatternFeatureRow {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  patternId: string;
  feature: string;
  featureRank: number;
  featureImportance: number;
  featureContribution: number;
  clinicalDomain: string;
  membershipScore: number;
}

export interface PatternInteractionRow {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  patternId: string;
  featureA: string;
  featureB: string;
  interactionScore: number;
  mi: number;
  correlation: number;
  coOccurrence: number;
  fiAttribution: number;
  nid: number;
  interactionClass: string;
  primaryEdge: boolean;
  patternMember: string;
}

export interface PatternMembershipMatrixData {
  rowLabels: string[]; // e.g. ['Diabetes: DM-PAT-01 (Glycemic Regulation)', ...]
  featureColumns: string[]; // 20 validated clinical features
  matrix: number[][]; // Rows x 20 membership values [0.00..1.00]
  rows: {
    disease: 'Diabetes' | 'Heart Disease' | 'CKD';
    patternId: string;
    patternName: string;
    dominantDomain: string;
    values: Record<string, number>;
  }[];
}

export interface PatternIntegrityCheck {
  id: string; // e.g. 'CHK-P01'
  name: string;
  description: string;
  passed: boolean;
  actual: string;
  expected: string;
}

export interface Stage3HierarchicalPatternResult {
  totalDiseases: number; // 3
  totalLearnedPatterns: number; // 3 primary patterns
  diseasePatternCounts: {
    diabetes: number;
    heartDisease: number;
    ckd: number;
  };
  patternsByDisease: Record<'Diabetes' | 'Heart Disease' | 'CKD', LearnedDiseasePattern[]>;
  subPatternsByDisease?: Record<'Diabetes' | 'Heart Disease' | 'CKD', any[]>;
  allPatterns: LearnedDiseasePattern[]; // 3 primary patterns total: DM-PAT-01, HD-PAT-01, CKD-PAT-01
  allSubPatterns?: LearnedDiseasePattern[]; // Discovered graph community sub-patterns
  candidatePatterns?: LearnedDiseasePattern[]; // Internal candidate patterns for audit/debug
  candidatePatternsByDisease?: Record<'Diabetes' | 'Heart Disease' | 'CKD', LearnedDiseasePattern[]>;
  membershipMatrix: PatternMembershipMatrixData;
  featureRows: PatternFeatureRow[];
  interactionRows: PatternInteractionRow[];
  validationChecks: PatternIntegrityCheck[];
  allChecksPassed: boolean;
  lineage: {
    datasetHash: string;
    featureMatrixHash: string;
    interactionMatrixHash: string;
    version: string;
    timestamp: string;
    clusteringMethod: string;
    parameters: string;
  };
}

// =========================================================================
// STAGE 3.2.1 — PATTERN ROBUSTNESS, DEGENERACY & INTEGRITY TYPES
// =========================================================================

export type PatternRobustnessCategory = 'INFORMATIVE' | 'WEAK' | 'DEGENERATE' | 'REDUNDANT';

export interface PatternDegeneracyMetrics {
  patternId: string;
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  patternName: string;
  dominantDomain: string;
  category: PatternRobustnessCategory;
  reason: string;
  patternStrength: number;
  featureContribution: number;
  interactionContribution: number;
  nonZeroMembersCount: number;
  supportingMembersCount: number;
  coreMembersCount: number;
  primaryEdgesCount: number;
  meanMembership: number;
  maxMembership: number;
  l1Norm: number;
  l2Norm: number;
  effectiveFeatureCount: number; // (sum m_i)^2 / sum (m_i^2)
}

export interface MetricDistribution {
  mean: number;
  median: number;
  stdDev: number;
  ci95Lower: number;
  ci95Upper: number;
}

export interface BootstrapPatternStability {
  patternId: string;
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  patternName: string;
  dominantDomain: string;
  bootstrapRuns: number;
  cosineSimilarity: MetricDistribution;
  coreJaccard: MetricDistribution;
  supportingJaccard: MetricDistribution;
  primaryEdgeStability: MetricDistribution;
  patternStrength: MetricDistribution;
  stabilityStatus: 'High Stability' | 'Moderate Stability' | 'Low / Variable Stability';
}

export interface PatternCountSensitivity {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  k: number;
  modularity: number;
  silhouetteScore: number;
  withinPatternSimilarity: number;
  betweenPatternSimilarity: number;
  separationRatio: number;
  interactionDensity: number;
  membershipConcentration: number;
  bootstrapStability: number;
  isBaseline: boolean;
  assessment: string;
}

export interface HeartDiseaseDominanceAudit {
  featureName: 'Heart_Disease_History';
  targetCorrelation: number;
  classification: 'Proxy Variable / Semantic Target Duplicate';
  directLeakage: boolean;
  proxyDominance: boolean;
  attributionFraction: number;
  sensitivityAnalysis: {
    modelA_withHistory: {
      topFeature: string;
      topFeatureAttribution: number;
      hdPat01Strength: number;
      coreMembers: string[];
      supportingMembers: string[];
      primaryEdgesCount: number;
      interactionDensity: number;
    };
    modelB_withoutHistory: {
      topFeature: string;
      topFeatureAttribution: number;
      hdPat01Strength: number;
      coreMembers: string[];
      supportingMembers: string[];
      primaryEdgesCount: number;
      interactionDensity: number;
      emergentPatternDominance: string;
    };
  };
  finding: string;
  recommendation: string;
}

export interface CkdPatternConsistencyAudit {
  patternId: 'CKD-PAT-01';
  dominantDomain: string;
  coreMembers: string[];
  supportingMembers: string[];
  retainedEdges: {
    edge: string;
    isScore: number;
    nid: number;
    status: string;
    isPrimary: boolean;
    clinicalRationale: string;
  }[];
  anchorMechanism: string;
  graphFaithfulness: string;
}

export interface PatternOverlapPair {
  patternA: string;
  patternB: string;
  diseaseA: string;
  diseaseB: string;
  isSameDisease: boolean;
  cosineSimilarity: number;
  membershipOverlap: number;
  coreOverlapCount: number;
  supportingOverlapCount: number;
  edgeOverlapCount: number;
  redundancyStatus: 'Distinct' | 'Moderately Overlapping' | 'Redundant';
}

export interface ThresholdSensitivityEvaluation {
  patternId: string;
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  thresholdSet: '0.50 / 0.20' | '0.60 / 0.25 (Baseline)' | '0.70 / 0.30';
  coreThreshold: number;
  supportThreshold: number;
  coreMembers: string[];
  supportingMembers: string[];
  nonMembers: string[];
  isStable: boolean;
}

export interface Stage3_2_1_ValidationResult {
  baselineSnapshot: {
    datasetHash: string;
    dimensions: { rows: number; cols: number };
    featureCount: number;
    featureList: string[];
    targetCount: number;
    targetList: string[];
    matrix2Hash: string;
    baselineChecksPassed: number;
    baselineTotalChecks: number;
    frozenTimestamp: string;
  };
  checks15to24: PatternIntegrityCheck[];
  all24Checks: PatternIntegrityCheck[];
  matrix2ExactReproduction: {
    maxAbsoluteError: number;
    meanAbsoluteError: number;
    mismatchesCount: number;
    tolerance: number;
    passed: boolean;
  };
  matrix2SchemaAlignment: {
    columnsCorrect: boolean;
    exactOrderMatches: boolean;
    metadataSeparated: boolean;
    passed: boolean;
  };
  patternDegeneracyResults: PatternDegeneracyMetrics[];
  summaryCounts: {
    informativeCount: number;
    weakCount: number;
    degenerateCount: number;
    redundantCount: number;
  };
  bootstrapStabilityResults: BootstrapPatternStability[];
  patternCountSensitivityResults: PatternCountSensitivity[];
  heartDiseaseDominanceAudit: HeartDiseaseDominanceAudit;
  ckdConsistencyAudit: CkdPatternConsistencyAudit;
  patternOverlapPairs: PatternOverlapPair[];
  thresholdSensitivityResults: ThresholdSensitivityEvaluation[];
  decisionGate: {
    mathematicalStatus: 'PASS (14/14 Integrity Checks Verified)';
    statisticalStatus: 'PASS WITH CAUTION (Proxy Dominance & Edge-Sparse Clusters Documented)';
    selectedOption: 'OPTION B — READY WITH CAUTION';
    stage3_2Locked: boolean;
    stage3_3Permitted: boolean;
    disclaimer: string;
  };
}

export interface Module2AuthoritativeResult {
  features: Module2Feature[];
  interactions: Module2Interaction[];
  patterns: Module2Pattern[];
  signatures: Module2Signature[];
  representationSchema: string[];
  retentionThreshold: number;
  weights: {
    featureWeights: { relevance: number; information: number; variability: number };
    interactionWeights: { mi: number; correlation: number; coOccurrence: number; diseaseRelevance: number };
    patternWeights: { featureContrib: number; interactionContrib: number };
    lambda: number;
  };
  datasetStats: {
    rowCount: number;
    featureCount: number;
    targetCol: string;
    datasetHash: string;
    missingValues: number;
    duplicateRows: number;
  };
  datasetHash: string;
  validation: Module2ValidationResult;
  datasetFingerprint: string;
  auditMetadata: Module2AuditMetadata;
  status: 'Mathematically Validated — Ready for Module 3' | 'Validation Failed — Module 3 Locked';
  timestamp: string;
}

export interface Phase7Summary {
  patterns: DiseasePattern[];
  biologicalPatterns: BiologicalPattern[]; // All extracted biological patterns
  diseasePatternLibrary: Record<string, DiseasePattern>;
  overallLibraryScore: number;
  topPatternDisease: string;
  timestamp: string;
  authoritativeModule2?: Module2AuthoritativeResult;
}

// --- Phase 8: Disease Pattern Graph Builder Types ---
export interface PatternGraphNode {
  id: string;
  name: string;
  type: 'feature' | 'interaction' | 'pattern' | 'signature' | 'disease';
  level: 1 | 2 | 3 | 4;
  system?: 'Metabolism' | 'Cardiovascular' | 'Renal' | 'Other';
  importance?: number;
  description: string;
  category?: string;
  associatedDiseases: string[];
}

export interface PatternGraphEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  sourceName: string;
  targetName: string;
  weight: number; // e.g. 0.95 (HbA1c -> Metabolic Pattern), 0.98 (Metabolic Pattern -> Diabetes)
  weightRating: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';
  type: 'feature-to-pattern' | 'interaction-to-pattern' | 'pattern-to-disease' | 'pattern-to-signature' | 'signature-to-disease';
  clinicalContribution: string;
  isSharedMechanism?: boolean;
}

export interface PatternCrossTalkMapping {
  patternName: string;
  system: 'Metabolism' | 'Cardiovascular' | 'Renal' | 'Other';
  patternStrength: number;
  upstreamFeatures: string[];
  downstreamDiseases: {
    disease: string;
    edgeWeight: number; // e.g. 0.98 for Diabetes, 0.88 for Obesity, 0.82 for Fatty Liver Disease
    clinicalContribution: 'Very Strong' | 'Strong' | 'Moderate';
    pathwayMechanism: string;
  }[];
  clinicalSignificance: string;
}

export interface DiseaseSignatureGraphCard {
  disease: string;
  signatureName: string;
  features: string[];
  interactions: string[]; // e.g. ['HbA1c ↔ Glucose']
  pattern: string; // e.g. 'Metabolic Pattern'
  diseaseName: string; // e.g. 'Diabetes'
  signatureConfidence: number;
  sharedDiseases: string[];
  formula: string;
  explanation: string;
}

export interface PatientActivationTraceResult {
  patientId?: string;
  activeFeatures: string[];
  activatedInteractions: string[];
  activatedPatterns: { name: string; activationLevel: number; status: 'Very High' | 'High' | 'Moderate' | 'Normal' }[];
  activatedSignatures: { disease: string; matchScore: number; status: string }[];
  predictedDiseases: { disease: string; probability: number; riskLevel: 'High' | 'Moderate' | 'Low' }[];
  pathwayExplanation: string;
}

export interface Phase8Summary {
  nodes: PatternGraphNode[];
  edges: PatternGraphEdge[];
  patternCrossTalk: PatternCrossTalkMapping[];
  diseaseSignatures: DiseaseSignatureGraphCard[];
  totalNodes: number;
  totalEdges: number;
  graphDensity: number;
  avgEdgeWeight: number;
  sharedMechanismsCount: number;
  topCrossTalkPattern: string;
  timestamp: string;
}

export interface Phase9Step1Features {
  featureCount: number;
  features: Record<string, number | string>;
  vectorRepresentation: string; // X = [x1, x2, ..., x30]
}

export interface Phase9Step2Interaction {
  feature1: string;
  feature2: string;
  pairLabel: string;
  interactionScore: number;
  isSelectedForPatient: boolean;
}

export interface Phase9Step3PatternMatch {
  diseasePattern: string;
  patternId: string;
  patternFeatures: string[];
  matchedFeaturesCount: number;
  totalPatternFeaturesCount: number;
  matchedFeatureDetails: Array<{ feature: string; expected: string; patientValue: string | number; matched: boolean }>;
  similarityRatio: number; // e.g. 1.0
  similarityPercent: number; // e.g. 100%
}

export interface Phase9Step4MemoryRetrieval {
  disease: string;
  accuracy: number; // e.g. 0.97
  coverage: number; // e.g. 0.91
  patternStability: number; // e.g. 0.94
  memoryConfidence: number; // Accuracy * Coverage * PatternStability = 0.83
}

export interface Phase9Step5FusedRow {
  featureName: string;
  value: string | number;
  category: 'Original Clinical' | 'Interaction Score' | 'Pattern Similarity' | 'Memory Confidence' | 'Pattern Descriptor';
  source: string;
}

export interface Phase9Step6ModelEvaluation {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucScore: number;
  isSelected: boolean;
}

export interface Phase9Step7Calibration {
  uncalibratedProbPercent: number; // e.g. 99%
  calibratedProbPercent: number; // e.g. 94%
  calibrationMethod: 'Platt Scaling' | 'Isotonic Regression';
}

export interface Phase9Step8Risk {
  probabilityPercent: number; // e.g. 94%
  riskLevel: 'Low' | 'Moderate' | 'High';
  riskRange: string; // '70–100%'
  colorBadge: string;
}

export interface Phase9Step9Report {
  predictedDisease: string;
  calibratedConfidencePercent: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  mainFeatures: string[];
  strongestInteraction: { pair: string; score: number };
  matchedDiseasePattern: { name: string; similarityPercent: number };
  memoryConfidencePercent: number;
}

export interface Phase10InputFormData {
  age: number;
  gender: 'Male' | 'Female';
  bmi: number;
  hba1c: number;
  glucose: number;
  systolicBp: number;
  diastolicBp: number;
  hdl: number;
  ldl: number;
  creatinine: number;
  egfr: number;
  albumin: number;
  triglycerides: number;
  ast: number;
  alt: number;
  insulin: number;
  uricAcid: number;
  hemoglobin: number;
}

export interface Phase10ClinicalRecommendation {
  category: string;
  action: string;
  urgency: 'Routine' | 'Moderate' | 'Urgent';
}

export interface Phase10PredictionResult {
  predictedDisease: string;
  confidencePercent: number; // e.g. 93%
  uncalibratedConfidencePercent: number; // e.g. 98%
  riskLevel: 'Low' | 'Moderate' | 'High';
  riskRange: string; // e.g. "70–100%"
  colorBadge: string;
  preprocessingLogs: Array<{ step: string; transformation: string; result: string }>;
  topFeatureContributions: Array<{ feature: string; val: string | number; impactPercent: number; direction: 'positive' | 'negative' }>;
  strongestInteractions: Array<{ pair: string; score: number; relevance: string }>;
  diseasePatternMatches: Array<{ patternName: string; similarityPercent: number; matchedCount: number; totalCount: number }>;
  recommendations: Phase10ClinicalRecommendation[];
  fusedVectorLength: number;
  timestamp: string;
}

export interface MemoryBankEntry {
  disease: string;
  accuracy: number;
  coverage: number;
  stability: number;
  memoryConfidence: number; // Accuracy * PatternStability * SampleCoverage
  patternFeatures: string[];
}

export interface PatternSimilarityResult {
  disease: string;
  similarity: number; // 0 to 100%
  matchedPatternId: string;
}

export interface FusedFeatureVector {
  originalFeatures: Record<string, number>;
  interactionScores: Record<string, number>;
  patternSimilarities: Record<string, number>;
  memoryConfidence: number;
  patternConfidence: number;
  diseaseClusterId: string;
}

export interface DynamicFeatureWeight {
  featureName: string;
  baseImportance: number;
  diseaseContext: string;
  adaptiveWeight: number; // FeatureImportance_i * PatternConfidence * MemoryConfidence
}

export interface EnsembleModelSelection {
  selectedModel: 'XGBoost' | 'LightGBM' | 'MLP Neural Network' | 'Random Forest';
  datasetSize: number;
  nonLinearityScore: number;
  selectionReason: string;
  validationAccuracy: number;
  evaluations: Phase9Step6ModelEvaluation[];
}

export interface ExplainableContribution {
  featureName: string;
  contributionPercent: number; // e.g. 32 for +32%
  direction: 'positive' | 'negative';
}

export interface KaUdpmPatientPrediction {
  patientId: string;
  patientName: string;
  clinicalValues: Record<string, number>;
  predictedDisease: string;
  rawConfidence: number; // e.g. 99%
  calibratedConfidence: number; // e.g. 92% (Platt Scaling)
  patternSimilarities: PatternSimilarityResult[];
  topContributors: ExplainableContribution[];
  strongestInteraction: { pair: string; cisScore: number };
  matchedPattern: { patternId: string; disease: string; similarity: number };
  dynamicWeights: DynamicFeatureWeight[];
  fusedVector: FusedFeatureVector;
  // Explicit 9.1-9.9 steps breakdown
  step1Features: Phase9Step1Features;
  step2Interactions: Phase9Step2Interaction[];
  step3PatternMatches: Phase9Step3PatternMatch[];
  step4MemoryRetrieval: Phase9Step4MemoryRetrieval;
  step5FusedTable: Phase9Step5FusedRow[];
  step6ModelEvaluations: Phase9Step6ModelEvaluation[];
  step7Calibration: Phase9Step7Calibration;
  step8Risk: Phase9Step8Risk;
  step9Report: Phase9Step9Report;
}

export interface Phase9Summary {
  modelName: string; // Knowledge-Augmented Universal Disease Prediction Model (KA-UDPM)
  memoryBank: MemoryBankEntry[];
  selectedEnsemble: EnsembleModelSelection;
  samplePatientPredictions: KaUdpmPatientPrediction[];
  activePatientPrediction: KaUdpmPatientPrediction;
  overallAccuracy: number;
  overallCalibrationError: number;
  timestamp: string;
}

// =========================================================================
// STAGE 3.3 — DATA-DERIVED DISEASE SIGNATURE TYPES
// =========================================================================

export interface Stage3_3_DiseaseSignature {
  diseaseId: 'DIS-DM' | 'DIS-HD' | 'DIS-CKD';
  diseaseName: 'Diabetes' | 'Heart Disease' | 'CKD';
  signatureName: string;
  primaryPatternId?: string; // e.g. 'DM-PAT-01', 'HD-PAT-01', 'CKD-PAT-01'
  dominantDomain?: string; // Dominant learned biological/clinical category
  patternStrength?: number; // Metric used to rank candidate patterns
  rawPatternScore?: number; // Raw aggregate score from learned components
  patterns: LearnedDiseasePattern[];
  patternWeights: {
    patternId: string;
    patternName: string;
    dominantDomain: string;
    rawStrength: number;
    normalizedWeight: number;
  }[];
  coreFeatures: string[];
  supportingFeatures: string[];
  primaryInteractionEdges: LearnedPatternInteraction[];
  secondaryInteractionEdges: LearnedPatternInteraction[];
  featureLevelContribution: number;
  interactionLevelContribution: number;
  patternLevelContribution: number;
  signatureVector: number[];
  normalizedSignatureVector: number[];
  l1Norm: number;
  l2Norm: number;
  signatureConfidence: number;
  qualityGrade: 'HIGH-CONFIDENCE' | 'MODERATE-CONFIDENCE' | 'LOW-SIGNAL';
  featureRankings: {
    feature: string;
    canonicalIndex: number;
    signatureWeight: number;
    normalizedWeight: number;
    primaryPattern: string;
    clinicalDomain: string;
  }[];
  lineage: {
    datasetHash: string;
    pipelineVersion: string;
    stage: '3.3';
    sourcePatternIds: string[];
    matrix2SnapshotHash: string;
    timestamp: string;
  };
}

export interface CrossDiseaseSignatureComparison {
  diseaseA: 'Diabetes' | 'Heart Disease' | 'CKD';
  diseaseB: 'Diabetes' | 'Heart Disease' | 'CKD';
  cosineSimilarity: number;
  euclideanDistance: number;
  jaccardCoreFeatures: number;
  sharedCoreFeatures: string[];
  diseaseAUniqueCore: string[];
  diseaseBUniqueCore: string[];
  sharedInteractionEdges: string[];
  diseaseAUniqueEdges: string[];
  diseaseBUniqueEdges: string[];
  statisticalOverlapClassification: 'HIGH OVERLAP' | 'MODERATE DIVERGENCE' | 'HIGHLY DISTINCT';
}

export interface Stage3_3_SignatureResult {
  signatures: Record<'Diabetes' | 'Heart Disease' | 'CKD', Stage3_3_DiseaseSignature>;
  signatureList: Stage3_3_DiseaseSignature[];
  comparisons: CrossDiseaseSignatureComparison[];
  featureColumns: string[];
  allSignaturesNormalized: boolean;
  lineage: {
    datasetHash: string;
    pipelineVersion: string;
    timestamp: string;
    matrix1Hash: string;
    matrix2Hash: string;
  };
}

// =========================================================================
// STAGE 3.4 — XGBOOST DISEASE PREDICTION & RISK TYPES
// =========================================================================

export interface XgbDiseaseModelArtifact {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  diseaseId: 'XGB-DM' | 'XGB-HD' | 'XGB-CKD';
  status: 'Trained';
  featuresCount: 19;
  augmentedFeaturesCount?: number;
  canonicalFeatures: string[];
  validatedInteractions?: {
    featureA: string;
    featureB: string;
    label: string;
    cis: number;
    das: number;
  }[];
  architectureStatement?: string;
  hyperparameters: {
    n_estimators: number;
    max_depth: number;
    learning_rate: number;
    subsample: number;
    colsample_bytree: number;
    min_child_weight: number;
    reg_lambda: number;
    scale_pos_weight: number;
  };
  dataSplits: {
    trainRecords: number;
    trainPositive: number;
    trainNegative: number;
    valRecords: number;
    testRecords: number;
    testPositive: number;
    testNegative: number;
    prevalence: number;
    imbalanceRatio: number;
  };
  classificationThreshold: number;
  testMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    specificity: number;
    f1: number;
    rocAuc: number;
    prAuc: number;
    confusionMatrix: {
      tp: number;
      fp: number;
      tn: number;
      fn: number;
    };
  };
  ablationStudy?: {
    baselineMetrics: {
      accuracy: number;
      precision: number;
      recall: number;
      specificity: number;
      f1: number;
      rocAuc: number;
      prAuc: number;
    };
    augmentedMetrics: {
      accuracy: number;
      precision: number;
      recall: number;
      specificity: number;
      f1: number;
      rocAuc: number;
      prAuc: number;
    };
    gainPercentage: {
      f1GainPct: number;
      rocAucGainPct: number;
      prAucGainPct: number;
    };
  };
  topModelFeatures: {
    feature: string;
    weight: number;
    direction: 'Positive' | 'Negative';
  }[];
}

export interface XgbPatientPrediction {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  diseaseId: 'XGB-DM' | 'XGB-HD' | 'XGB-CKD';
  probability: number;
  classification: 'Positive' | 'Negative';
  threshold: number;
  predictedClass: 0 | 1;
  topModelContributingFeatures: {
    feature: string;
    contribution: number;
    direction: string;
  }[];
  linkedHdplPattern: {
    patternId: string;
    patternName: string;
    keyFeatures: string[];
    keyInteractions: string[];
  };
}

export interface XgbPatientInferenceResponse {
  patientId: string;
  patientName: string;
  inputValidation: {
    isValid: boolean;
    errors: string[];
    validatedValues: Record<string, number>;
  };
  predictions: Record<'Diabetes' | 'Heart Disease' | 'CKD', XgbPatientPrediction>;
  predictionList: XgbPatientPrediction[];
  generatedAt: string;
  modelVersion: string;
  featureSchemaVersion: string;
  disclaimer: string;
  architectureStatement?: string;
}

export interface Stage3_4_XgbPredictionResult {
  models: Record<'Diabetes' | 'Heart Disease' | 'CKD', XgbDiseaseModelArtifact>;
  modelList: XgbDiseaseModelArtifact[];
  trainingSummary: {
    datasetHash: string;
    totalRecords: number;
    validatedFeaturesCount: 19;
    modelsCount: 3;
    status: 'Complete';
  };
  samplePatientInferences: XgbPatientInferenceResponse[];
  activePatientInference: XgbPatientInferenceResponse;
  lineage: {
    datasetHash: string;
    pipelineVersion: string;
    timestamp: string;
    status: 'COMPLETE AND LOCKED';
  };
}

// Backward compatibility aliases
export type KaUdpmMemoryBankNode = any;
export type KaUdpmPatientInferenceEvaluation = XgbPatientInferenceResponse;
export type KaUdpmContractForModule4 = any;
export type Stage3_4_KaUdpmResult = Stage3_4_XgbPredictionResult;

// =========================================================================
// MODULE 3 FINAL EXECUTIVE AUDIT & COMPLETION GATE TYPES
// =========================================================================

export interface Module3ExecutiveCheckItem {
  id: string;
  stage: 'Dataset' | 'Stage 3.1' | 'Stage 3.2' | 'Stage 3.2.1' | 'Stage 3.3' | 'Stage 3.4' | 'System';
  name: string;
  requirement: string;
  passed: boolean;
  expectedValue: string;
  actualValue: string;
  rootCause?: string;
  remedy?: string;
}

export interface Module3ExecutiveAuditReport {
  overallStatus: 'MODULE 3 — COMPLETE AND LOCKED' | 'MODULE 3 — BLOCKED';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  stageStatuses: {
    stage3_1: 'LOCKED';
    stage3_2: 'LOCKED';
    stage3_2_1: 'PASSED (24/24)';
    stage3_3: 'COMPLETE (3/3 Signatures)';
    stage3_4: 'COMPLETE (3/3 XGBoost Models Trained)';
    module3: 'COMPLETE AND LOCKED';
  };
  checks: Module3ExecutiveCheckItem[];
  artifacts: {
    datasetHash: string;
    featuresCount: number;
    diseasesCount: number;
    interactionPairsEvaluated: number;
    retainedPrimaryEdgesCount: number;
    learnedPatternsCount: number;
    diseaseSignaturesCount: number;
    memoryBankNodesCount: number;
  };
  exportManifest: {
    fileName: string;
    rowCount: number;
    description: string;
    hash: string;
  }[];
  timestamp: string;
}

// =========================================================================
// EVIDENCE-DRIVEN HIERARCHICAL DISEASE PATTERN LEARNING (HDPL) TYPES
// =========================================================================

export interface HdplLevel0Feature {
  featureName: string;
  clinicalCategory: string;
  description: string;
  isEligible: boolean;
}

export interface HdplLevel1FeatureContribution {
  featureName: string;
  clinicalCategory: string;
  originalContribution: number; // Preserved exactly from Stage 3.2
  normalizedHierarchicalContribution: number; // Normalized [0..1] for hierarchical comparison
  rank: number;
  isCoreFeature: boolean; // FI_norm >= 0.60
  isSupportingFeature: boolean; // 0.30 <= FI_norm < 0.60
}

export interface HdplLevel2Interaction {
  pairId: string;
  featureA: string;
  featureB: string;
  interactionScore: number; // IS_ij,D preserved
  mi: number;
  correlation: number;
  cooccurrence: number;
  fiAttribution: number;
  nidDelta: number;
  classification: 'Strong' | 'Disease-Associated' | 'Moderate' | 'Review' | 'Weak' | 'Redundant' | 'NOT_CLASSIFIED';
  relationshipType: string;
  isPrimaryPatternSupport: boolean; // Strong or Disease-Associated
  redundancyStatus: 'Non-Redundant' | 'Review-Pending' | 'Redundant';
}

export interface HdplSubPattern {
  subPatternId: string; // e.g. 'SP-DM-01'
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  subPatternName: string; // e.g. 'Glycemic-Metabolic Statistical Sub-Pattern'
  parentPatternId: string; // e.g. 'DM-PAT-PRIMARY'
  supportingFeatures: string[];
  supportingFeatureContributions: Record<string, { original: number; normalized: number }>;
  supportingInteractions: HdplLevel2Interaction[];
  featureContribution: number; // Aggregate normalized feature score [0..1]
  interactionContribution: number; // Aggregate normalized interaction score [0..1]
  internalCoherence: number; // Mean normalized internal pairwise IS [0..1]
  subPatternStrength: number; // 0.40 * FC + 0.40 * IC + 0.20 * Coherence
  featureCount: number;
  interactionCount: number;
  redundancyStatus: 'Non-Redundant' | 'Unique' | 'Filtered';
  lineage: {
    datasetHash: string;
    sourceInteractionIds: string[];
    timestamp: string;
  };
}

export interface HdplPrimaryDiseasePattern {
  disease: 'Diabetes' | 'Heart Disease' | 'CKD';
  primaryPatternId: string; // 'DM-PAT-PRIMARY' | 'HD-PAT-PRIMARY' | 'CKD-PAT-PRIMARY'
  patternTitle: string; // e.g. 'Diabetes Primary Disease Pattern'
  dominantFeatureDomain: string; // e.g. 'Glycemic-metabolic statistical domain'
  originalStage32Score: number; // Preserved & immutable Stage 3.2 score
  hierarchicalStrength: number; // 0.35*FC + 0.35*IC + 0.20*Coherence - 0.10*Redundancy
  scoreComponents: {
    featureComponent: number;
    interactionComponent: number;
    coherenceComponent: number;
    redundancyPenalty: number;
  };
  coreFeatures: HdplLevel1FeatureContribution[];
  allRankedFeatures: HdplLevel1FeatureContribution[];
  keyInteractions: HdplLevel2Interaction[];
  supportingSubPatterns: HdplSubPattern[];
  coverageRatio: number;
  scientificDisclaimer: string;
}

export interface HdplSharedStatisticalPattern {
  sharedPatternId: string; // e.g. 'SHARED-STAT-01'
  sharedPatternName: string; // e.g. 'Cardiometabolic Lipoprotein Dysregulation'
  associatedDiseases: ('Diabetes' | 'Heart Disease' | 'CKD')[];
  sharedFeatures: string[];
  sharedInteractions: string[];
  similarityScore: number;
  contributionStrength: number;
  structuralDescription: string;
}

export interface EvidenceDrivenHdplResult {
  primaryPatterns: Record<'Diabetes' | 'Heart Disease' | 'CKD', HdplPrimaryDiseasePattern>;
  primaryPatternList: HdplPrimaryDiseasePattern[];
  allSubPatterns: HdplSubPattern[];
  subPatternsByDisease: Record<'Diabetes' | 'Heart Disease' | 'CKD', HdplSubPattern[]>;
  sharedStatisticalPatterns: HdplSharedStatisticalPattern[];
  level0Features: HdplLevel0Feature[];
  lineage: {
    datasetHash: string;
    stage32Hash: string;
    version: string;
    timestamp: string;
  };
  immutablePreservationCheck: {
    stage32ScoresPreserved: boolean;
    featureAttributionsUntouched: boolean;
    interactionScoresUntouched: boolean;
    classificationsPreserved: boolean;
  };
}

export interface InteractionValidationCheck {
  checkId: string;
  title: string;
  passed: boolean;
  diagnostic: string;
}

export interface InteractionValidationReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  allPassed: boolean;
  versionHash: string;
  checks: InteractionValidationCheck[];
}

export interface HierarchicalDiseaseNode {
  id: string;
  type: 'DISEASE';
  diseaseId: 'Diabetes' | 'Heart Disease' | 'CKD';
  diseaseName: string;
  targetDefinition: string;
  patternId: string;
  level: 0;
  x: number;
  y: number;
}

export interface HierarchicalPatternNode {
  id: string;
  type: 'PATTERN';
  patternId: string;
  diseaseId: 'Diabetes' | 'Heart Disease' | 'CKD';
  patternDomain: string;
  evidenceDomains: string;
  patternStrength: number;
  featureContribution: number;
  interactionContribution: number;
  coreCount: number;
  supportingCount: number;
  contextualCount: number;
  level: 1;
  x: number;
  y: number;
}

export interface HierarchicalFeatureNode {
  id: string;
  type: 'FEATURE';
  featureId: string;
  featureName: string;
  clinicalDomain: string;
  membership: number;
  normalizedFi: number;
  rawFi: number;
  hierarchyTier: string;
  interactionDegree: number;
  level: 3;
  x: number;
  y: number;
}

export type HierarchicalGraphNode =
  | HierarchicalDiseaseNode
  | HierarchicalPatternNode
  | HierarchicalFeatureNode;

export interface HierarchicalStructuralEdge {
  id: string;
  type: 'HAS_PATTERN' | 'HAS_CORE_FEATURE' | 'HAS_SUPPORTING_FEATURE' | 'HAS_CONTEXTUAL_FEATURE';
  source: string;
  target: string;
  diseaseId: string;
  sourceStage: string;
}

export interface HierarchicalInteractionEdge {
  id: string;
  type: 'INTERACTS_WITH';
  source: string;
  target: string;
  featureA: string;
  featureB: string;
  diseaseId: string;
  interactionScore: number;
  mi: number;
  absoluteCorrelation: number;
  coOccurrence: number;
  fiAttribution: number;
  nidDelta: number;
  classification: string;
  stage_3_1_source: string;
  graph_edge_status: string;
  pairId: string;
}

export type HierarchicalGraphEdge = HierarchicalStructuralEdge | HierarchicalInteractionEdge;

export interface HierarchicalDiseaseGraph {
  diseaseId: 'Diabetes' | 'Heart Disease' | 'CKD';
  diseaseName: string;
  patternId: string;
  targetDefinition: string;
  nodes: HierarchicalGraphNode[];
  edges: HierarchicalGraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    structuralEdgesCount: number;
    interactionEdgesCount: number;
    version: string;
    timestamp: string;
    lockedSource: string;
  };
}

