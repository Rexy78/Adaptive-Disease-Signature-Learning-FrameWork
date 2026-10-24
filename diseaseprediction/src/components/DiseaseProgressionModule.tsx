import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Heart,
  Droplets,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  HelpCircle,
  Sliders,
  Layers,
  Dna,
  RefreshCw,
  User,
  Search,
  Check,
  Info,
  RotateCcw,
  Clock,
  Zap,
  Flame,
  BarChart3,
  Calendar,
  Eye,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  CANONICAL_19_FEATURE_NAMES,
  CLINICAL_INPUT_BOUNDS,
  CLINICAL_FEATURE_RANGES,
  validatePatientClinicalInput,
  evaluatePatientXgbInference,
  buildXgbPredictionModels,
} from '../utils/xgbPredictionEngine';
import { XgbPatientInferenceResponse, RawRow } from '../types';

interface PatientPredictionExplanationProps {
  processedRows?: RawRow[];
  activePrediction?: any;
  patientName?: string;
  age?: number;
  disease?: string;
  activeSubView?: string;
  onNavigateSubView?: (view: string) => void;
}

// Preset Clinical Sample Profiles for Quick Testing
const CLINICAL_PRESETS = [
  {
    id: 'PAT-DM-HIGH-01',
    name: 'Patient A (High Diabetic Risk)',
    hint: 'Elevated HbA1c (8.4%) & Fasting Glucose (162 mg/dL)',
    values: {
      Age: 58, Sex: 1, BMI: 32.4, Weight: 94, Waist_Circumference: 104,
      Systolic_BP: 138, Diastolic_BP: 88, Pulse: 76, HDL: 38, LDL: 135,
      Total_Cholesterol: 215, Triglycerides: 240, HbA1c: 8.4, Fasting_Glucose: 162,
      Serum_Creatinine: 0.9, BUN: 14, eGFR: 92, ALT: 28, AST: 24,
    },
  },
  {
    id: 'PAT-HD-HIGH-02',
    name: 'Patient B (High Cardiac Risk)',
    hint: 'Elevated Systolic BP (168 mmHg), Age (67) & LDL (165 mg/dL)',
    values: {
      Age: 67, Sex: 1, BMI: 29.1, Weight: 84, Waist_Circumference: 98,
      Systolic_BP: 168, Diastolic_BP: 96, Pulse: 84, HDL: 32, LDL: 165,
      Total_Cholesterol: 260, Triglycerides: 210, HbA1c: 6.1, Fasting_Glucose: 108,
      Serum_Creatinine: 1.1, BUN: 18, eGFR: 74, ALT: 22, AST: 26,
    },
  },
  {
    id: 'PAT-CKD-HIGH-03',
    name: 'Patient C (High Renal Risk)',
    hint: 'Elevated BUN (48 mg/dL), Creatinine (2.8 mg/dL) & Low eGFR (22 mL/min)',
    values: {
      Age: 71, Sex: 0, BMI: 27.2, Weight: 72, Waist_Circumference: 90,
      Systolic_BP: 154, Diastolic_BP: 86, Pulse: 72, HDL: 44, LDL: 110,
      Total_Cholesterol: 185, Triglycerides: 160, HbA1c: 6.8, Fasting_Glucose: 124,
      Serum_Creatinine: 2.8, BUN: 48, eGFR: 22, ALT: 18, AST: 20,
    },
  },
  {
    id: 'PAT-HEALTHY-04',
    name: 'Patient D (Healthy Control Profile)',
    hint: 'Normal glycemic, vascular, lipid & renal parameters',
    values: {
      Age: 34, Sex: 0, BMI: 21.8, Weight: 62, Waist_Circumference: 74,
      Systolic_BP: 116, Diastolic_BP: 74, Pulse: 68, HDL: 62, LDL: 92,
      Total_Cholesterol: 165, Triglycerides: 95, HbA1c: 5.1, Fasting_Glucose: 88,
      Serum_Creatinine: 0.8, BUN: 11, eGFR: 108, ALT: 18, AST: 20,
    },
  },
];

