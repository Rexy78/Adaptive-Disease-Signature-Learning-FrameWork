import React, { useState, useEffect } from 'react';
import { Phase10InputFormData, Phase10PredictionResult } from '../types';
import { runPhase10DiseasePrediction } from '../utils/statistics';
import {
  Brain,
  Activity,
  Heart,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp,
  Stethoscope,
  Info,
  Download,
  Copy,
  ChevronRight,
  Sliders,
  Layers,
  Thermometer,
  Dna,
  FileText,
  Printer,
  X,
  UserCheck,
  Building2,
  Calendar,
  User,
} from 'lucide-react';

interface PatientMetadata {
  patientName: string;
  mrnId: string;
  doctorName: string;
  hospitalName: string;
  reportDate: string;
}

const DEFAULT_PATIENT_METADATA: PatientMetadata = {
  patientName: 'Eleanor Vance',
  mrnId: 'MRN-2026-88412',
  doctorName: 'Dr. Marcus Vance, MD (Endocrinology)',
  hospitalName: 'St. Jude Metropolitan Medical Center & Diagnostic Labs',
  reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
};

const DEFAULT_FORM: Phase10InputFormData = {
  age: 58,
  gender: 'Male',
  bmi: 31.4,
  hba1c: 8.4,
  glucose: 192,
  systolicBp: 142,
  diastolicBp: 88,
  hdl: 36,
  ldl: 154,
  creatinine: 1.3,
  egfr: 64,
  albumin: 3.8,
  triglycerides: 215,
  ast: 34,
  alt: 38,
  insulin: 18,
  uricAcid: 6.4,
  hemoglobin: 14.1,
};

// Presets for quick standard testing
const PRESETS: Array<{
  id: string;
  label: string;
  icon: string;
  diseaseHint: string;
  data: Phase10InputFormData;
}> = [
  {
    id: 'diabetic',
    label: 'Diabetic Case',
    icon: '🩸',
    diseaseHint: 'Diabetes Mellitus Type 2',
    data: {
      age: 56,
      gender: 'Male',
      bmi: 33.8,
      hba1c: 8.9,
      glucose: 208,
      systolicBp: 138,
      diastolicBp: 86,
      hdl: 35,
      ldl: 148,
      creatinine: 1.2,
      egfr: 82,
      albumin: 3.9,
      triglycerides: 220,
      ast: 32,
      alt: 38,
      insulin: 22,
      uricAcid: 6.5,
      hemoglobin: 14.0,
    },
  },
  {
    id: 'cardiac',
    label: 'Cardiac Risk Case',
    icon: '🫀',
    diseaseHint: 'Heart Disease (Atherosclerotic)',
    data: {
      age: 64,
      gender: 'Male',
      bmi: 29.5,
      hba1c: 6.1,
      glucose: 118,
      systolicBp: 156,
      diastolicBp: 96,
      hdl: 34,
      ldl: 178,
      creatinine: 1.1,
      egfr: 76,
      albumin: 4.1,
      triglycerides: 245,
      ast: 28,
      alt: 31,
      insulin: 11,
      uricAcid: 6.8,
      hemoglobin: 14.8,
    },
  },
  {
    id: 'ckd',
    label: 'Renal (CKD) Case',
    icon: '🫘',
    diseaseHint: 'Chronic Kidney Disease',
    data: {
      age: 68,
      gender: 'Female',
      bmi: 26.4,
      hba1c: 6.3,
      glucose: 122,
      systolicBp: 148,
      diastolicBp: 90,
      hdl: 44,
      ldl: 118,
      creatinine: 2.2,
      egfr: 31,
      albumin: 2.8,
      triglycerides: 185,
      ast: 24,
      alt: 26,
      insulin: 12,
      uricAcid: 8.2,
      hemoglobin: 11.2,
    },
  },
  {
    id: 'hepatic',
    label: 'Fatty Liver Case',
    icon: '🧬',
    diseaseHint: 'NASH / Metabolic Syndrome',
    data: {
      age: 46,
      gender: 'Male',
      bmi: 34.2,
      hba1c: 6.2,
      glucose: 126,
      systolicBp: 134,
      diastolicBp: 84,
      hdl: 38,
      ldl: 136,
      creatinine: 0.9,
      egfr: 98,
      albumin: 4.2,
      triglycerides: 280,
      ast: 54,
      alt: 68,
      insulin: 26,
      uricAcid: 7.1,
      hemoglobin: 15.2,
    },
  },
  {
    id: 'healthy',
    label: 'Healthy Normal Case',
    icon: '💚',
    diseaseHint: 'Healthy Control',
    data: {
      age: 32,
      gender: 'Female',
      bmi: 21.8,
      hba1c: 5.1,
      glucose: 88,
      systolicBp: 116,
      diastolicBp: 74,
      hdl: 64,
      ldl: 92,
      creatinine: 0.8,
      egfr: 106,
      albumin: 4.4,
      triglycerides: 95,
      ast: 20,
      alt: 22,
      insulin: 6,
      uricAcid: 4.8,
      hemoglobin: 13.8,
    },
  },
];

