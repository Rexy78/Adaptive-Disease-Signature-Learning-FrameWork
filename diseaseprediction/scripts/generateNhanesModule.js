const fs = require('fs');

// We have the raw CSV chunks from the user's prompt
// Let's create the complete, pristine src/data/nhanesData.ts file
const header = `import { RawRow } from '../types';
import Papa from 'papaparse';

export const NHANES_DATASET_NAME = 'nhanes_multimorbidity_cohort.csv';

let nhanesParsedCache: RawRow[] | null = null;

// Preset generator function for NHANES Multi-Morbidity Clinical Cohort
export function generateNhanesDataset(): RawRow[] {
  if (nhanesParsedCache) return nhanesParsedCache;
  const parseFn = (Papa as any)?.parse || (Papa as any)?.default?.parse || Papa;
  const parsed = parseFn(NHANES_RAW_CSV_DATA, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  nhanesParsedCache = (parsed.data || []) as RawRow[];
  return nhanesParsedCache;
}

export const NHANES_RAW_CSV_DATA = \`SEQN,Age,Sex,BMI,Weight,Waist_Circumference,Systolic_BP,Diastolic_BP,HDL,LDL,Total_Cholesterol,Triglycerides,Heart_Disease_History,HbA1c,Fasting_Glucose,Diabetes_Lab_Phenotype,Serum_Creatinine,BUN,eGFR,CKD_Lab_Phenotype,CKD_Stage,ALT,AST,Pulse,Heart_Disease,Diabetes,CKD\n`;

fs.writeFileSync('./src/data/nhanesData.ts', header, 'utf8');
console.log('Base nhanesData.ts written');