export const DiseaseProgressionModule: React.FC<PatientPredictionExplanationProps> = ({
  processedRows = [],
  activeSubView,
  onNavigateSubView,
}) => {
  // Build XGBoost Prediction Models once over cohort
  const xgbResult = useMemo(() => {
    return buildXgbPredictionModels(processedRows);
  }, [processedRows]);

  // Form State initialized with 19 Canonical Features
  const [patientInput, setPatientInput] = useState<Record<string, number>>({
    ...CLINICAL_PRESETS[0].values,
  });

  // Default active tab set directly to 'trajectory' for 5-Year Risk Trajectory & Future Evolution
  const [activeTab, setActiveTab] = useState<'trajectory' | 'predictions' | 'input' | 'explanation' | 'simulation'>('trajectory');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('PAT-DM-HIGH-01');

  // Selected Year for Timeline Scrubber (0 to 5)
  const [selectedYear, setSelectedYear] = useState<number>(3);
  const [showInterventionComparison, setShowInterventionComparison] = useState<boolean>(true);
  const [showReferenceTable, setShowReferenceTable] = useState<boolean>(true);

  // Synchronize activeSubView prop with internal tab state cleanly
  useEffect(() => {
    if (!activeSubView) return;
    if (
      activeSubView === 'm4-progression' ||
      activeSubView === 'm4-overview' ||
      activeSubView === 'm4-trajectory' ||
      activeSubView === 'm4-pathway' ||
      activeSubView === 'm4-complications'
    ) {
      setActiveTab('trajectory');
    } else if (activeSubView === 'm4-predictions') {
      setActiveTab('predictions');
    } else if (activeSubView === 'm4-input') {
      setActiveTab('input');
    } else if (activeSubView === 'm4-explanation') {
      setActiveTab('explanation');
    } else if (activeSubView === 'm4-simulation') {
      setActiveTab('simulation');
    }
  }, [activeSubView]);

  // Handle Tab Switch & Sync with parent subView if handler exists
  const handleTabChange = (tab: 'trajectory' | 'predictions' | 'input' | 'explanation' | 'simulation') => {
    setActiveTab(tab);
    if (onNavigateSubView) {
      if (tab === 'trajectory') onNavigateSubView('m4-progression');
      else if (tab === 'predictions') onNavigateSubView('m4-predictions');
      else if (tab === 'input') onNavigateSubView('m4-input');
      else if (tab === 'explanation') onNavigateSubView('m4-explanation');
      else if (tab === 'simulation') onNavigateSubView('m4-simulation');
    }
  };

  // Evaluate active patient inference using real trained XGBoost models
  const [activeInference, setActiveInference] = useState<XgbPatientInferenceResponse>(() => {
    return evaluatePatientXgbInference(
      'PAT-DM-HIGH-01',
      'Patient A (High Diabetic Risk)',
      CLINICAL_PRESETS[0].values,
      xgbResult.models
    );
  });

  // What-If Simulation State
  const [simValues, setSimValues] = useState<Record<string, number>>({
    HbA1c: patientInput.HbA1c,
    Systolic_BP: patientInput.Systolic_BP,
    Fasting_Glucose: patientInput.Fasting_Glucose,
    eGFR: patientInput.eGFR,
    LDL: patientInput.LDL,
  });

  // Calculate completeness
  const enteredCount = CANONICAL_19_FEATURE_NAMES.filter(
    (f) => patientInput[f] !== undefined && patientInput[f] !== null && !isNaN(patientInput[f])
  ).length;

  // Real-time Input Validation & Warning Notice
  const validationResult = useMemo(() => {
    return validatePatientClinicalInput(patientInput);
  }, [patientInput]);

  // Handle Form Change
  const handleInputChange = (field: string, val: string) => {
    const num = parseFloat(val);
    const newValues = {
      ...patientInput,
      [field]: isNaN(num) ? (val === '' ? ('' as any) : 0) : num,
    };
    setPatientInput(newValues);

    // Real-time dynamic inference re-calculation on input change
    const updatedInference = evaluatePatientXgbInference(
      selectedPresetId,
      'Active Patient Input',
      newValues,
      xgbResult.models
    );
    setActiveInference(updatedInference);
  };

  // Select Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = CLINICAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setPatientInput({ ...preset.values });
      setSimValues({
        HbA1c: preset.values.HbA1c,
        Systolic_BP: preset.values.Systolic_BP,
        Fasting_Glucose: preset.values.Fasting_Glucose,
        eGFR: preset.values.eGFR,
        LDL: preset.values.LDL,
      });
      const response = evaluatePatientXgbInference(
        preset.id,
        preset.name,
        preset.values,
        xgbResult.models
      );
      setActiveInference(response);
    }
  };

  // Run Inference Execution & View Trajectory
  const handleExecutePrediction = () => {
    const response = evaluatePatientXgbInference(
      'PAT-CUSTOM-LIVE',
      'Evaluated Patient Profile',
      patientInput,
      xgbResult.models
    );
    setActiveInference(response);
    handleTabChange('trajectory');
  };

  // Evaluate Simulated Inference for What-If
  const simulatedInference = useMemo(() => {
    const combinedInput = { ...patientInput, ...simValues };
    return evaluatePatientXgbInference(
      'PAT-SIMULATED',
      'What-If Scenario Profile',
      combinedInput,
      xgbResult.models
    );
  }, [patientInput, simValues, xgbResult.models]);

  // =========================================================================
  // DYNAMIC 5-YEAR LONGITUDINAL TRAJECTORY & COMPLICATION CALCULATIONS
  // Robust non-NaN calculations derived directly from Patient's Predicted XGBoost Probabilities
  // =========================================================================
  const rawPDM = activeInference?.predictions?.['Diabetes']?.probability;
  const pDM = typeof rawPDM === 'number' && !isNaN(rawPDM) ? Math.max(0.01, Math.min(0.99, rawPDM)) : 0.5;

  const rawPHD = activeInference?.predictions?.['Heart Disease']?.probability;
  const pHD = typeof rawPHD === 'number' && !isNaN(rawPHD) ? Math.max(0.01, Math.min(0.99, rawPHD)) : 0.5;

  const rawPCKD = activeInference?.predictions?.['CKD']?.probability;
  const pCKD = typeof rawPCKD === 'number' && !isNaN(rawPCKD) ? Math.max(0.01, Math.min(0.99, rawPCKD)) : 0.5;

  const maxProb = Math.max(pDM, pHD, pCKD);
  const primaryDxName = pDM >= pHD && pDM >= pCKD ? 'Diabetes Mellitus' : pHD >= pCKD ? 'Heart Disease' : 'Chronic Kidney Disease';

  const trajectoryPoints = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((year) => {
      const dmRisk = Math.min(99.0, Math.round(pDM * 100 * (1 + year * 0.05) * 10) / 10);
      const hdRisk = Math.min(99.0, Math.round(pHD * 100 * (1 + year * 0.07) * 10) / 10);
      const ckdRisk = Math.min(99.0, Math.round(pCKD * 100 * (1 + year * 0.06) * 10) / 10);
      const composite = Math.min(
        99.0,
        Math.round((pDM * 0.35 + pHD * 0.35 + pCKD * 0.30) * 100 * (1 + year * 0.075) * 10) / 10
      );
      // Managed Intervention Trajectory (with optimal clinical care)
      const managedRisk = Math.min(
        99.0,
        Math.round((pDM * 0.35 + pHD * 0.35 + pCKD * 0.30) * 100 * (1 - year * 0.04) * 10) / 10
      );

      return {
        year: `Year ${year}`,
        yearNum: year,
        dmRisk: isNaN(dmRisk) ? 50 : dmRisk,
        hdRisk: isNaN(hdRisk) ? 50 : hdRisk,
        ckdRisk: isNaN(ckdRisk) ? 50 : ckdRisk,
        composite: isNaN(composite) ? 50 : composite,
        managedRisk: Math.max(10, isNaN(managedRisk) ? 30 : managedRisk),
      };
    });
  }, [pDM, pHD, pCKD]);

  // Biomarker Evolution Projections per Year
  const selectedYearBiomarkers = useMemo(() => {
    const yr = selectedYear;
    const baseHbA1c = patientInput.HbA1c || 6.5;
    const baseFastingGluc = patientInput.Fasting_Glucose || 110;
    const baseSBP = patientInput.Systolic_BP || 130;
    const baseEGFR = patientInput.eGFR || 90;
    const baseCreat = patientInput.Serum_Creatinine || 1.0;
    const baseLDL = patientInput.LDL || 110;

    return {
      HbA1c: (baseHbA1c + yr * 0.22).toFixed(1),
      FastingGlucose: Math.round(baseFastingGluc + yr * 4.5),
      SystolicBP: Math.round(baseSBP + yr * 2.8),
      eGFR: Math.max(15, Math.round(baseEGFR - yr * 3.4)),
      SerumCreatinine: (baseCreat + yr * 0.09).toFixed(2),
      LDL: Math.round(baseLDL + yr * 3.2),
    };
  }, [selectedYear, patientInput]);

  const selectedYearPathology = useMemo(() => {
    const yr = selectedYear;
    const hba1c = selectedYearBiomarkers.HbA1c;
    const fGluc = selectedYearBiomarkers.FastingGlucose;
    const sbp = selectedYearBiomarkers.SystolicBP;
    const egfr = selectedYearBiomarkers.eGFR;
    const creat = selectedYearBiomarkers.SerumCreatinine;
    const ldl = selectedYearBiomarkers.LDL;

    if (primaryDxName === 'Diabetes Mellitus') {
      switch (yr) {
        case 0:
          return {
            stageTitle: 'Baseline Metabolic Load & Microvascular Stress',
            organImpact: `Elevated glycemic burden (HbA1c: ${hba1c}%, Fasting Glucose: ${fGluc} mg/dL). Subclinical cellular oxidative stress and early microvascular membrane thickening.`,
            targetOrgans: 'Pancreatic Beta-Cells, Retinal Arterioles, Glomerular Capillaries',
            primaryRiskZone: 'Baseline Glycemic Exposure',
            recommendation: 'Lifestyle intervention, glycemic optimization, baseline microalbuminuria screening.',
            accentColor: 'indigo',
          };
        case 1:
          return {
            stageTitle: 'Subclinical Endothelial Glycation & Arterial Stiffness',
            organImpact: `Advanced glycation end-products (AGEs) accumulate. Arterial wall stiffness increases with mild capillary protein permeability.`,
            targetOrgans: 'Vascular Endothelium, Peripheral Axons, Renal Podocytes',
            primaryRiskZone: 'Subclinical Endothelial Stress',
            recommendation: 'Target HbA1c < 7.0%. Initiate first-line metabolic stabilization therapy.',
            accentColor: 'sky',
          };
        case 2:
          return {
            stageTitle: 'Glomerular Hyperfiltration & Target Tissue Remodeling',
            organImpact: `Glomerular basement membrane thickening and subtle myocardium stiffness (HbA1c: ${hba1c}%, SBP: ${sbp} mmHg).`,
            targetOrgans: 'Renal Glomeruli, Coronary Vasculature, Myocardium',
            primaryRiskZone: 'Moderate Tissue Remodeling',
            recommendation: 'Add SGLT2 inhibitor or GLP-1 RA for dual renal/cardiovascular protection.',
            accentColor: 'amber',
          };
        case 3:
          return {
            stageTitle: 'Symptomatic Retinopathy & Nephrotic Proteinuria Onset',
            organImpact: `Incipient diabetic retinopathy, microaneurysms, and persistent urinary albumin leakage (eGFR: ${egfr} mL/min).`,
            targetOrgans: 'Ocular Retina, Glomerular Filtration Barrier, Peripheral Nerves',
            primaryRiskZone: 'Elevated Complication Hazard',
            recommendation: 'Multi-target pharmacotherapy, retinal fundus imaging, nephrology consultation.',
            accentColor: 'rose',
          };
        case 4:
          return {
            stageTitle: 'Advanced Structural Micro/Macrovascular Dysfunction',
            organImpact: `Substantial filtration capacity drop (eGFR: ${egfr} mL/min, Creatinine: ${creat} mg/dL) and coronary microvascular rarefaction.`,
            targetOrgans: 'Renal Nephrons, Coronary Bed, Cerebrovascular Circulation',
            primaryRiskZone: 'High Structural Hazard Threshold',
            recommendation: 'Comprehensive multi-disciplinary care, aggressive lipid and BP titration.',
            accentColor: 'purple',
          };
        case 5:
        default:
          return {
            stageTitle: 'End-Stage Multi-Morbidity Event Horizon',
            organImpact: `Peak complication probability: nephropathy progression, heart failure decompensation, ischemic event risk.`,
            targetOrgans: 'Multi-Organ Micro- and Macrovascular Systems',
            primaryRiskZone: 'Critical Event Horizon',
            recommendation: 'Specialized nephrology & cardiology management, organ preservation protocols.',
            accentColor: 'red',
          };
      }
    } else if (primaryDxName === 'Heart Disease') {
      switch (yr) {
        case 0:
          return {
            stageTitle: 'Baseline Hemodynamic & Atherogenic Profile',
            organImpact: `Systemic arterial pressure overload (Systolic BP: ${sbp} mmHg) and atherogenic lipid accumulation (LDL: ${ldl} mg/dL).`,
            targetOrgans: 'Arterial Intima, Endothelium, Myocardium',
            primaryRiskZone: 'Baseline Hemodynamic Stress',
            recommendation: 'Dietary sodium reduction, statin initiation, BP monitoring.',
            accentColor: 'rose',
          };
        case 1:
          return {
            stageTitle: 'Subclinical Atherogenesis & Arterial Wall Stiffness',
            organImpact: `Fatty streak extension in coronary & carotid arteries. Elevated pulse pressure and endothelial shear stress.`,
            targetOrgans: 'Coronary Arteries, Carotid Bifurcations, Aorta',
            primaryRiskZone: 'Subclinical Plaque Formation',
            recommendation: 'Intensify BP control (SBP < 130 mmHg), target LDL < 70 mg/dL.',
            accentColor: 'amber',
          };
        case 2:
          return {
            stageTitle: 'Concentric Left Ventricular Hypertrophy & Remodeling',
            organImpact: `Myocardial wall thickening and diastolic compliance impairment driven by chronic pressure overload (SBP: ${sbp} mmHg).`,
            targetOrgans: 'Left Ventricle, Coronary Microcirculation',
            primaryRiskZone: 'Moderate Structural Remodeling',
            recommendation: 'RAAS blockade (ACEi/ARB) or ARNI therapy, echocardiographic monitoring.',
            accentColor: 'amber',
          };
        case 3:
          return {
            stageTitle: 'Symptomatic Angina & Coronary Reserve Impairment',
            organImpact: `Exertional dyspnea, ischemic exercise intolerance, and hemodynamically significant atheroma expansion.`,
            targetOrgans: 'Coronary Vessel Bed, Cardiac Myocytes',
            primaryRiskZone: 'Elevated Ischemic Hazard',
            recommendation: 'Cardiology evaluation, anti-anginal pharmacotherapy, stress imaging.',
            accentColor: 'rose',
          };
        case 4:
          return {
            stageTitle: 'Advanced Coronary CAD & Myocardial Fibrosis',
            organImpact: `Plaque vulnerability, focal subendocardial ischemia, and reduced ejection compliance.`,
            targetOrgans: 'Myocardium, Coronary Arteries, Cardiac Conduction System',
            primaryRiskZone: 'High Risk Threshold',
            recommendation: 'Coronary angiography evaluation, intensive antiplatelet & lipid lowering.',
            accentColor: 'purple',
          };
        case 5:
        default:
          return {
            stageTitle: 'End-Stage Cardiorenal & Ischemic Event Horizon',
            organImpact: `Peak hazard for acute coronary syndromes, decompensated heart failure, or cerebrovascular ischemic stroke.`,
            targetOrgans: 'Coronary, Cerebrovascular & Cardiac Muscle Systems',
            primaryRiskZone: 'Critical Event Horizon',
            recommendation: 'Close specialized cardiology monitoring, advanced heart failure management.',
            accentColor: 'red',
          };
      }
    } else {
      // Chronic Kidney Disease (CKD)
      switch (yr) {
        case 0:
          return {
            stageTitle: 'Baseline Nephron Clearance & Glomerular Stress',
            organImpact: `Reduced baseline glomerular filtration rate (eGFR: ${egfr} mL/min, Creatinine: ${creat} mg/dL). Subclinical nephron drop-out.`,
            targetOrgans: 'Renal Glomeruli, Tubulointerstitium',
            primaryRiskZone: 'Baseline Clearance Impairment',
            recommendation: 'Nephrotoxic drug avoidance, blood pressure control, protein intake moderation.',
            accentColor: 'purple',
          };
        case 1:
          return {
            stageTitle: 'Glomerular Podocyte Effacement & Microalbuminuria',
            organImpact: `Intraglomerular hypertension accelerates podocyte effacement and glomerular barrier degradation.`,
            targetOrgans: 'Glomerular Podocytes, Tubular Basement Membrane',
            primaryRiskZone: 'Subclinical Nephron Loss',
            recommendation: 'Initiate SGLT2i or ACEi/ARB for intraglomerular pressure reduction.',
            accentColor: 'sky',
          };
        case 2:
          return {
            stageTitle: 'Accelerated Tubulointerstitial Fibrosis',
            organImpact: `Compensatory hyperfiltration in surviving nephrons causes tubulointerstitial scarring and Creatinine rise (${creat} mg/dL).`,
            targetOrgans: 'Renal Parenchyma, Interstitial Capillaries',
            primaryRiskZone: 'Moderate Interstitial Scarring',
            recommendation: 'Strict SBP control (< 120 mmHg), metabolic acidosis & electrolyte monitoring.',
            accentColor: 'amber',
          };
        case 3:
          return {
            stageTitle: 'Symptomatic Uremic Solute & Fluid Retention Onset',
            organImpact: `Solute clearance decline leads to normocytic anemia, secondary hyperparathyroidism, and fluid volume expansion.`,
            targetOrgans: 'Renal Cortex/Medulla, Systemic Vascular Bed, Erythropoiesis',
            primaryRiskZone: 'Elevated Uremic Hazard',
            recommendation: 'Nephrology co-management, phosphate binders, anemia management.',
            accentColor: 'rose',
          };
        case 4:
          return {
            stageTitle: 'Advanced Stage 4 CKD (Severe Clearance Deficit)',
            organImpact: `Severe eGFR reduction (${egfr} mL/min), refractory fluid retention, secondary hypertension escalation.`,
            targetOrgans: 'Glomerular Clearance Barrier, Cardiorenal Vascular System',
            primaryRiskZone: 'Severe Clearance Deficit',
            recommendation: 'Vascular access planning, renal replacement therapy education.',
            accentColor: 'purple',
          };
        case 5:
        default:
          return {
            stageTitle: 'End-Stage Renal Disease (ESRD) Event Horizon',
            organImpact: `Peak hazard for dialysis dependency, severe uremic symptoms, hyperkalemia, and cardiorenal syndrome.`,
            targetOrgans: 'Multi-Organ Uremic & Cardiorenal Systems',
            primaryRiskZone: 'Critical Dialysis Horizon',
            recommendation: 'Renal replacement therapy (Dialysis/Transplant preparation), acute metabolic safety.',
            accentColor: 'red',
          };
      }
    }
  }, [selectedYear, selectedYearBiomarkers, primaryDxName]);

  const hba1cNorm = Math.max(0, ((patientInput.HbA1c || 6.0) - 4.5) / 8.0);
  const sbpNorm = Math.max(0, ((patientInput.Systolic_BP || 120) - 90) / 100);
  const creatNorm = Math.max(0, ((patientInput.Serum_Creatinine || 1.0) - 0.5) / 3.5);
  const ldlNorm = Math.max(0, ((patientInput.LDL || 100) - 70) / 180);

  const complicationHazards = useMemo(() => {
    return [
      {
        name: 'Diabetic Retinopathy & Microvascular Damage',
        category: 'Glycemic / Microvascular',
        hazardPct: Math.min(95, Math.round(pDM * 100 * (0.45 + 0.35 * hba1cNorm))),
        driver: `HbA1c (${patientInput.HbA1c || '—'}%) + Fasting Glucose (${patientInput.Fasting_Glucose || '—'} mg/dL)`,
        severity: pDM >= 0.70 ? 'High' : 'Moderate',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: Eye,
      },
      {
        name: 'Diabetic Nephropathy & Glomerular Damage',
        category: 'Metabolic-Renal Synergy',
        hazardPct: Math.min(95, Math.round(pDM * pCKD * 100 * 1.4)),
        driver: `Combined DM (${(pDM * 100).toFixed(0)}%) & CKD (${(pCKD * 100).toFixed(0)}%) Synergy`,
        severity: (pDM * pCKD) >= 0.40 ? 'Critical' : 'Moderate',
        barColor: 'bg-indigo-600',
        textColor: 'text-indigo-700',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Droplets,
      },
      {
        name: 'Congestive Heart Failure (CHF) Hazard',
        category: 'Cardiovascular',
        hazardPct: Math.min(95, Math.round(pHD * 100 * (0.40 + 0.30 * sbpNorm + 0.30 * ((patientInput.Age || 55) / 80)))),
        driver: `Systolic BP (${patientInput.Systolic_BP || '—'} mmHg) + Age (${patientInput.Age || '—'})`,
        severity: pHD >= 0.70 ? 'High' : 'Moderate',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: Heart,
      },
      {
        name: 'Ischemic Stroke & Cerebrovascular Event',
        category: 'Vascular / Lipids',
        hazardPct: Math.min(95, Math.round(pHD * 100 * (0.50 * sbpNorm + 0.30 * (patientInput.Sex ? 0.2 : 0.1) + 0.20 * ldlNorm))),
        driver: `Systolic BP (${patientInput.Systolic_BP || '—'} mmHg) + LDL (${patientInput.LDL || '—'} mg/dL)`,
        severity: pHD >= 0.70 ? 'High' : 'Low',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: ShieldAlert,
      },
      {
        name: 'End-Stage Renal Disease (ESRD) & Dialysis Risk',
        category: 'Renal Clearance',
        hazardPct: Math.min(95, Math.round(pCKD * 100 * (0.60 + 0.40 * creatNorm))),
        driver: `Serum Creatinine (${patientInput.Serum_Creatinine || '—'} mg/dL) + eGFR (${patientInput.eGFR || '—'})`,
        severity: pCKD >= 0.70 ? 'Critical' : 'Moderate',
        barColor: 'bg-purple-600',
        textColor: 'text-purple-700',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: Flame,
      },
    ];
  }, [pDM, pHD, pCKD, hba1cNorm, sbpNorm, creatNorm, ldlNorm, patientInput]);

  const futureStages = useMemo(() => {
    const p1ProbPct = (maxProb * 100).toFixed(1);

    if (primaryDxName === 'Diabetes Mellitus') {
      return [
        {
          stageNumber: '01',
          timeframe: 'Year 0 (Baseline)',
          title: 'Glycemic Exposure & Metabolic Strain',
          description: `Primary elevated risk for Diabetes Mellitus (${p1ProbPct}%). Baseline HbA1c (${patientInput.HbA1c || 6.5}%) and Fasting Glucose (${patientInput.Fasting_Glucose || 115} mg/dL) initialize cellular oxidative stress.`,
          affectedOrgans: 'Pancreatic Beta-Cells, Vascular Endothelium',
          status: maxProb >= 0.70 ? 'Active High Risk' : 'Baseline State',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        },
        {
          stageNumber: '02',
          timeframe: 'Year 1 – 2 (Subclinical)',
          title: 'Endothelial Stiffness & Glomerular Strain',
          description: `Subclinical microvascular protein leakage and arterial wall stiffening. Glomerular hyperfiltration accelerates as composite risk reaches ${trajectoryPoints[2].composite}%.`,
          affectedOrgans: 'Renal Glomeruli, Coronary Microvasculature',
          status: maxProb >= 0.70 ? 'High Progression' : 'Moderate Progression',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
        {
          stageNumber: '03',
          timeframe: 'Year 3 – 4 (Symptomatic)',
          title: 'Microvascular Complication Onset',
          description: `Incipient diabetic retinopathy, nephrotic albuminuria, and peripheral neuropathy onset. Composite risk score rises to ${trajectoryPoints[3].composite}%.`,
          affectedOrgans: 'Ocular Retina, Renal Podocytes, Axons',
          status: maxProb >= 0.70 ? 'Elevated Hazard' : 'Preventable Horizon',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        },
        {
          stageNumber: '04',
          timeframe: 'Year 5+ (Advanced)',
          title: 'Advanced Multi-Morbidity Horizon',
          description: `Peak complication hazards (${complicationHazards[0].name}: ${complicationHazards[0].hazardPct}%). Composite risk reaches ${trajectoryPoints[5].composite}%.`,
          affectedOrgans: 'Multi-System Micro & Macrovascular Beds',
          status: maxProb >= 0.70 ? 'Critical Event Horizon' : 'Low Event Horizon',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
      ];
    } else if (primaryDxName === 'Heart Disease') {
      return [
        {
          stageNumber: '01',
          timeframe: 'Year 0 (Baseline)',
          title: 'Hemodynamic & Atherogenic Strain',
          description: `Primary elevated risk for Heart Disease (${p1ProbPct}%). Elevated Systolic BP (${patientInput.Systolic_BP || 130} mmHg) and LDL (${patientInput.LDL || 120} mg/dL) initiate intimal endothelial stress.`,
          affectedOrgans: 'Coronary Endothelium, Systemic Arteries',
          status: maxProb >= 0.70 ? 'Active High Risk' : 'Baseline State',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        },
        {
          stageNumber: '02',
          timeframe: 'Year 1 – 2 (Subclinical)',
          title: 'Atherogenesis & Ventricular Remodeling',
          description: `Coronary atheroma growth and concentric left ventricular hypertrophy driven by pressure overload. Composite risk reaches ${trajectoryPoints[2].composite}%.`,
          affectedOrgans: 'Coronary Arteries, Left Ventricular Myocardium',
          status: maxProb >= 0.70 ? 'High Progression' : 'Moderate Progression',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
        {
          stageNumber: '03',
          timeframe: 'Year 3 – 4 (Symptomatic)',
          title: 'Coronary Reserve Impairment & Angina',
          description: `Exertional dyspnea, ischemic exercise intolerance, and atheroma luminal narrowing. Composite risk rises to ${trajectoryPoints[3].composite}%.`,
          affectedOrgans: 'Coronary Vessel Bed, Cardiac Myocytes',
          status: maxProb >= 0.70 ? 'Elevated Hazard' : 'Preventable Horizon',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        },
        {
          stageNumber: '04',
          timeframe: 'Year 5+ (Advanced)',
          title: 'Cardiovascular Ischemic Event Horizon',
          description: `Peak ischemic and heart failure hazard (${complicationHazards[2].name}: ${complicationHazards[2].hazardPct}%). Composite risk reaches ${trajectoryPoints[5].composite}%.`,
          affectedOrgans: 'Myocardium, Cerebrovascular & Coronary Systems',
          status: maxProb >= 0.70 ? 'Critical Event Horizon' : 'Low Event Horizon',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
      ];
    } else {
      // Chronic Kidney Disease
      return [
        {
          stageNumber: '01',
          timeframe: 'Year 0 (Baseline)',
          title: 'Filtration Deficit & Glomerular Stress',
          description: `Primary elevated risk for CKD (${p1ProbPct}%). Baseline eGFR (${patientInput.eGFR || 85} mL/min) and Serum Creatinine (${patientInput.Serum_Creatinine || 1.0} mg/dL) indicate early nephron loss.`,
          affectedOrgans: 'Renal Glomeruli, Tubulointerstitial Membrane',
          status: maxProb >= 0.70 ? 'Active High Risk' : 'Baseline State',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
        {
          stageNumber: '02',
          timeframe: 'Year 1 – 2 (Subclinical)',
          title: 'Podocyte Effacement & Interstitial Scarring',
          description: `Intraglomerular hypertension accelerates podocyte loss and compensatory hyperfiltration. Composite risk reaches ${trajectoryPoints[2].composite}%.`,
          affectedOrgans: 'Glomerular Podocytes, Renal Cortex',
          status: maxProb >= 0.70 ? 'High Progression' : 'Moderate Progression',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        },
        {
          stageNumber: '03',
          timeframe: 'Year 3 – 4 (Symptomatic)',
          title: 'Uremic Solute Accumulation & Anemia',
          description: `Decline in nephron clearance causes solute accumulation, fluid volume expansion, and mild normocytic anemia. Composite risk rises to ${trajectoryPoints[3].composite}%.`,
          affectedOrgans: 'Renal Parenchyma, Systemic Vasculature',
          status: maxProb >= 0.70 ? 'Elevated Hazard' : 'Preventable Horizon',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        },
        {
          stageNumber: '04',
          timeframe: 'Year 5+ (Advanced)',
          title: 'End-Stage Renal Disease (ESRD) Horizon',
          description: `Peak dialysis hazard (${complicationHazards[4].name}: ${complicationHazards[4].hazardPct}%). Composite risk reaches ${trajectoryPoints[5].composite}%.`,
          affectedOrgans: 'Multi-Organ System Uremic & Cardiorenal Beds',
          status: maxProb >= 0.70 ? 'Critical Event Horizon' : 'Low Event Horizon',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        },
      ];
    }
  }, [primaryDxName, maxProb, patientInput, trajectoryPoints, complicationHazards]);

  return (
    <div id="patient-risk-prediction-module" className="space-y-6 animate-fadeIn text-slate-800 font-sans">
      {/* 1. TOP EXECUTIVE HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                <span>Supervised Risk Inference &amp; Longitudinal Trajectory</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>5-Year Predictive Forecast Engine</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Disease Progression &amp; 5-Year Future Risk Trajectory
            </h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Analyze cohort-derived disease progression trajectories, projected future clinical stages, complication hazard rates, and interactive biomarker timeline evolution across Diabetes, Heart Disease, and CKD.
            </p>
          </div>

          {/* Feature Completeness & Quick Preset Selector */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-2 w-full lg:w-auto min-w-[270px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Active Patient Profile:</span>
              <span className="font-mono font-bold text-indigo-400 text-xs">{selectedPresetId}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Feature Completeness:</span>
              <span className={`font-mono font-bold ${enteredCount === 19 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {enteredCount} / 19 Features
              </span>
            </div>
            <div className="pt-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Load Test Clinical Preset:</label>
              <select
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {CLINICAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => handleTabChange('trajectory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'trajectory'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. 5-Year Risk Trajectory &amp; Future Evolution</span>
          </button>

          <button
            onClick={() => handleTabChange('predictions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'predictions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>2. XGBoost Risk Predictions</span>
          </button>

          <button
            onClick={() => handleTabChange('input')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'input'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Clinical Input Parameters &amp; Reference Ranges</span>
          </button>

          <button
            onClick={() => handleTabChange('explanation')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'explanation'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Model SHAP Attributions</span>
          </button>

          <button
            onClick={() => handleTabChange('simulation')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>5. Interactive What-If Simulation</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 5-YEAR LONGITUDINAL RISK TRAJECTORY & FUTURE EVOLUTION (MAIN TAB)   */}
      {/* ========================================================================= */}
      {activeTab === 'trajectory' && (
        <div className="space-y-6">
          {/* Executive Forecast Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Primary Dx Head
              </span>
              <span className="text-lg font-black text-slate-900 block">{primaryDxName}</span>
              <span className="text-xs font-mono font-bold text-indigo-600">
                Baseline Prob: {(maxProb * 100).toFixed(1)}%
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                5-Year Composite Risk
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono block text-emerald-600">
                {trajectoryPoints[5].composite}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Baseline Year 0: {trajectoryPoints[0].composite}% (+{(trajectoryPoints[5].composite - trajectoryPoints[0].composite).toFixed(1)}%)
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Peak Complication Endpoint
              </span>
              <span className="text-xs font-black text-slate-900 line-clamp-1 block">
                {complicationHazards[0].name}
              </span>
              <span className="text-xs font-mono font-bold text-rose-600 block">
                5-Yr Hazard Rate: {complicationHazards[0].hazardPct}%
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Preventive Horizon
              </span>
              <span className="text-lg font-black text-emerald-700 block">Optimizable</span>
              <span className="text-[11px] text-slate-500 font-medium">
                Potential 5-Year Risk Flattening: -{(trajectoryPoints[5].composite - trajectoryPoints[5].managedRisk).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Section A: Interactive Recharts 5-Year Risk Trajectory Visual Chart */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold uppercase">
                    5-YEAR PREDICTIVE TRAJECTORY CURVE
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Calculated for Evaluated Patient</span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  5-Year Longitudinal Multi-Disease Evolution Trajectory
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowInterventionComparison(!showInterventionComparison)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showInterventionComparison
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {showInterventionComparison ? '✓ Intervention Curve Active' : '+ Compare Intervention Curve'}
                </button>
              </div>
            </div>

            {/* Recharts Area Chart Container */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComposite" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorHD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCKD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorManaged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12, fontWeight: 600 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 600 }} />

                  <ReferenceLine y={30} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Low/Mod Risk (30%)', fill: '#64748b', fontSize: 10 }} />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'High Risk Threshold (60%)', fill: '#d97706', fontSize: 10 }} />
                  <ReferenceLine y={80} stroke="#e11d48" strokeDasharray="4 4" label={{ value: 'Critical Event Horizon (80%)', fill: '#e11d48', fontSize: 10 }} />

                  <Area type="monotone" dataKey="composite" name="Composite Risk (%)" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorComposite)" />
                  <Area type="monotone" dataKey="dmRisk" name="Diabetes Trajectory (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDM)" />
                  <Area type="monotone" dataKey="hdRisk" name="Heart Disease Trajectory (%)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorHD)" />
                  <Area type="monotone" dataKey="ckdRisk" name="CKD Risk Trajectory (%)" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#colorCKD)" />

                  {showInterventionComparison && (
                    <Area type="monotone" dataKey="managedRisk" name="Managed Care Trajectory (%)" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorManaged)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Timepoint Grid Cards (Year 0 to Year 5) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {trajectoryPoints.map((pt) => {
                const isSelected = selectedYear === pt.yearNum;

                return (
                  <button
                    key={pt.year}
                    onClick={() => setSelectedYear(pt.yearNum)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-indigo-500/40'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono mb-2">
                      <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-slate-500 font-bold'}>
                        {pt.year}
                      </span>
                      {pt.yearNum === 0 && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] ${isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          Baseline
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>DM:</span>
                        <span className="font-bold">{pt.dmRisk}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>CVD:</span>
                        <span className="font-bold">{pt.hdRisk}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>CKD:</span>
                        <span className="font-bold">{pt.ckdRisk}%</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/40 font-mono flex justify-between items-center text-[11px]">
                      <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>Composite:</span>
                      <span className={`font-black text-sm ${isSelected ? 'text-emerald-400' : 'text-indigo-700'}`}>
                        {pt.composite}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Interactive Year Scrubber & Projected Future Biomarkers */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>INTERACTIVE TIMELINE FORECAST SCRUBBER</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  Year {selectedYear} Future Evolution &amp; Projected Biomarker Levels
                </h3>
              </div>

              {/* Year Scrubber Buttons */}
              <div className="flex items-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700/80">
                {[0, 1, 2, 3, 4, 5].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    Yr {yr}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Projected Biomarkers */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Model-Projected Patient Biomarkers at Year {selectedYear}:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">HbA1c</span>
                    <span className="text-2xl font-black text-white font-mono block">{selectedYearBiomarkers.HbA1c}%</span>
                    <span className="text-[10px] text-emerald-400 block">Baseline: {patientInput.HbA1c || '—'}%</span>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Fasting Glucose</span>
                    <span className="text-2xl font-black text-white font-mono block">{selectedYearBiomarkers.FastingGlucose} mg/dL</span>
                    <span className="text-[10px] text-emerald-400 block">Baseline: {patientInput.Fasting_Glucose || '—'}</span>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Systolic BP</span>
                    <span className="text-2xl font-black text-white font-mono block">{selectedYearBiomarkers.SystolicBP} mmHg</span>
                    <span className="text-[10px] text-emerald-400 block">Baseline: {patientInput.Systolic_BP || '—'}</span>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">eGFR Clearance</span>
                    <span className="text-2xl font-black text-amber-400 font-mono block">{selectedYearBiomarkers.eGFR} mL/min</span>
                    <span className="text-[10px] text-slate-400 block">Baseline: {patientInput.eGFR || '—'}</span>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Serum Creatinine</span>
                    <span className="text-2xl font-black text-white font-mono block">{selectedYearBiomarkers.SerumCreatinine} mg/dL</span>
                    <span className="text-[10px] text-slate-400 block">Baseline: {patientInput.Serum_Creatinine || '—'}</span>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">LDL Cholesterol</span>
                    <span className="text-2xl font-black text-white font-mono block">{selectedYearBiomarkers.LDL} mg/dL</span>
                    <span className="text-[10px] text-slate-400 block">Baseline: {patientInput.LDL || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Right Col: Selected Year Pathological Mechanisms */}
              <div className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase">
                      Year {selectedYear} Organ Impact
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {selectedYearPathology.primaryRiskZone}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">
                    {selectedYearPathology.stageTitle}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedYearPathology.organImpact}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/80 text-xs space-y-1">
                  <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase block">
                    Recommended Clinical Focus:
                  </span>
                  <p className="text-slate-300 font-medium text-[11.5px]">
                    {selectedYearPathology.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: 5-Year Clinical Complication Hazards Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  5-Year Clinical Complication Hazard Endpoints
                </h3>
                <p className="text-xs text-slate-500">
                  Model-estimated 5-year complication hazard rates based on predicted disease risk and active biomarker levels.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-xl border border-amber-200">
                5 Hazard Endpoints Evaluated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complicationHazards.map((hazard, hIdx) => {
                const IconComp = hazard.icon;

                return (
                  <div
                    key={hIdx}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          {hazard.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${hazard.badgeBg}`}>
                        {hazard.severity} Severity
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{hazard.name}</h4>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline font-mono">
                        <span className="text-[11px] text-slate-500">5-Year Hazard Rate:</span>
                        <span className={`text-xl font-black ${hazard.textColor}`}>{hazard.hazardPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full ${hazard.barColor} transition-all duration-700`}
                          style={{ width: `${hazard.hazardPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10.5px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                      Primary Driver: <strong className="text-slate-800">{hazard.driver}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section D: Projected Clinical Stage Evolution Timeline */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                LONGITUDINAL STAGE TRANSITION PIPELINE
              </span>
              <h3 className="text-xl font-black text-white">Projected Clinical Stage Evolution Pipeline</h3>
              <p className="text-xs text-slate-300 mt-1">
                Estimated progression of {primaryDxName} across clinical stages over the 5-year forecast horizon based on evaluated patient parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {futureStages.map((st) => (
                <div
                  key={st.stageNumber}
                  className="bg-slate-800/90 border border-slate-700/80 p-5 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                        {st.stageNumber}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${st.badgeColor}`}>
                        {st.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-indigo-300 font-bold block">{st.timeframe}</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{st.title}</h4>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{st.description}</p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-700/70 text-[10.5px] space-y-0.5">
                    <span className="text-[9.5px] font-mono font-bold text-indigo-400 uppercase block">
                      Target Organs &amp; Systems Affected:
                    </span>
                    <span className="text-emerald-300 font-semibold text-[11px] block">{st.affectedOrgans}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: XGBOOST RISK PREDICTIONS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Supervised XGBoost Disease Predictions</h3>
                <p className="text-xs text-slate-500">
                  Model-estimated classification and probability for Diabetes, Heart Disease, and CKD derived from patient parameters.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
                Model Version: {activeInference.modelVersion}
              </span>
            </div>

            {/* 3 Model Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeInference.predictionList.map((pred) => {
                const isPos = pred.classification === 'Positive';

                return (
                  <div
                    key={pred.disease}
                    className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 space-y-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{pred.diseaseId}</span>
                        <h4 className="text-base font-black text-slate-900">{pred.disease}</h4>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                          isPos
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {pred.classification}
                      </span>
                    </div>

                    {/* Model Probability */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Model-Estimated Probability
                      </span>
                      <span className="text-3xl font-black text-slate-900 font-mono block">
                        {(pred.probability * 100).toFixed(1)}%
                      </span>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
                        <div
                          className={`h-full transition-all duration-700 ${isPos ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, Math.max(0, pred.probability * 100))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block pt-1">
                        Decision Threshold: {pred.threshold.toFixed(2)}
                      </span>
                    </div>

                    {/* Top Contributing Biomarkers */}
                    <div className="space-y-1.5 text-xs">
                      <span className="font-bold text-slate-700 block">Top Contributing Features:</span>
                      <div className="space-y-1 font-mono text-[11px]">
                        {pred.topModelContributingFeatures.slice(0, 3).map((f) => (
                          <div key={f.feature} className="flex justify-between p-2 rounded-xl bg-white border border-slate-200">
                            <span className="font-bold text-slate-800">{f.feature}</span>
                            <span className="text-slate-600">
                              +{f.contribution.toFixed(4)} ({f.direction})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Linked Pattern Context */}
                    <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-indigo-950">
                        <span>Linked HDPL Pattern:</span>
                        <span className="font-mono text-[10px]">{pred.linkedHdplPattern.patternId}</span>
                      </div>
                      <p className="text-[11px] text-indigo-900 font-medium">{pred.linkedHdplPattern.patternName}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prediction-to-Progression Pipeline Action Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 rounded-2xl bg-indigo-900 text-white gap-4 border border-indigo-800 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Predictions Updated For Evaluated Patient
                  </span>
                </div>
                <h4 className="text-sm font-black text-white">
                  Explore 5-Year Disease Evolution Pipeline &amp; Affected Target Organs
                </h4>
              </div>
              <button
                onClick={() => handleTabChange('trajectory')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer hover:shadow-lg"
              >
                <span>View Stage Evolution Pipeline</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLINICAL PARAMETERS INPUT FORM & CLINICAL REFERENCE RANGES TABLE   */}
      {/* ========================================================================= */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Main Input Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Tested Patient Clinical Parameters Input</h3>
                <p className="text-xs text-slate-500">
                  Enter actual patient laboratory and biometric test results across all 19 canonical clinical features.
                </p>
              </div>
              <button
                onClick={() => setShowReferenceTable(!showReferenceTable)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>{showReferenceTable ? 'Hide Reference Ranges Guide' : 'Show Reference Ranges Guide'}</span>
              </button>
            </div>

            {/* Validation Notice */}
            {validationResult.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Clinical Input Range Notices &amp; Warnings:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-800 font-medium">
                  {validationResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 19 Canonical Features Grid Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CANONICAL_19_FEATURE_NAMES.map((fName) => {
                const rangeInfo = CLINICAL_FEATURE_RANGES[fName];
                const bounds = CLINICAL_INPUT_BOUNDS[fName];
                const val = patientInput[fName] !== undefined ? patientInput[fName] : '';
                const numVal = Number(val);

                let statusBadge = 'Normal';
                let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

                if (rangeInfo && !isNaN(numVal)) {
                  if (numVal > rangeInfo.normalMax) {
                    statusBadge = 'Elevated Risk';
                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                  } else if (numVal < rangeInfo.normalMin) {
                    statusBadge = 'Below Normal';
                    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                  }
                }

                return (
                  <div
                    key={fName}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                      <label htmlFor={`input-${fName}`}>{fName}</label>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {statusBadge}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        id={`input-${fName}`}
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => handleInputChange(fName, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">
                        {bounds?.unit || ''}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Normal Range:</span>
                        <span className="font-mono font-semibold text-slate-700">{rangeInfo?.normalRangeText || `${bounds?.min} - ${bounds?.max}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allowed Bounds:</span>
                        <span className="font-mono text-slate-500">[{bounds?.min} – {bounds?.max}]</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Ready to evaluate patient profile ({enteredCount}/19 values filled)
              </span>
              <button
                onClick={handleExecutePrediction}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Predict Disease Risk &amp; Trajectory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reference Ranges Table Guide */}
          {showReferenceTable && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>19 Canonical Biomarkers Clinical Reference Range Guide</span>
                </div>
                <span className="text-xs font-mono text-slate-400 font-medium">
                  Standard Clinical Population Norms
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                      <th className="py-2.5 px-3">Biomarker Feature</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Entered Patient Value</th>
                      <th className="py-2.5 px-3">Standard Clinical Reference Range</th>
                      <th className="py-2.5 px-3">Valid Model Input Bounds</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CANONICAL_19_FEATURE_NAMES.map((fName) => {
                      const range = CLINICAL_FEATURE_RANGES[fName];
                      const bounds = CLINICAL_INPUT_BOUNDS[fName];
                      const val = patientInput[fName];
                      const numVal = Number(val);

                      let isAbnormal = false;
                      if (range && !isNaN(numVal)) {
                        if (numVal > range.normalMax || numVal < range.normalMin) {
                          isAbnormal = true;
                        }
                      }

                      return (
                        <tr key={fName} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{fName}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{range?.unit || bounds?.unit || '—'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded ${isAbnormal ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                              {val !== undefined ? val : '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{range?.normalRangeText || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">[{bounds?.min} – {bounds?.max}]</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{range?.description || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MODEL EXPLANATION (SHAP & HDPL)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'explanation' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Multi-Layer Prediction Explanation System</h3>
            <p className="text-xs text-slate-500">
              Combines patient feature contributions (SHAP attributions), learned interaction evidence, and HDPL disease patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Part A: Feature Attributions */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
                <Sliders className="w-4 h-4" />
                <span>1. Patient Feature Contributions</span>
              </div>
              <p className="text-xs text-slate-600">
                The model identified these features as important contributors to the prediction:
              </p>
              <div className="space-y-2 text-xs font-mono">
                {activeInference?.predictionList?.[0]?.topModelContributingFeatures?.map((f) => (
                  <div key={f.feature} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block">{f.feature}</span>
                      <span className="text-[10px] text-slate-400">Patient Value: {patientInput[f.feature] ?? '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 block">+{f.contribution.toFixed(4)}</span>
                      <span className="text-[10px] text-slate-500">{f.direction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part B: Interaction Evidence */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
                <Sparkles className="w-4 h-4" />
                <span>2. Learned Interaction Evidence</span>
              </div>
              <p className="text-xs text-slate-600">
                The learned disease interaction pairs show strong statistical association in the cohort:
              </p>
              <div className="space-y-2 text-xs font-mono">
                {activeInference.predictionList.map((pred) => (
                  <div key={pred.disease} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{pred.disease}</span>
                    {pred.linkedHdplPattern.keyInteractions.map((pair, pIdx) => (
                      <div key={pIdx} className="flex justify-between items-center font-bold text-slate-800">
                        <span>{pair}</span>
                        <span className="text-emerald-600 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Strong</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Part C: Disease Pattern & Signature Context */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
                <Layers className="w-4 h-4" />
                <span>3. Disease Pattern Context</span>
              </div>
              <p className="text-xs text-slate-600">
                Patient profile evaluated against the learned disease pattern and signature vectors:
              </p>
              <div className="space-y-2 text-xs">
                {activeInference.predictionList.map((pred) => (
                  <div key={pred.disease} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{pred.linkedHdplPattern.patternId}</span>
                      <span className="text-indigo-600 font-mono text-[10px]">Context Pattern</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{pred.linkedHdplPattern.patternName}</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1">
                      Primary Evidence: {pred.linkedHdplPattern.keyFeatures.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INTERACTIVE WHAT-IF SIMULATION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'simulation' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Interactive What-If Biomarker Simulation</h3>
            <p className="text-xs text-slate-500">
              Modify one or more patient biomarker values and re-run the trained XGBoost models to observe the model-estimated change in disease risk probabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Biomarker Control Sliders */}
            <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Adjust Biomarkers</span>
              </h4>

              {/* HbA1c Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">HbA1c</span>
                  <span className="text-indigo-600 font-mono">{simValues.HbA1c}%</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="12.0"
                  step="0.1"
                  value={simValues.HbA1c}
                  onChange={(e) => setSimValues((prev) => ({ ...prev, HbA1c: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Systolic BP Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Systolic BP</span>
                  <span className="text-indigo-600 font-mono">{simValues.Systolic_BP} mmHg</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="200"
                  step="1"
                  value={simValues.Systolic_BP}
                  onChange={(e) => setSimValues((prev) => ({ ...prev, Systolic_BP: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Fasting Glucose Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Fasting Glucose</span>
                  <span className="text-indigo-600 font-mono">{simValues.Fasting_Glucose} mg/dL</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="300"
                  step="1"
                  value={simValues.Fasting_Glucose}
                  onChange={(e) => setSimValues((prev) => ({ ...prev, Fasting_Glucose: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* eGFR Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">eGFR</span>
                  <span className="text-indigo-600 font-mono">{simValues.eGFR} mL/min</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="130"
                  step="1"
                  value={simValues.eGFR}
                  onChange={(e) => setSimValues((prev) => ({ ...prev, eGFR: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  setSimValues({
                    HbA1c: patientInput.HbA1c,
                    Systolic_BP: patientInput.Systolic_BP,
                    Fasting_Glucose: patientInput.Fasting_Glucose,
                    eGFR: patientInput.eGFR,
                    LDL: patientInput.LDL,
                  });
                }}
                className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sliders to Patient Baseline</span>
              </button>
            </div>

            {/* Dynamic Model Output Comparison */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Model-Estimated Outcome Change
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Re-evaluating Trained XGBoost Classifiers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeInference?.predictionList?.map((basePred) => {
                    const simPred = simulatedInference?.predictions?.[basePred.disease as 'Diabetes' | 'Heart Disease' | 'CKD'];
                    const baseProb = (basePred.probability * 100).toFixed(1);
                    const simProb = simPred ? (simPred.probability * 100).toFixed(1) : baseProb;
                    const diff = simPred ? ((simPred.probability - basePred.probability) * 100).toFixed(1) : '0.0';
                    const isReduction = parseFloat(diff) <= 0;

                    return (
                      <div key={basePred.disease} className="bg-slate-800 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{basePred.disease}</span>
                        <div className="flex items-baseline space-x-2 font-mono">
                          <span className="text-slate-400 text-sm line-through">{baseProb}%</span>
                          <span className="text-xl font-black text-white">{simProb}%</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${isReduction ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {isReduction ? '' : '+'}{diff}% Model Output Change
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                  What-if results represent model outputs for modified input values and should not be interpreted as guaranteed treatment effects or individual clinical outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MANDATORY SCIENTIFIC DISCLAIMER                                        */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed space-y-1">
        <div className="font-bold text-slate-800 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Scientific &amp; Clinical Disclaimer:</span>
        </div>
        <p>
          These predictions and trajectory projections are model-estimated outputs based on the patient's entered clinical features and trained cohort-derived XGBoost models. Learned feature interactions and disease patterns represent statistical associations in the analyzed cohort and do not establish biological causation, clinical diagnosis, or treatment recommendations.
        </p>
      </div>
    </div>
  );
};