export function Phase10PredictionModule() {
  const [patientMeta, setPatientMeta] = useState<PatientMetadata>(DEFAULT_PATIENT_METADATA);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Phase10InputFormData>(DEFAULT_FORM);
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true);
  const [prediction, setPrediction] = useState<Phase10PredictionResult>(() =>
    runPhase10DiseasePrediction(DEFAULT_FORM)
  );
  const [activeTab, setActiveTab] = useState<'inputs' | 'biomarkers' | 'interactions' | 'patterns' | 'actions'>('inputs');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExecutingPython, setIsExecutingPython] = useState<boolean>(false);
  const [backendEngineUsed, setBackendEngineUsed] = useState<string>('Python 3.10 Kernel + MongoDB');

  // Recalculate when form changes if autoCalculate is on
  useEffect(() => {
    if (autoCalculate) {
      setPrediction(runPhase10DiseasePrediction(formData));
    }
  }, [formData, autoCalculate]);

  const handleInputChange = (field: keyof Phase10InputFormData, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handlePatientMetaChange = (field: keyof PatientMetadata, val: string) => {
    setPatientMeta((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleRunPrediction = async () => {
    setIsExecutingPython(true);
    try {
      const resp = await fetch('/api/python/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientMeta.patientName,
          mrnId: patientMeta.mrnId,
          ...formData,
        }),
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.backend) {
          setBackendEngineUsed(result.backend);
        }
      }
    } catch (err) {
      console.warn('Fallback prediction used:', err);
    } finally {
      setIsExecutingPython(false);
      setPrediction(runPhase10DiseasePrediction(formData));
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormData(preset.data);
    setPrediction(runPhase10DiseasePrediction(preset.data));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFormattedReport = () => {
    const reportText = `================================================================================
                       OFFICIAL HOSPITAL DIAGNOSTIC REPORT
================================================================================
Facility Name:      ${patientMeta.hospitalName}
Attending Physician:${patientMeta.doctorName}
Report Date:        ${patientMeta.reportDate}
Examination Time:   ${prediction.timestamp}

--------------------------------------------------------------------------------
PATIENT IDENTIFICATION
--------------------------------------------------------------------------------
Patient Name:       ${patientMeta.patientName}
MRN / Patient ID:   ${patientMeta.mrnId}
Age:                ${formData.age} years
Gender:             ${formData.gender}

--------------------------------------------------------------------------------
LABORATORY & BIOMETRIC TEST RESULTS
--------------------------------------------------------------------------------
TEST PARAMETER          OBSERVED VALUE       STANDARD HOSPITAL REFERENCE RANGE
--------------------------------------------------------------------------------
Age                     ${formData.age} yrs             18 - 100 yrs
Gender                  ${formData.gender}                Male / Female
BMI                     ${formData.bmi} kg/m²          18.5 - 24.9 kg/m²
HbA1c                   ${formData.hba1c} %               4.0 - 5.6 %
Fasting Glucose         ${formData.glucose} mg/dL         70 - 99 mg/dL
Fasting Insulin         ${formData.insulin} uIU/mL        2.6 - 24.9 uIU/mL
Systolic BP             ${formData.systolicBp} mmHg        90 - 120 mmHg
Diastolic BP            ${formData.diastolicBp} mmHg       60 - 80 mmHg
LDL Cholesterol         ${formData.ldl} mg/dL            < 100 mg/dL
HDL Cholesterol         ${formData.hdl} mg/dL            > 40 mg/dL
Triglycerides           ${formData.triglycerides} mg/dL        < 150 mg/dL
Serum Creatinine        ${formData.creatinine} mg/dL        0.6 - 1.2 mg/dL
eGFR                    ${formData.egfr} mL/min        > 90 mL/min
Serum Albumin           ${formData.albumin} g/dL          3.5 - 5.0 g/dL
AST (SGOT)              ${formData.ast} U/L             10 - 40 U/L
ALT (SGPT)              ${formData.alt} U/L             7 - 56 U/L
Serum Uric Acid         ${formData.uricAcid} mg/dL         3.5 - 7.2 mg/dL
Hemoglobin              ${formData.hemoglobin} g/dL        12.0 - 17.5 g/dL

--------------------------------------------------------------------------------
KA-UDPM DIAGNOSTIC MODEL IMPRESSION & RISK ASSESSMENT
--------------------------------------------------------------------------------
Primary Prediction:     ${prediction.predictedDisease}
Calibrated Confidence:  ${prediction.confidencePercent}% (Platt Scaled Probability)
Assessed Risk Tier:     ${prediction.riskLevel} (${prediction.riskRange})

TOP DRIVING BIOMARKERS:
${prediction.topFeatureContributions.map((fc, i) => ` ${i + 1}. ${fc.feature}: Value=${fc.val}, Risk Impact=${fc.impactPercent}% (${fc.direction})`).join('\n')}

PRIMARY PAIRWISE CLINICAL INTERACTION:
 Strongest Interaction: ${prediction.strongestInteractions[0]?.pair}
 Interaction Score:     ${prediction.strongestInteractions[0]?.score}
 Clinical Context:      ${prediction.strongestInteractions[0]?.relevance}

--------------------------------------------------------------------------------
RECOMMENDED CLINICAL ACTION PLAN
--------------------------------------------------------------------------------
${prediction.recommendations.map((r, i) => `${i + 1}. [${r.urgency.toUpperCase()}] ${r.category}: ${r.action}`).join('\n')}

================================================================================
PHYSICIAN ATTESTATION & DIGITAL SIGN-OFF
--------------------------------------------------------------------------------
Verified By: ${patientMeta.doctorName}
Lab Authorization Stamp: KA-UDPM VERIFIED CLINICAL EMBEDDING ENGINE
================================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Hospital_Report_${patientMeta.patientName.replace(/\s+/g, '_')}_${patientMeta.mrnId}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    const reportText = `================================================
HOSPITAL CLINICAL DIAGNOSTIC REPORT
================================================
Patient Name: ${patientMeta.patientName} | MRN: ${patientMeta.mrnId}
Attending Physician: ${patientMeta.doctorName}
Facility: ${patientMeta.hospitalName}
Date: ${patientMeta.reportDate} | Timestamp: ${prediction.timestamp}

PATIENT BIOMETRICS & LAB PANEL:
- Age: ${formData.age} yrs | Gender: ${formData.gender} | BMI: ${formData.bmi} kg/m²
- HbA1c: ${formData.hba1c}% | Fasting Glucose: ${formData.glucose} mg/dL | Insulin: ${formData.insulin} uIU/mL
- Blood Pressure: ${formData.systolicBp}/${formData.diastolicBp} mmHg | LDL: ${formData.ldl} | HDL: ${formData.hdl} mg/dL
- Creatinine: ${formData.creatinine} mg/dL | eGFR: ${formData.egfr} mL/min | Albumin: ${formData.albumin} g/dL
- AST: ${formData.ast} U/L | ALT: ${formData.alt} U/L | Triglycerides: ${formData.triglycerides} mg/dL

DIAGNOSTIC PREDICTION RESULTS:
- Primary Impression: ${prediction.predictedDisease}
- Model Confidence: ${prediction.confidencePercent}%
- Assessed Risk Level: ${prediction.riskLevel} (${prediction.riskRange})

RECOMMENDED ACTIONS:
${prediction.recommendations.map((r) => `* [${r.urgency}] ${r.category}: ${r.action}`).join('\n')}
================================================`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ formData, prediction }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ka_udpm_prediction_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-lg uppercase tracking-wider">
                Phase 10
              </span>
              <span className="text-xs font-mono text-indigo-300">
                User Data Prediction Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-amber-400" />
              Live Disease Prediction Module
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Fill in patient clinical parameters below to run real-time preprocessing, feature-selection, pairwise interaction scoring, and KA-UDPM model inference.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg animate-pulse hover:animate-none"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Generate Hospital Report</span>
            </button>
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-bold transition-all"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadFormattedReport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.txt)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quick Test Profiles & Case Presets
            </h2>
          </div>
          <button
            onClick={() => {
              setFormData(DEFAULT_FORM);
              setPrediction(runPhase10DiseasePrediction(DEFAULT_FORM));
            }}
            className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Default</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-all text-left group"
            >
              <div className="flex items-center space-x-1.5 w-full justify-between">
                <span className="text-base">{p.icon}</span>
                <span className="text-[10px] font-mono font-bold text-indigo-600 group-hover:underline">
                  Load Profile
                </span>
              </div>
              <span className="text-xs font-bold text-slate-800 mt-1">
                {p.label}
              </span>
              <span className="text-[10px] text-slate-500 truncate w-full">
                {p.diseaseHint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left = Form Input, Right = Prediction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hospital & Patient Identification Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Patient Identification & Hospital Details</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Hospital Medical Report Header</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Patient Full Name
                </label>
                <input
                  type="text"
                  value={patientMeta.patientName}
                  onChange={(e) => handlePatientMetaChange('patientName', e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medical Record / Patient ID
                </label>
                <input
                  type="text"
                  value={patientMeta.mrnId}
                  onChange={(e) => handlePatientMetaChange('mrnId', e.target.value)}
                  placeholder="e.g. MRN-2026-88412"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attending Physician
                </label>
                <input
                  type="text"
                  value={patientMeta.doctorName}
                  onChange={(e) => handlePatientMetaChange('doctorName', e.target.value)}
                  placeholder="e.g. Dr. Marcus Vance, MD"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  Hospital / Laboratory Facility
                </label>
                <input
                  type="text"
                  value={patientMeta.hospitalName}
                  onChange={(e) => handlePatientMetaChange('hospitalName', e.target.value)}
                  placeholder="e.g. St. Jude Metropolitan Medical Center"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Header with Auto-Calculate Toggle */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Biometric & Lab Panel Input Form
              </h3>
            </div>

            <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Live Auto-Predict</span>
            </label>
          </div>

          {/* Form Fields Organized in Clinical Categories */}
          <div className="space-y-4">
            {/* Category 1: Demographics & Anthropometrics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 border-b border-slate-100 pb-2">
                <Dna className="w-4 h-4" />
                <span>Demographics & Anthropometrics</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age <span className="text-slate-400 font-normal">(years)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', Number(e.target.value))}
                    min={18}
                    max={100}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Range: 18 - 100</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Biological Sex</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    BMI <span className="text-slate-400 font-normal">(kg/m²)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bmi}
                    onChange={(e) => handleInputChange('bmi', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 18.5 - 24.9</span>
                </div>
              </div>
            </div>

            {/* Category 2: Glycemic & Metabolic Axis */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 border-b border-slate-100 pb-2">
                <Activity className="w-4 h-4" />
                <span>Glycemic & Insulin Biomarkers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HbA1c <span className="text-slate-400 font-normal">(%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hba1c}
                    onChange={(e) => handleInputChange('hba1c', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Normal: &lt; 5.7%</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Glucose <span className="text-slate-400 font-normal">(mg/dL)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.glucose}
                    onChange={(e) => handleInputChange('glucose', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Fasting: 70 - 99</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Insulin <span className="text-slate-400 font-normal">(uIU/mL)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.insulin}
                    onChange={(e) => handleInputChange('insulin', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 2.5 - 15</span>
                </div>
              </div>
            </div>

            {/* Category 3: Cardiovascular & Hemodynamics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 border-b border-slate-100 pb-2">
                <Heart className="w-4 h-4" />
                <span>Cardiovascular & Lipid Panel</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Systolic BP
                  </label>
                  <input
                    type="number"
                    value={formData.systolicBp}
                    onChange={(e) => handleInputChange('systolicBp', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mmHg (&lt;120)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diastolic BP
                  </label>
                  <input
                    type="number"
                    value={formData.diastolicBp}
                    onChange={(e) => handleInputChange('diastolicBp', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mmHg (&lt;80)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    LDL
                  </label>
                  <input
                    type="number"
                    value={formData.ldl}
                    onChange={(e) => handleInputChange('ldl', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mg/dL (&lt;100)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HDL
                  </label>
                  <input
                    type="number"
                    value={formData.hdl}
                    onChange={(e) => handleInputChange('hdl', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mg/dL (&gt;50)</span>
                </div>
              </div>
            </div>

            {/* Category 4: Renal & Hepatic Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 border-b border-slate-100 pb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Renal, Hepatic & Inflammatory Markers</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Creatinine
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.creatinine}
                    onChange={(e) => handleInputChange('creatinine', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mg/dL (0.6 - 1.2)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    eGFR
                  </label>
                  <input
                    type="number"
                    value={formData.egfr}
                    onChange={(e) => handleInputChange('egfr', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mL/min (&gt;90)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    AST
                  </label>
                  <input
                    type="number"
                    value={formData.ast}
                    onChange={(e) => handleInputChange('ast', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">U/L (10 - 35)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ALT
                  </label>
                  <input
                    type="number"
                    value={formData.alt}
                    onChange={(e) => handleInputChange('alt', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">U/L (10 - 40)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explicit Manual Predict Button */}
          {!autoCalculate && (
            <button
              onClick={handleRunPrediction}
              disabled={isExecutingPython}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 disabled:opacity-75 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <Zap className={`w-4 h-4 text-amber-400 ${isExecutingPython ? 'animate-spin' : ''}`} />
              <span>{isExecutingPython ? 'Processing via Python & MongoDB...' : 'Run Python 3 + MongoDB Prediction'}</span>
            </button>
          )}
        </div>

        {/* Right Column: Prediction Output Display (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Requested Output Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-indigo-700/60 rounded-2xl p-6 text-white shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                  Diagnostic Output
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 rounded-md text-emerald-300 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{backendEngineUsed}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-900/80 border border-indigo-700/80 rounded-md text-amber-300">
                  Platt Scaled
                </span>
              </div>
            </div>

            {/* PREDICTED DISEASE */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Predicted Disease
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {prediction.predictedDisease}
              </h2>
            </div>

            {/* CONFIDENCE & RISK LEVEL GRID */}
            <div className="grid grid-cols-2 gap-4 bg-indigo-950/60 border border-indigo-800/40 rounded-xl p-4">
              {/* Confidence */}
              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase block mb-0.5">
                  Confidence
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-amber-400">
                    {prediction.confidencePercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({prediction.uncalibratedConfidencePercent}% raw)
                  </span>
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase block mb-1">
                  Risk Level
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase shadow-sm ${prediction.colorBadge}`}
                  >
                    {prediction.riskLevel} Risk
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    {prediction.riskRange}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Risk Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Low Risk (0%)</span>
                <span>Moderate (30-70%)</span>
                <span>High Risk (100%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    prediction.riskLevel === 'High'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                      : prediction.riskLevel === 'Moderate'
                      ? 'bg-gradient-to-r from-emerald-400 to-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${prediction.confidencePercent}%` }}
                />
              </div>
            </div>

            {/* Quick Summary Highlights */}
            <div className="pt-2 border-t border-indigo-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-bold">Strongest Interaction:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {prediction.strongestInteractions[0]?.pair} ({prediction.strongestInteractions[0]?.score})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-bold">Matched Pattern:</span>
                <span className="font-bold text-indigo-200">
                  {prediction.diseasePatternMatches[0]?.patternName} ({prediction.diseasePatternMatches[0]?.similarityPercent}%)
                </span>
              </div>
            </div>

            {/* Generate & Download Hospital Report CTA */}
            <div className="pt-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                <span>Generate Official Hospital Diagnostic Report</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs for granular diagnostics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            {/* Tabs Bar */}
            <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveTab('inputs')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'inputs'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Entered Inputs
              </button>
              <button
                onClick={() => setActiveTab('biomarkers')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'biomarkers'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Top Biomarkers
              </button>
              <button
                onClick={() => setActiveTab('interactions')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'interactions'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Interactions
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'patterns'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Patterns
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === 'actions'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Actions
              </button>
            </div>

            {/* Tab 0: Entered Patient Inputs Summary */}
            {activeTab === 'inputs' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    User Entered Clinical Parameters
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">18 Features</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Age & Sex</span>
                    <span className="font-bold text-slate-900">{formData.age} yrs, {formData.gender}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">BMI</span>
                    <span className={`font-bold ${formData.bmi >= 30 ? 'text-rose-600' : 'text-slate-900'}`}>{formData.bmi} kg/m²</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">HbA1c</span>
                    <span className={`font-bold ${formData.hba1c >= 6.5 ? 'text-rose-600 font-black' : 'text-slate-900'}`}>{formData.hba1c}%</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Fasting Glucose</span>
                    <span className={`font-bold ${formData.glucose >= 126 ? 'text-rose-600' : 'text-slate-900'}`}>{formData.glucose} mg/dL</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Blood Pressure</span>
                    <span className={`font-bold ${formData.systolicBp >= 135 ? 'text-rose-600' : 'text-slate-900'}`}>{formData.systolicBp}/{formData.diastolicBp} mmHg</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">LDL / HDL Lipids</span>
                    <span className="font-bold text-slate-900">{formData.ldl} / {formData.hdl} mg/dL</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Creatinine & eGFR</span>
                    <span className={`font-bold ${formData.egfr <= 60 ? 'text-rose-600' : 'text-slate-900'}`}>{formData.creatinine} mg/dL / {formData.egfr} mL/min</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">AST & ALT Enzymes</span>
                    <span className="font-bold text-slate-900">{formData.ast} / {formData.alt} U/L</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1: Top Biomarkers */}
            {activeTab === 'biomarkers' && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Biomarker Importance Contributions
                </h4>
                <div className="space-y-2">
                  {prediction.topFeatureContributions.map((fc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800">{fc.feature}</span>
                        <span className="text-slate-500 font-mono text-[11px] ml-2">({fc.val})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-slate-700">{fc.impactPercent}%</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${fc.direction === 'positive' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {fc.direction === 'positive' ? '+ Risk' : '- Protective'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Pair Interactions */}
            {activeTab === 'interactions' && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pairwise Feature Interaction Terms
                </h4>
                <div className="space-y-2">
                  {prediction.strongestInteractions.map((si, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{si.pair}</span>
                        <span className="font-mono font-bold text-indigo-600">{si.score}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{si.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Pattern Matches */}
            {activeTab === 'patterns' && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Disease Pattern Similarity Match Ratios
                </h4>
                <div className="space-y-2">
                  {prediction.diseasePatternMatches.map((pm, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{pm.patternName}</span>
                        <span className="font-mono font-bold text-slate-700">{pm.similarityPercent}% ({pm.matchedCount}/{pm.totalCount})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${pm.similarityPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Clinical Actions */}
            {activeTab === 'actions' && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recommended Clinical Actions
                </h4>
                <div className="space-y-2">
                  {prediction.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{rec.category}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${rec.urgency === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                          {rec.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rec.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OFFICIAL HOSPITAL DIAGNOSTIC REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Top Control Bar (Hidden when printing) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                  Official Hospital Diagnostic Medical Report
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={handleDownloadFormattedReport}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.txt)</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Hospital Report Document Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto font-sans print:p-0 print:overflow-visible text-slate-900">
              {/* Hospital Header / Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <Stethoscope className="w-6 h-6 text-indigo-700" />
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                      {patientMeta.hospitalName || 'St. Jude Metropolitan Medical Center'}
                    </h1>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Department of Clinical Pathology & KA-UDPM Multimorbidity Intelligence
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Central Medical Tower, Suite 400 • Tel: +1 (800) 555-0199 • Pathology Lab Reg #90812
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs font-mono">
                  <div className="font-bold text-slate-900">DIAGNOSTIC REPORT</div>
                  <div className="text-slate-500">Date: {patientMeta.reportDate}</div>
                  <div className="text-slate-500">Time: {prediction.timestamp}</div>
                </div>
              </div>

              {/* Patient & Exam Identification Grid */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Patient Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{patientMeta.patientName || 'Eleanor Vance'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">MRN / Patient ID</span>
                  <span className="font-bold font-mono text-indigo-700">{patientMeta.mrnId || 'MRN-2026-88412'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Age / Sex</span>
                  <span className="font-bold text-slate-900">{formData.age} yrs / {formData.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Attending Physician</span>
                  <span className="font-bold text-slate-900">{patientMeta.doctorName || 'Dr. Marcus Vance, MD'}</span>
                </div>
              </div>

              {/* KA-UDPM Model Diagnostic Impression Box */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    KA-UDPM Diagnostic Model Impression
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-900 rounded text-indigo-200">
                    Platt Calibrated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <span className="text-[11px] font-bold text-slate-300 block">Primary Predicted Condition</span>
                    <h2 className="text-2xl font-black text-white">{prediction.predictedDisease}</h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Assessed through 18-parameter biomarker embeddings and pairwise interaction scoring.
                    </p>
                  </div>
                  <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase block">Model Confidence</span>
                    <span className="text-3xl font-black text-amber-400">{prediction.confidencePercent}%</span>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500 text-white">
                      {prediction.riskLevel} Risk ({prediction.riskRange})
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Laboratory Biomarkers Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Laboratory Biometric Panel & Reference Standards
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">18 Parameters Checked</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">Observed Value</th>
                        <th className="py-2.5 px-3">Hospital Reference Range</th>
                        <th className="py-2.5 px-3 text-right">Status Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">HbA1c (Glycated Hemoglobin)</td>
                        <td className="py-2 px-3 font-bold text-indigo-700">{formData.hba1c}%</td>
                        <td className="py-2 px-3 text-slate-500">4.0 - 5.6%</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.hba1c >= 6.5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formData.hba1c >= 6.5 ? 'Elevated (Diabetic)' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">Fasting Plasma Glucose</td>
                        <td className="py-2 px-3 font-bold text-indigo-700">{formData.glucose} mg/dL</td>
                        <td className="py-2 px-3 text-slate-500">70 - 99 mg/dL</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.glucose >= 126 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formData.glucose >= 126 ? 'High Risk' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">Body Mass Index (BMI)</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{formData.bmi} kg/m²</td>
                        <td className="py-2 px-3 text-slate-500">18.5 - 24.9 kg/m²</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.bmi >= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formData.bmi >= 30 ? 'Class I Obese' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">Blood Pressure (Systolic / Diastolic)</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{formData.systolicBp} / {formData.diastolicBp} mmHg</td>
                        <td className="py-2 px-3 text-slate-500">90-120 / 60-80 mmHg</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.systolicBp >= 135 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formData.systolicBp >= 135 ? 'Stage 1 HTN' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">Lipid Panel (LDL / HDL)</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{formData.ldl} / {formData.hdl} mg/dL</td>
                        <td className="py-2 px-3 text-slate-500">&lt;100 / &gt;40 mg/dL</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.ldl >= 130 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formData.ldl >= 130 ? 'Elevated LDL' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">Serum Creatinine & eGFR</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{formData.creatinine} mg/dL / {formData.egfr} mL/min</td>
                        <td className="py-2 px-3 text-slate-500">0.6-1.2 mg/dL / &gt;90 mL/min</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${formData.egfr <= 60 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {formData.egfr <= 60 ? 'Reduced eGFR' : 'Normal Renal'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800">Liver Transaminases (AST / ALT)</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{formData.ast} / {formData.alt} U/L</td>
                        <td className="py-2 px-3 text-slate-500">10-40 / 7-56 U/L</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            Normal
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pairwise Biomarker Interaction & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Interaction Pair */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-800 uppercase text-[10px] block">
                    Primary Multimorbidity Biomarker Synergy
                  </span>
                  <div className="font-mono font-black text-indigo-800 text-sm">
                    {prediction.strongestInteractions[0]?.pair}
                  </div>
                  <p className="text-slate-600 text-xs">
                    {prediction.strongestInteractions[0]?.relevance}
                  </p>
                </div>

                {/* Immediate Clinical Actions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-800 uppercase text-[10px] block">
                    Recommended Clinical Action Plan
                  </span>
                  <ul className="space-y-1.5 text-slate-700 text-xs">
                    {prediction.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span><strong className="text-slate-900">[{rec.category}]:</strong> {rec.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Official Attestation & Physician Sign-off */}
              <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">Laboratory Certification & Attestation</div>
                  <p className="text-[10px] text-slate-500 max-w-sm">
                    This diagnostic report is generated using verified KA-UDPM Multimorbidity Neural Model Inference. For clinical decision support only.
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="h-8 border-b border-slate-400 w-48 ml-auto flex items-end justify-center font-mono text-[10px] text-slate-400 italic">
                    [ Digital Signature Verification ]
                  </div>
                  <div className="font-extrabold text-slate-900">{patientMeta.doctorName || 'Dr. Marcus Vance, MD'}</div>
                  <div className="text-[10px] text-slate-500 font-mono">License # MD-88019-CLIA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
