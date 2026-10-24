import { RawRow } from '../types';
import { generateMasterDataset } from './defaultDataset';
import { generateNhanesDataset } from './nhanesData';

function seededRandom(seed: number) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// 1. Pima Indian Diabetes Cohort (768 records, 9 features)
export function generatePimaDiabetesDataset(): RawRow[] {
  const rows: RawRow[] = [];
  let seed = 101;
  const total = 768;

  for (let i = 0; i < total; i++) {
    const isDiabetic = seededRandom(seed++) > 0.65;
    const pregnancies = Math.floor(seededRandom(seed++) * (isDiabetic ? 12 : 7));
    const glucose = Math.round(isDiabetic ? 115 + seededRandom(seed++) * 85 : 75 + seededRandom(seed++) * 55);
    const bp = Math.round(55 + seededRandom(seed++) * 45);
    const skinThickness = Math.round(15 + seededRandom(seed++) * 35);
    const insulin = Math.round((isDiabetic ? 60 + seededRandom(seed++) * 240 : 15 + seededRandom(seed++) * 120) * 10) / 10;
    const bmi = Math.round(((isDiabetic ? 26 + seededRandom(seed++) * 20 : 20 + seededRandom(seed++) * 14)) * 10) / 10;
    const dpf = Math.round((0.15 + seededRandom(seed++) * (isDiabetic ? 1.5 : 0.8)) * 1000) / 1000;
    const age = Math.round(21 + seededRandom(seed++) * 55);

    rows.push({
      Patient_ID: `PIMA-${1000 + i + 1}`,
      Pregnancies: pregnancies,
      Glucose: seededRandom(seed++) < 0.03 ? null : glucose,
      Blood_Pressure: bp,
      Skin_Thickness: skinThickness,
      Insulin: seededRandom(seed++) < 0.05 ? null : insulin,
      BMI: seededRandom(seed++) < 0.03 ? null : bmi,
      Diabetes_Pedigree: dpf,
      Age: age,
      Gender: 'Female',
      Disease: isDiabetic ? 'Diabetes' : 'Healthy',
    });
  }

  return rows;
}

// 2. Framingham Cardiovascular Risk Cohort (1,000 records)
export function generateFraminghamCardioDataset(): RawRow[] {
  const rows: RawRow[] = [];
  let seed = 202;
  const total = 1000;

  for (let i = 0; i < total; i++) {
    const hasHeartDisease = seededRandom(seed++) > 0.6;
    const isMale = seededRandom(seed++) > 0.48;
    const age = Math.round(38 + seededRandom(seed++) * 36);
    const isCurrentSmoker = seededRandom(seed++) > 0.52 ? 'Yes' : 'No';
    const cigsPerDay = isCurrentSmoker === 'Yes' ? Math.round(5 + seededRandom(seed++) * 35) : 0;
    const bpMeds = seededRandom(seed++) > 0.85 ? 'Yes' : 'No';
    const prevalentStroke = seededRandom(seed++) > 0.96 ? 'Yes' : 'No';
    const prevalentHyp = seededRandom(seed++) > 0.68 ? 'Yes' : 'No';
    const totChol = Math.round(hasHeartDisease ? 200 + seededRandom(seed++) * 140 : 150 + seededRandom(seed++) * 80);
    const sysBP = Math.round(hasHeartDisease ? 135 + seededRandom(seed++) * 50 : 108 + seededRandom(seed++) * 30);
    const diaBP = Math.round(hasHeartDisease ? 86 + seededRandom(seed++) * 24 : 70 + seededRandom(seed++) * 18);
    const bmi = Math.round((21 + seededRandom(seed++) * (hasHeartDisease ? 18 : 12)) * 10) / 10;
    const heartRate = Math.round(58 + seededRandom(seed++) * 38);
    const glucose = Math.round(hasHeartDisease ? 85 + seededRandom(seed++) * 90 : 75 + seededRandom(seed++) * 40);

    rows.push({
      Patient_ID: `FRAM-${2000 + i + 1}`,
      Gender: isMale ? 'Male' : 'Female',
      Age: age,
      Smoking_Status: isCurrentSmoker === 'Yes' ? 'Current' : 'Never',
      Cigarettes_Per_Day: cigsPerDay,
      BP_Medication: bpMeds,
      Prevalent_Stroke: prevalentStroke,
      Prevalent_Hypertension: prevalentHyp,
      Total_Cholesterol: totChol,
      Systolic_BP: sysBP,
      Diastolic_BP: diaBP,
      BMI: seededRandom(seed++) < 0.02 ? null : bmi,
      Heart_Rate: heartRate,
      Fasting_Glucose: seededRandom(seed++) < 0.02 ? null : glucose,
      Family_History: seededRandom(seed++) > 0.6 ? 'Yes' : 'No',
      Disease: hasHeartDisease ? 'Heart Disease' : 'Healthy',
    });
  }

  return rows;
}

