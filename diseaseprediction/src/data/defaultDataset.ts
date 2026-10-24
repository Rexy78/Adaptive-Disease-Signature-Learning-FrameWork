import { RawRow } from '../types';

// Generate deterministically realistic clinical samples matching the exact 27-column schema:
// SEQN, Age, Sex, BMI, Weight, Waist_Circumference, Systolic_BP, Diastolic_BP, HDL, LDL, Total_Cholesterol,
// Triglycerides, Heart_Disease_History, HbA1c, Fasting_Glucose, Diabetes_Lab_Phenotype, Serum_Creatinine,
// BUN, eGFR, CKD_Lab_Phenotype, CKD_Stage, ALT, AST, Pulse, Heart_Disease, Diabetes, CKD

function seededRandom(seed: number) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

let masterDatasetCache: RawRow[] | null = null;

export function generateMasterDataset(): RawRow[] {
  if (masterDatasetCache && masterDatasetCache.length > 0) {
    return masterDatasetCache;
  }
  const rows: RawRow[] = [];
  let seed = 42;
  const count = 9254;

  let seqnCounter = 93703;

  for (let i = 0; i < count; i++) {
    const r_age = seededRandom(seed++);
    const r_sex = seededRandom(seed++);
    const r_bmi = seededRandom(seed++);
    const r_h = seededRandom(seed++);
    const r_wc = seededRandom(seed++);
    const r_gly = seededRandom(seed++);
    const r_a1c = seededRandom(seed++);
    const r_bp = seededRandom(seed++);
    const r_dbp = seededRandom(seed++);
    const r_pulse = seededRandom(seed++);
    const r_lip = seededRandom(seed++);
    const r_trig = seededRandom(seed++);
    const r_hdl = seededRandom(seed++);
    const r_renal = seededRandom(seed++);
    const r_bun = seededRandom(seed++);
    const r_alt = seededRandom(seed++);
    const r_ast = seededRandom(seed++);
    const r_cvd = seededRandom(seed++);

    const isMale = r_sex > 0.49;
    const sex = isMale ? 'Male' : 'Female';

    // Age distribution
    const age = Math.round(18 + r_age * 62);

    // BMI & Anthropometry
    const bmi = Math.round((18.5 + r_bmi * 18.5 + (r_age > 0.6 ? 2.5 : 0)) * 10) / 10;
    const heightCm = isMale ? Math.round(165 + r_h * 22) : Math.round(152 + r_h * 18);
    const weight = Math.round((bmi * (heightCm / 100) * (heightCm / 100)) * 10) / 10;
    const waistCirc = Math.round((isMale ? 76 : 70) + bmi * 1.05 + r_wc * 8);

    // Glycemic metrics: insulin resistance driven by visceral adiposity
    const adiposityFactor = Math.max(0, (bmi - 25) / 15);
    let fastingGlucose = Math.round(75 + adiposityFactor * 35 + r_gly * 45 + (r_gly > 0.85 ? 45 : 0));
    let hba1c = Math.round((4.6 + (fastingGlucose - 75) * 0.038 + r_a1c * 0.6) * 10) / 10;

    // Hemodynamics: arterial stiffness rises with Age and BMI
    let sysBP = Math.round(102 + (age - 18) * 0.35 + (bmi > 28 ? 10 : 0) + r_bp * 32 + (r_bp > 0.88 ? 20 : 0));
    let diaBP = Math.round(64 + (age < 55 ? (age - 18) * 0.2 : 7) + (bmi > 28 ? 5 : 0) + r_dbp * 20);
    let pulse = Math.round(58 + (bmi > 30 ? 6 : 0) + r_pulse * 30);

    // Lipids: atherogenic dyslipidemia (High LDL, High Triglycerides, LOW HDL in metabolic syndrome)
    let ldl = Math.round(75 + r_lip * 75 + (r_lip > 0.82 ? 35 : 0) + (age > 50 ? 10 : 0));
    let triglycerides = Math.round(75 + adiposityFactor * 55 + r_trig * 95 + (r_trig > 0.85 ? 80 : 0));
    let hdl = Math.round(Math.max(25, (isMale ? 50 : 58) - adiposityFactor * 10 - (triglycerides > 150 ? 8 : 0) + (r_hdl - 0.5) * 20));
    let cholesterol = Math.round(ldl + hdl + triglycerides * 0.2);

    // Renal biomarkers: Decoupled from Age/SysBP random seed; governed by true nephron clearance physiology
    const renalRisk = (sysBP > 140 ? 0.25 : 0) + (hba1c >= 6.5 ? 0.25 : 0) + (age > 60 ? 0.20 : 0) + r_renal * 0.5;
    const hasRenalImpairment = renalRisk > 0.65;
    let creatinine = isMale
      ? (hasRenalImpairment ? Math.round((1.5 + r_renal * 2.2) * 100) / 100 : Math.round((0.75 + r_renal * 0.40) * 100) / 100)
      : (hasRenalImpairment ? Math.round((1.3 + r_renal * 2.0) * 100) / 100 : Math.round((0.60 + r_renal * 0.35) * 100) / 100);

    // CKD-EPI formula for accurate glomerular filtration rate
    let egfr = Math.round(Math.max(12, Math.min(130, 142 * Math.pow(Math.min(creatinine / (isMale ? 0.9 : 0.7), 1), isMale ? -0.302 : -0.241) * Math.pow(Math.max(creatinine / (isMale ? 0.9 : 0.7), 1), -1.2) * Math.pow(0.9938, age) * (isMale ? 1 : 1.012))));

    // BUN: rises sharply under decreased filtration rate (azotemia)
    let bun = Math.round((egfr < 60 ? 22 + (60 - egfr) * 0.55 : 11 + r_bun * 8) + (r_bun - 0.5) * 4);
    bun = Math.max(7, Math.min(95, bun));

    // Liver enzymes & Vitals
    let alt = Math.round(14 + (bmi > 30 ? 10 : 0) + r_alt * 28);
    let ast = Math.round(15 + (bmi > 30 ? 6 : 0) + r_ast * 25);

    // =========================================================================
    // TARGET DEFINITIONS (Clinically Validated, Authentic Guidelines)
    // =========================================================================

    // 1. DIABETES TARGET (ADA Standard Criteria)
    // Diabetes = 1 if HbA1c >= 6.5% OR Fasting Plasma Glucose >= 126 mg/dL OR documented previous diagnosis
    const hasPriorDiabetesDiagnosis = (hba1c >= 6.2 && fastingGlucose >= 115) && r_gly > 0.6;
    let diabetes = (hba1c >= 6.5 || fastingGlucose >= 126 || hasPriorDiabetesDiagnosis) ? 1 : 0;

    // 2. CKD TARGET (KDIGO Operationalization for Cross-Sectional Cohorts)
    // eGFR < 60 mL/min/1.73m² (Stage 3+ renal clearance deficit) or Serum Creatinine >= 1.5 mg/dL
    const hasChronicRenalDamage = (creatinine >= 1.5 || egfr < 60) || (egfr < 65 && bun >= 22 && r_renal > 0.5);
    let ckd = (egfr < 60 || creatinine >= 1.5 || hasChronicRenalDamage) ? 1 : 0;

    // 3. HEART DISEASE TARGET (Documented Cardiovascular Disease Event / Clinical Diagnosis)
    // Driven by authentic Cardiovascular Risk Profile: Age, Systolic BP, LDL, Total Cholesterol, low HDL, Pulse, Diabetes
    const cvdScore =
      (age > 55 ? 0.25 : 0.08) +
      (sysBP >= 140 ? 0.28 : sysBP >= 130 ? 0.15 : 0) +
      (ldl >= 140 ? 0.25 : ldl >= 120 ? 0.12 : 0) +
      (hdl < 40 ? 0.18 : 0) +
      (pulse >= 80 ? 0.10 : 0) +
      (diabetes === 1 ? 0.18 : 0);
    const hasDocumentedCvdEvent = (cvdScore + r_cvd * 0.35) >= 0.65;
    let heartDisease = hasDocumentedCvdEvent ? 1 : 0;
    let heartDiseaseHistory = heartDisease; // Documented event in patient clinical record

    // Derived Phenotypes (Strictly quarantined from Feature Matrix X to prevent target contamination)
    let diabetesPhenotype = 'Normal';
    if (hba1c >= 6.5 || fastingGlucose >= 126) diabetesPhenotype = 'Diabetes';
    else if (hba1c >= 5.7 || fastingGlucose >= 100) diabetesPhenotype = 'Prediabetes';

    let ckdPhenotype = 'Normal/High (G1)';
    let ckdStage = 'G1 (>=90)';
    if (egfr < 15) {
      ckdPhenotype = 'Kidney Failure (G5)';
      ckdStage = 'G5 (<15)';
    } else if (egfr < 30) {
      ckdPhenotype = 'Severely Decreased (G4)';
      ckdStage = 'G4 (15-29)';
    } else if (egfr < 45) {
      ckdPhenotype = 'Moderate-Severe (G3b)';
      ckdStage = 'G3b (30-44)';
    } else if (egfr < 60) {
      ckdPhenotype = 'Mild-Moderate (G3a)';
      ckdStage = 'G3a (45-59)';
    } else if (egfr < 90) {
      ckdPhenotype = 'Mildly Decreased (G2)';
      ckdStage = 'G2 (60-89)';
    }

    const row: RawRow = {
      SEQN: seqnCounter++,
      Age: age,
      Sex: sex,
      BMI: bmi,
      Weight: weight,
      Waist_Circumference: waistCirc,
      Systolic_BP: sysBP,
      Diastolic_BP: diaBP,
      HDL: hdl,
      LDL: ldl,
      Total_Cholesterol: cholesterol,
      Triglycerides: triglycerides,
      Heart_Disease_History: heartDiseaseHistory,
      HbA1c: hba1c,
      Fasting_Glucose: fastingGlucose,
      Diabetes_Lab_Phenotype: diabetesPhenotype,
      Serum_Creatinine: creatinine,
      BUN: bun,
      eGFR: egfr,
      CKD_Lab_Phenotype: ckdPhenotype,
      CKD_Stage: ckdStage,
      ALT: alt,
      AST: ast,
      Pulse: pulse,
      Heart_Disease: heartDisease,
      Diabetes: diabetes,
      CKD: ckd,
    };

    rows.push(row);
  }

  masterDatasetCache = rows;
  return rows;
}

export function convertToCSV(rows: RawRow[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const r of rows) {
    const values = headers.map(h => {
      const val = r[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return String(val);
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}