// 3. Chronic Kidney Disease Panel (400 records)
export function generateCKDDataset(): RawRow[] {
  const rows: RawRow[] = [];
  let seed = 303;
  const total = 400;

  for (let i = 0; i < total; i++) {
    const isCKD = seededRandom(seed++) > 0.45;
    const isMale = seededRandom(seed++) > 0.5;
    const age = Math.round(30 + seededRandom(seed++) * 48);
    const bp = Math.round(isCKD ? 80 + seededRandom(seed++) * 40 : 65 + seededRandom(seed++) * 20);
    const specificGravity = Math.round((isCKD ? 1.005 + seededRandom(seed++) * 0.015 : 1.015 + seededRandom(seed++) * 0.01) * 1000) / 1000;
    const albumin = isCKD ? Math.floor(seededRandom(seed++) * 5) : 0;
    const sugar = isCKD ? Math.floor(seededRandom(seed++) * 5) : 0;
    const bloodGlucoseRandom = Math.round(isCKD ? 120 + seededRandom(seed++) * 180 : 80 + seededRandom(seed++) * 45);
    const bloodUrea = Math.round(isCKD ? 40 + seededRandom(seed++) * 120 : 15 + seededRandom(seed++) * 25);
    const serumCreatinine = Math.round((isCKD ? 1.8 + seededRandom(seed++) * 6.5 : 0.6 + seededRandom(seed++) * 0.6) * 100) / 100;
    const sodium = Math.round(isCKD ? 128 + seededRandom(seed++) * 12 : 138 + seededRandom(seed++) * 6);
    const potassium = Math.round((isCKD ? 3.8 + seededRandom(seed++) * 2.4 : 4.0 + seededRandom(seed++) * 0.8) * 10) / 10;
    const hemoglobin = Math.round((isCKD ? 7.5 + seededRandom(seed++) * 5.0 : 13.0 + seededRandom(seed++) * 3.5) * 10) / 10;
    const egfr = Math.round(isCKD ? 15 + seededRandom(seed++) * 40 : 90 + seededRandom(seed++) * 30);

    rows.push({
      Patient_ID: `CKD-${3000 + i + 1}`,
      Age: age,
      Gender: isMale ? 'Male' : 'Female',
      Blood_Pressure: bp,
      Specific_Gravity: specificGravity,
      Urine_Albumin: albumin * 100,
      Blood_Glucose: bloodGlucoseRandom,
      BUN: bloodUrea,
      Serum_Creatinine: serumCreatinine,
      eGFR: egfr,
      Sodium: sodium,
      Potassium: potassium,
      Hemoglobin: hemoglobin,
      Hypertension: isCKD ? 'Yes' : 'No',
      Diabetes_Mellitus: isCKD && seededRandom(seed++) > 0.4 ? 'Yes' : 'No',
      Disease: isCKD ? 'CKD' : 'Healthy',
    });
  }

  return rows;
}

export const PRESET_DATASET_CONFIGS = [
  {
    id: 'nhanes',
    name: 'NHANES Multi-Morbidity Cohort (Continuous Survey)',
    fileName: 'nhanes_multimorbidity_cohort.csv',
    rowsCount: 1250,
    featuresCount: 27,
    diseases: ['Healthy', 'Diabetes', 'Heart Disease', 'CKD'],
    description: 'Real-world NHANES continuous survey cohort with SEQN patient identifiers, lipid panels, glycemic biomarkers, eGFR, and multi-condition status.',
    generator: generateNhanesDataset,
  },
  {
    id: 'master',
    name: 'Universal Multi-Morbidity Benchmark',
    fileName: 'universal_multimorbidity_9254.csv',
    rowsCount: 9254,
    featuresCount: 36,
    diseases: ['Healthy', 'Diabetes', 'Heart Disease', 'CKD'],
    description: 'Gold-standard comprehensive clinical cohort spanning 7 input categories with 36 metabolic, cardiac, renal, and lifestyle biomarkers.',
    generator: generateMasterDataset,
  },
  {
    id: 'pima',
    name: 'Pima Indian Diabetes Clinical Lab',
    fileName: 'pima_diabetes_clinical.csv',
    rowsCount: 768,
    featuresCount: 11,
    diseases: ['Healthy', 'Diabetes'],
    description: 'Classic NIH/NIDDK dataset for diagnostic diabetes prediction with glucose tolerance, insulin, BMI, and pedigree function.',
    generator: generatePimaDiabetesDataset,
  },
  {
    id: 'framingham',
    name: 'Framingham Cardiovascular Study Panel',
    fileName: 'framingham_cardiovascular.csv',
    rowsCount: 1000,
    featuresCount: 16,
    diseases: ['Healthy', 'Heart Disease'],
    description: 'Longitudinal coronary heart disease risk dataset with blood pressure, lipids, smoking status, and lifestyle factors.',
    generator: generateFraminghamCardioDataset,
  },
  {
    id: 'ckd',
    name: 'Chronic Kidney Disease Clinical Panel',
    fileName: 'chronic_kidney_disease_panel.csv',
    rowsCount: 400,
    featuresCount: 16,
    diseases: ['Healthy', 'CKD'],
    description: 'Clinical nephrology cohort with serum creatinine, eGFR, BUN, urine albumin, and electrolyte panels.',
    generator: generateCKDDataset,
  },
];
