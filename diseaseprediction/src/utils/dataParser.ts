import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  RawRow,
  ValidationIssue,
  ValidationResult,
  ClinicalInputCategory,
  ClinicalRangeDefinition,
  RangeValidationResult,
  ColumnTypeVerification,
} from '../types';

// Helper: Clean and normalize header names (strip BOM, quotes, whitespace, carriage returns)
export function cleanHeaderName(rawHeader: any, index = 0): string {
  if (rawHeader === null || rawHeader === undefined) {
    return `Column_${index + 1}`;
  }
  let h = String(rawHeader)
    .replace(/^\uFEFF/, '') // Strip UTF-8 Byte Order Mark
    .replace(/[\r\n\t]/g, ' ')
    .trim();

  // Strip leading/trailing quotes
  h = h.replace(/^["']+|["']+$/g, '').trim();

  return h || `Column_${index + 1}`;
}

// Helper: Clean, parse and type-cast cell values
export function cleanCellValue(rawVal: any): string | number | null {
  if (rawVal === null || rawVal === undefined) {
    return null;
  }

  // Already a number
  if (typeof rawVal === 'number') {
    if (isNaN(rawVal) || !isFinite(rawVal)) return null;
    // Handle extreme underflow floating point artifacts (e.g. 5.4e-79)
    if (Math.abs(rawVal) < 1e-15 && rawVal !== 0) return 0;
    return rawVal;
  }

  // Boolean
  if (typeof rawVal === 'boolean') {
    return rawVal ? 1 : 0;
  }

  // String cleaning
  const str = String(rawVal).trim();

  // Missing value tokens
  const lower = str.toLowerCase();
  if (
    str === '' ||
    lower === 'na' ||
    lower === 'n/a' ||
    lower === 'null' ||
    lower === 'none' ||
    lower === 'nan' ||
    lower === 'nil' ||
    lower === 'undefined' ||
    str === '?' ||
    str === '.' ||
    str === '-' ||
    str === '--'
  ) {
    return null;
  }

  // Boolean strings
  if (lower === 'true' || lower === 'yes' || lower === 'y') {
    return 1;
  }
  if (lower === 'false' || lower === 'no' || lower === 'n') {
    return 0;
  }

  // Check if numeric string
  // Remove thousand separator commas (e.g. "1,250.50" -> "1250.50")
  const commaFree = str.replace(/,/g, '');
  
  // Strip currency or percent symbols if plain number
  const numCandidate = commaFree.replace(/^[$€£¥₹]/, '').replace(/%$/, '').trim();

  if (/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(numCandidate)) {
    const parsed = Number(numCandidate);
    if (!isNaN(parsed) && isFinite(parsed)) {
      if (Math.abs(parsed) < 1e-15 && parsed !== 0) return 0;
      return parsed;
    }
  }

  return str;
}

// Clinical reference ranges for physiological boundary validation
export const CLINICAL_RANGE_DEFINITIONS: ClinicalRangeDefinition[] = [
  // Age & Demographics
  { column: 'age', min: 0, max: 125, unit: 'years', category: 'Age & Demographics', description: 'Patient biological age at examination' },
  { column: 'height', min: 40, max: 250, unit: 'cm', category: 'Age & Demographics', description: 'Patient standing height' },
  { column: 'weight', min: 2.0, max: 350.0, unit: 'kg', category: 'Age & Demographics', description: 'Patient body mass' },
  
  // Vital Signs
  { column: 'systolic_bp', min: 50, max: 260, unit: 'mmHg', category: 'Vital Signs', description: 'Systolic blood pressure' },
  { column: 'diastolic_bp', min: 30, max: 160, unit: 'mmHg', category: 'Vital Signs', description: 'Diastolic blood pressure' },
  { column: 'bmi', min: 10.0, max: 80.0, unit: 'kg/m²', category: 'Vital Signs', description: 'Body Mass Index' },
  { column: 'heart_rate', min: 30, max: 220, unit: 'bpm', category: 'Vital Signs', description: 'Resting pulse rate' },
  { column: 'pulse', min: 30, max: 220, unit: 'bpm', category: 'Vital Signs', description: 'Resting pulse rate' },
  { column: 'waist_circumference', min: 40, max: 200, unit: 'cm', category: 'Vital Signs', description: 'Abdominal girth measurement' },
  
  // Laboratory Results (Metabolic & Glycemic)
  { column: 'fasting_glucose', min: 30, max: 800, unit: 'mg/dL', category: 'Laboratory Results', description: 'Plasma fasting glucose concentration' },
  { column: 'glucose', min: 30, max: 800, unit: 'mg/dL', category: 'Laboratory Results', description: 'Plasma fasting glucose concentration' },
  { column: 'hba1c', min: 3.0, max: 19.0, unit: '%', category: 'Laboratory Results', description: 'Glycated hemoglobin percentage' },
  { column: 'fasting_insulin', min: 0.5, max: 350.0, unit: 'uIU/mL', category: 'Laboratory Results', description: 'Fasting serum insulin level' },
  { column: 'homa_ir', min: 0.1, max: 50.0, unit: 'index', category: 'Laboratory Results', description: 'Homeostatic Model Assessment for Insulin Resistance' },
  
  // Laboratory Results (Lipid Panel)
  { column: 'total_cholesterol', min: 50, max: 650, unit: 'mg/dL', category: 'Laboratory Results', description: 'Total serum cholesterol' },
  { column: 'ldl', min: 15, max: 450, unit: 'mg/dL', category: 'Laboratory Results', description: 'Low-density lipoprotein cholesterol' },
  { column: 'hdl', min: 10, max: 160, unit: 'mg/dL', category: 'Laboratory Results', description: 'High-density lipoprotein cholesterol' },
  { column: 'triglycerides', min: 20, max: 1500, unit: 'mg/dL', category: 'Laboratory Results', description: 'Fasting serum triglycerides' },
  
  // Laboratory Results (Renal & Hepatic Panel)
  { column: 'serum_creatinine', min: 0.2, max: 20.0, unit: 'mg/dL', category: 'Laboratory Results', description: 'Serum creatinine clearance marker' },
  { column: 'creatinine', min: 0.2, max: 20.0, unit: 'mg/dL', category: 'Laboratory Results', description: 'Serum creatinine clearance marker' },
  { column: 'egfr', min: 1, max: 200, unit: 'mL/min/1.73m²', category: 'Laboratory Results', description: 'Estimated Glomerular Filtration Rate' },
  { column: 'bun', min: 2, max: 180, unit: 'mg/dL', category: 'Laboratory Results', description: 'Blood Urea Nitrogen' },
  { column: 'urine_albumin', min: 0, max: 3000, unit: 'mg/g', category: 'Laboratory Results', description: 'Urine albumin-to-creatinine ratio' },
  { column: 'alt', min: 3, max: 600, unit: 'U/L', category: 'Laboratory Results', description: 'Alanine aminotransferase liver enzyme' },
  { column: 'ast', min: 3, max: 600, unit: 'U/L', category: 'Laboratory Results', description: 'Aspartate aminotransferase enzyme' },
  { column: 'uric_acid', min: 1.0, max: 18.0, unit: 'mg/dL', category: 'Laboratory Results', description: 'Serum uric acid level' },
  { column: 'hemoglobin', min: 3.5, max: 24.0, unit: 'g/dL', category: 'Laboratory Results', description: 'Blood hemoglobin concentration' },
  { column: 'wbc', min: 1.0, max: 50.0, unit: '10³/uL', category: 'Laboratory Results', description: 'White blood cell count' },
  { column: 'platelets', min: 20, max: 1000, unit: '10³/uL', category: 'Laboratory Results', description: 'Blood platelet count' },
  { column: 'sodium', min: 110, max: 170, unit: 'mEq/L', category: 'Laboratory Results', description: 'Serum sodium electrolyte' },
  { column: 'potassium', min: 2.0, max: 8.5, unit: 'mEq/L', category: 'Laboratory Results', description: 'Serum potassium electrolyte' },
  { column: 'calcium', min: 5.0, max: 15.0, unit: 'mg/dL', category: 'Laboratory Results', description: 'Total serum calcium' },
];

export function categorizeClinicalHeader(header?: string): ClinicalInputCategory {
  const norm = String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (
    norm.includes('patientid') ||
    norm.includes('subjectid') ||
    norm.includes('sampleid') ||
    norm.includes('rowid') ||
    norm.includes('caseid') ||
    norm === 'id' ||
    norm === 'seqn' ||
    norm.startsWith('unnamed')
  ) {
    return 'Metadata';
  }

  // Avoid matching "heart_disease_history" or "family_history_diabetes" as target outcome
  if (norm.includes('history') || norm.includes('prior') || norm.includes('previous') || norm.includes('family')) {
    return 'Medical History';
  }

  if (
    norm === 'disease' ||
    norm === 'diagnosis' ||
    norm === 'target' ||
    norm === 'outcome' ||
    norm === 'condition' ||
    norm === 'label' ||
    norm === 'class' ||
    norm === 'status' ||
    norm === 'heartdisease' ||
    norm === 'diabetes' ||
    norm === 'ckd' ||
    norm === 'hypertension' ||
    norm === 'cancer'
  ) {
    return 'Target Outcome';
  }

  // Age check: strictly avoid "stage", "damage", "image", "percentage", etc.
  const ageWordMatch = /(^|[_\s-])age([_\s-]|$)/i.test(String(header ?? '')) || norm === 'age' || norm === 'ridageyr' || norm === 'patientage';
  if (ageWordMatch || norm.includes('dob') || norm.includes('birth') || norm.includes('ethnicity') || norm.includes('race') || norm.includes('height') || norm.includes('weight')) {
    return 'Age & Demographics';
  }

  if (norm === 'gender' || norm === 'sex' || norm.includes('gender') || norm.includes('sex') || norm === 'riagendr') {
    return 'Gender';
  }

  if (
    norm.includes('bp') ||
    norm.includes('pressure') ||
    norm.includes('pulse') ||
    norm.includes('heartrate') ||
    norm.includes('bmi') ||
    norm.includes('waist') ||
    norm.includes('respiratory') ||
    norm.includes('spo2') ||
    norm.includes('temp')
  ) {
    return 'Vital Signs';
  }

  if (norm.includes('smoke') || norm.includes('smoking') || norm.includes('alcohol') || norm.includes('activity') || norm.includes('exercise') || norm.includes('diet') || norm.includes('sleep')) {
    return 'Lifestyle Factors';
  }

  if (norm.includes('image') || norm.includes('scan') || norm.includes('xray') || norm.includes('mri') || norm.includes('ct') || norm.includes('ultrasound') || norm.includes('fundus') || norm.includes('modality') || norm.includes('dicom')) {
    return 'Medical Images & Modalities';
  }

  // Default to lab results for blood / chemical biomarkers
  return 'Laboratory Results';
}

export function matchClinicalRangeDefinition(colName: string): ClinicalRangeDefinition | undefined {
  const norm = String(colName ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!norm) return undefined;

  // 1. Exact match
  let found = CLINICAL_RANGE_DEFINITIONS.find((def) => {
    const defNorm = def.column.toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm === defNorm;
  });
  if (found) return found;

  // 2. Specific alias mappings
  if (norm === 'ridageyr' || norm === 'patientage' || /(^|[_\s-])age([_\s-]|$)/i.test(colName)) {
    if (!norm.includes('stage') && !norm.includes('damage') && !norm.includes('image') && !norm.includes('dosage')) {
      return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'age');
    }
  }
  if (norm === 'bmxbmi' || norm === 'bodymassindex' || /(^|[_\s-])bmi([_\s-]|$)/i.test(colName)) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'bmi');
  }
  if (norm === 'lbxgh' || norm === 'glycatedhemoglobin' || norm === 'glycohemoglobin' || norm === 'a1c' || norm.includes('hba1c')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'hba1c');
  }
  if (norm === 'lbxglu' || norm.includes('fastingglucose') || norm === 'fpg' || (norm.includes('glucose') && !norm.includes('phenotype'))) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'fasting_glucose');
  }
  if (norm.includes('systolic') || norm === 'sbp' || norm === 'bpsystolic' || norm === 'vsy') {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'systolic_bp');
  }
  if (norm.includes('diastolic') || norm === 'dbp' || norm === 'bpdiastolic' || norm === 'vdi') {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'diastolic_bp');
  }
  if (norm === 'lbxtc' || (norm.includes('cholesterol') && !norm.includes('hdl') && !norm.includes('ldl'))) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'total_cholesterol');
  }
  if (norm === 'lbdhdd' || norm === 'hdlcholesterol' || norm === 'hdl') {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'hdl');
  }
  if (norm === 'lbdldl' || norm === 'ldlcholesterol' || norm === 'ldl') {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'ldl');
  }
  if (norm === 'lbxtrg' || norm.includes('triglyceride')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'triglycerides');
  }
  if (norm === 'lbxscr' || norm.includes('creatinine')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'serum_creatinine');
  }
  if (norm === 'lbxsbu' || norm.includes('bun') || norm.includes('ureanitrogen')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'bun');
  }
  if (norm === 'egfr' || norm.includes('gfr')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'egfr');
  }
  if (norm === 'lbxsat' || norm === 'alt' || norm === 'sgpt') {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'alt');
  }
  if (norm === 'lbxssa' || norm === 'ast' || norm === 'sgot') {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'ast');
  }
  if (norm === 'bmxwaist' || norm.includes('waist')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'waist_circumference');
  }
  if (norm.includes('pulse') || norm.includes('heartrate')) {
    return CLINICAL_RANGE_DEFINITIONS.find((d) => d.column === 'pulse');
  }

  return undefined;
}

export function validateAndParseFile(file: File): Promise<{ rows: RawRow[]; result: ValidationResult }> {
  return new Promise((resolve) => {
    const fileName = file.name;
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const isCsv =
      extension === '.csv' ||
      extension === '.tsv' ||
      extension === '.txt' ||
      file.type === 'text/csv' ||
      file.type.includes('tab-separated');
    const isJson = extension === '.json' || file.type === 'application/json';
    const isExcel =
      extension === '.xlsx' ||
      extension === '.xls' ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');

    const issues: ValidationIssue[] = [];

    // File type check
    if (!isCsv && !isExcel && !isJson) {
      issues.push({
        type: 'error',
        category: 'file_type',
        message: 'Invalid file format',
        details: 'Supported healthcare formats: CSV (.csv), TSV (.tsv), Excel (.xlsx, .xls), or JSON (.json).',
      });
      resolve({
        rows: [],
        result: {
          isValid: false,
          issues,
          totalRows: 0,
          totalCols: 0,
          headers: [],
          duplicateCols: [],
          duplicateRowCount: 0,
          emptyRowCount: 0,
          totalMissingCells: 0,
          overallMissingPercent: 0,
          fileInfo: { name: fileName, size: file.size, type: file.type || extension },
          typeVerifications: [],
          rangeValidations: [],
          categoryBreakdown: {
            'Age & Demographics': 0,
            Gender: 0,
            'Laboratory Results': 0,
            'Vital Signs': 0,
            'Medical History': 0,
            'Lifestyle Factors': 0,
            'Medical Images & Modalities': 0,
            'Target Outcome': 0,
            Metadata: 0,
          },
          validatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = String(e.target?.result || '[]');
          const parsed = JSON.parse(content);
          const rawArr = Array.isArray(parsed) ? parsed : parsed.data || parsed.rows || [parsed];
          if (!rawArr || rawArr.length === 0) {
            issues.push({ type: 'error', category: 'empty_rows', message: 'JSON dataset contains 0 records' });
            processRawParsedSync([], [], issues, fileName, file.size, 'application/json', resolve);
            return;
          }
          const rawHeaders = Object.keys(rawArr[0] || {});
          const cleanHeaders = rawHeaders.map((h, i) => cleanHeaderName(h, i));

          const cleanRows: RawRow[] = rawArr.map((rowObj) => {
            const newRow: RawRow = {};
            cleanHeaders.forEach((ch, idx) => {
              const origKey = rawHeaders[idx];
              newRow[ch] = cleanCellValue(rowObj[origKey]);
            });
            return newRow;
          });

          processRawParsedSync(cleanRows, cleanHeaders, issues, fileName, file.size, 'application/json', resolve);
        } catch (err: any) {
          issues.push({
            type: 'error',
            category: 'file_type',
            message: 'Malformed JSON dataset',
            details: err?.message,
          });
          processRawParsedSync([], [], issues, fileName, file.size, 'application/json', resolve);
        }
      };
      reader.readAsText(file);
      return;
    }

    if (isCsv) {
      Papa.parse<Record<string, any>>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header, index) => cleanHeaderName(header, index),
        transform: (value) => cleanCellValue(value),
        complete: (parsed) => {
          const rawFields = (parsed.meta.fields || []).map((h, i) => cleanHeaderName(h, i));

          const structuredRows: RawRow[] = [];
          for (const rawRow of parsed.data) {
            if (!rawRow || typeof rawRow !== 'object') continue;
            const newRow: RawRow = {};
            let hasAnyVal = false;

            for (const h of rawFields) {
              const val = rawRow[h] !== undefined ? cleanCellValue(rawRow[h]) : null;
              newRow[h] = val;
              if (val !== null && val !== undefined && val !== '') {
                hasAnyVal = true;
              }
            }

            if (hasAnyVal) {
              structuredRows.push(newRow);
            }
          }

          processRawParsedSync(
            structuredRows,
            rawFields,
            issues,
            fileName,
            file.size,
            file.type || 'text/csv',
            resolve
          );
        },
        error: (err) => {
          issues.push({
            type: 'error',
            category: 'file_type',
            message: 'Failed to parse CSV file',
            details: err.message,
          });
          processRawParsedSync([], [], issues, fileName, file.size, file.type || 'text/csv', resolve);
        },
      });
    } else {
      // Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

          if (!json || json.length === 0) {
            issues.push({
              type: 'error',
              category: 'headers',
              message: 'Excel sheet is completely empty',
            });
            processRawParsedSync([], [], issues, fileName, file.size, file.type || extension, resolve);
            return;
          }

          const rawHeaders = json[0] as string[];
          const rawRows = json.slice(1);

          const fields: string[] = [];
          for (let i = 0; i < (rawHeaders ? rawHeaders.length : 0); i++) {
            fields.push(cleanHeaderName(rawHeaders[i], i));
          }

          const structuredRows: RawRow[] = [];
          for (const rowArr of rawRows) {
            if (!Array.isArray(rowArr)) continue;
            const rowObj: RawRow = {};
            let hasAnyVal = false;

            for (let c = 0; c < fields.length; c++) {
              const val = rowArr[c];
              const cleaned = cleanCellValue(val);
              rowObj[fields[c]] = cleaned;
              if (cleaned !== null && cleaned !== undefined && cleaned !== '') {
                hasAnyVal = true;
              }
            }

            if (hasAnyVal) {
              structuredRows.push(rowObj);
            }
          }

          processRawParsedSync(
            structuredRows,
            fields,
            issues,
            fileName,
            file.size,
            file.type || extension,
            resolve
          );
        } catch (err: any) {
          issues.push({
            type: 'error',
            category: 'file_type',
            message: 'Failed to read Excel workbook',
            details: err?.message || 'Unsupported format',
          });
          processRawParsedSync([], [], issues, fileName, file.size, file.type || extension, resolve);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

export function validateRawDataset(
  rows: RawRow[],
  headers: string[],
  fileInfo = { name: 'master_dataset.csv', size: 482000, type: 'text/csv' }
): { rows: RawRow[]; result: ValidationResult } {
  const issues: ValidationIssue[] = [];
  return processRawParsedSyncInternal(rows, headers, issues, fileInfo.name, fileInfo.size, fileInfo.type);
}

function processRawParsedSync(
  data: any[],
  headers: string[],
  issues: ValidationIssue[],
  fileName: string,
  fileSize: number,
  fileType: string,
  resolve: (res: { rows: RawRow[]; result: ValidationResult }) => void
) {
  const res = processRawParsedSyncInternal(data, headers, issues, fileName, fileSize, fileType);
  resolve(res);
}

function processRawParsedSyncInternal(
  data: any[],
  headers: string[],
  issues: ValidationIssue[],
  fileName: string,
  fileSize: number,
  fileType: string
): { rows: RawRow[]; result: ValidationResult } {
  // 1. Check Missing Header Row
  if (!headers || headers.length === 0) {
    issues.push({
      type: 'error',
      category: 'headers',
      message: 'Missing Header Row',
      details: 'The uploaded clinical file does not contain column header names.'
    });
  }

  // 2. Check Duplicate & Empty Column Headers
  const headerCounts: Record<string, number> = {};
  const duplicateCols: string[] = [];
  for (const h of headers) {
    const trimmed = h ? String(h).trim() : '';
    if (!trimmed) {
      issues.push({
        type: 'warning',
        category: 'headers',
        message: 'Empty column header detected',
        details: 'Some columns lack an explicit clinical variable name.'
      });
    }
    headerCounts[trimmed] = (headerCounts[trimmed] || 0) + 1;
    if (headerCounts[trimmed] === 2) {
      duplicateCols.push(trimmed);
    }
  }

  if (duplicateCols.length > 0) {
    issues.push({
      type: 'warning',
      category: 'duplicates',
      message: `Duplicate column header(s) found: ${duplicateCols.join(', ')}`,
      details: 'Duplicate columns may cause ambiguous feature alignment in downstream clinical pipelines.'
    });
  }

  // 3. Filter completely empty rows
  let emptyRowCount = 0;
  const nonBlankRows: RawRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) {
      emptyRowCount++;
      continue;
    }
    const values = Object.values(row);
    const isEmpty = values.every(
      (val) => val === null || val === undefined || String(val).trim() === ''
    );

    if (isEmpty) {
      emptyRowCount++;
    } else {
      nonBlankRows.push(row);
    }
  }

  if (emptyRowCount > 0) {
    issues.push({
      type: 'info',
      category: 'empty_rows',
      message: `${emptyRowCount} empty row(s) detected and automatically filtered`,
      details: 'Completely blank lines have been pruned from clinical analysis.'
    });
  }

  // 4. Check Duplicate Records (Exact Rows & Patient ID Collisions)
  let duplicateRowCount = 0;
  const seenRowFingerprints = new Set<string>();
  const idCol = headers.find((h) => {
    const l = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    return l.includes('patientid') || l.includes('subjectid') || l.includes('caseid') || l === 'id';
  });

  const seenIds = new Set<string>();
  let idCollisionCount = 0;

  for (const row of nonBlankRows) {
    // Exact row fingerprinting across all values
    const rowStr = headers.map((h) => String(row[h] ?? '')).join('|');
    if (seenRowFingerprints.has(rowStr)) {
      duplicateRowCount++;
    } else {
      seenRowFingerprints.add(rowStr);
    }

    if (idCol && row[idCol] !== null && row[idCol] !== undefined) {
      const idVal = String(row[idCol]).trim();
      if (idVal) {
        if (seenIds.has(idVal)) {
          idCollisionCount++;
        } else {
          seenIds.add(idVal);
        }
      }
    }
  }

  if (duplicateRowCount > 0) {
    issues.push({
      type: 'warning',
      category: 'duplicates',
      message: `${duplicateRowCount} duplicate record(s) detected in clinical dataset`,
      details: 'Identical rows detected. Can be deduplicated or retained as replicate observations.'
    });
  }

  if (idCollisionCount > 0) {
    issues.push({
      type: 'warning',
      category: 'duplicates',
      message: `${idCollisionCount} Patient ID collision(s) detected`,
      details: `Non-unique identifiers found in column "${idCol}".`
    });
  }

  // 5. Check Missing Values per Column & Overall
  let totalMissingCells = 0;
  const totalPossibleCells = nonBlankRows.length * headers.length;
  const missingByColumn: Record<string, number> = {};

  for (const h of headers) {
    missingByColumn[h] = 0;
  }

  for (const row of nonBlankRows) {
    for (const h of headers) {
      const val = row[h];
      if (val === null || val === undefined || String(val).trim() === '') {
        missingByColumn[h]++;
        totalMissingCells++;
      }
    }
  }

  const overallMissingPercent = totalPossibleCells > 0 ? (totalMissingCells / totalPossibleCells) * 100 : 0;

  for (const [col, mCount] of Object.entries(missingByColumn)) {
    const colMissPercent = nonBlankRows.length > 0 ? (mCount / nonBlankRows.length) * 100 : 0;
    if (colMissPercent > 20) {
      issues.push({
        type: 'warning',
        category: 'missing_values',
        column: col,
        message: `High missingness in feature "${col}" (${colMissPercent.toFixed(1)}%, ${mCount} missing)`,
        details: 'Missing rate exceeds 20%. Recommended for robust median/mean imputation in Phase 3.'
      });
    }
  }

  // 6. Verify Data Types per Column
  const typeVerifications: ColumnTypeVerification[] = [];
  const categoryBreakdown: Record<ClinicalInputCategory, number> = {
    'Age & Demographics': 0,
    'Gender': 0,
    'Laboratory Results': 0,
    'Vital Signs': 0,
    'Medical History': 0,
    'Lifestyle Factors': 0,
    'Medical Images & Modalities': 0,
    'Target Outcome': 0,
    'Metadata': 0,
  };

  for (const col of headers) {
    const category = categorizeClinicalHeader(col);
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;

    let numCount = 0;
    let intCount = 0;
    let strCount = 0;
    let mismatchCount = 0;
    const sampleValues: (string | number)[] = [];
    const uniqueValueSet = new Set<string>();

    for (let i = 0; i < nonBlankRows.length; i++) {
      const val = nonBlankRows[i][col];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        if (sampleValues.length < 5) {
          sampleValues.push(val as any);
        }
        uniqueValueSet.add(String(val).trim());

        if (typeof val === 'number') {
          numCount++;
          if (Number.isInteger(val)) intCount++;
        } else {
          const parsed = Number(val);
          if (!isNaN(parsed) && String(val).trim() !== '') {
            numCount++;
            if (Number.isInteger(parsed)) intCount++;
          } else {
            strCount++;
          }
        }
      }
    }

    const totalValid = numCount + strCount;
    let inferredType: ColumnTypeVerification['inferredType'] = 'continuous_numeric';

    if (category === 'Metadata') {
      inferredType = 'metadata_id';
    } else if (category === 'Medical Images & Modalities') {
      inferredType = 'image_reference';
    } else if (numCount >= strCount && totalValid > 0) {
      if (uniqueValueSet.size <= 2) {
        inferredType = 'binary_categorical';
      } else if (intCount === numCount && uniqueValueSet.size <= 10) {
        inferredType = 'discrete_numeric';
      } else {
        inferredType = 'continuous_numeric';
      }
      if (strCount > 0) {
        mismatchCount = strCount;
      }
    } else {
      if (uniqueValueSet.size <= 2) {
        inferredType = 'binary_categorical';
      } else {
        inferredType = 'multiclass_categorical';
      }
    }

    if (mismatchCount > 0) {
      issues.push({
        type: 'warning',
        category: 'type_mismatch',
        column: col,
        message: `Type mismatch in numeric column "${col}" (${mismatchCount} non-numeric string values)`,
        details: 'String characters detected inside a predominantly numeric feature.'
      });
    }

    typeVerifications.push({
      column: col,
      inferredType,
      clinicalCategory: category,
      sampleValues,
      nullCount: missingByColumn[col] || 0,
      nullPercentage: nonBlankRows.length > 0 ? ((missingByColumn[col] || 0) / nonBlankRows.length) * 100 : 0,
      isConsistent: mismatchCount === 0,
      mismatchCount,
    });
  }

  // 7. Validate Feature Ranges against Physiological Benchmarks
  const rangeValidations: RangeValidationResult[] = [];

  for (const col of headers) {
    const matchedRange = matchClinicalRangeDefinition(col);

    if (matchedRange) {
      const numericVals: number[] = [];
      let outOfRange = 0;

      for (const row of nonBlankRows) {
        const v = row[col];
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          const num = Number(v);
          if (!isNaN(num)) {
            numericVals.push(num);
            if (num < matchedRange.min || num > matchedRange.max) {
              outOfRange++;
            }
          }
        }
      }

      if (numericVals.length > 0) {
        const actualMin = Math.min(...numericVals);
        const actualMax = Math.max(...numericVals);
        const outPercent = (outOfRange / numericVals.length) * 100;
        const status = outPercent === 0 ? 'valid' : outPercent > 5 ? 'critical' : 'warning';

        if (outOfRange > 0) {
          issues.push({
            type: status === 'critical' ? 'error' : 'warning',
            category: 'range_anomaly',
            column: col,
            message: `${outOfRange} out-of-range value(s) in "${col}" (Observed: [${actualMin}, ${actualMax}], Expected: [${matchedRange.min}, ${matchedRange.max}] ${matchedRange.unit})`,
            details: `Clinical range check flagged values outside standard physiological boundaries.`
          });
        }

        rangeValidations.push({
          column: col,
          category: matchedRange.category,
          unit: matchedRange.unit,
          definedMin: matchedRange.min,
          definedMax: matchedRange.max,
          actualMin: Math.round(actualMin * 100) / 100,
          actualMax: Math.round(actualMax * 100) / 100,
          outOfRangeCount: outOfRange,
          outOfRangePercent: Math.round(outPercent * 10) / 10,
          status,
          clinicalNote: matchedRange.description,
        });
      }
    }
  }

  // Final Overall Validity (Passes if no critical fatal errors)
  const isValid = !issues.some((i) => i.type === 'error' && i.category === 'file_type');

  return {
    rows: nonBlankRows,
    result: {
      isValid,
      issues,
      totalRows: nonBlankRows.length,
      totalCols: headers.length,
      headers,
      duplicateCols,
      duplicateRowCount,
      emptyRowCount,
      totalMissingCells,
      overallMissingPercent: Math.round(overallMissingPercent * 100) / 100,
      fileInfo: {
        name: fileName,
        size: fileSize,
        type: fileType,
      },
      typeVerifications,
      rangeValidations,
      categoryBreakdown,
      validatedAt: new Date().toISOString(),
    },
  };
}

export function computeDatasetFingerprint(rows: RawRow[], headers: string[], fileName: string): string {
  if (!rows || rows.length === 0) return 'empty';
  
  let hash = 0;
  const strToHash = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
  };

  strToHash(fileName);
  strToHash(headers.join(','));
  strToHash(String(rows.length));

  // Sample check: first 5 rows, middle 5 rows, last 5 rows for deterministic comparison
  const sampleIndices = new Set<number>();
  const len = rows.length;
  for (let i = 0; i < Math.min(5, len); i++) sampleIndices.add(i);
  for (let i = Math.max(0, Math.floor(len / 2) - 2); i < Math.min(len, Math.floor(len / 2) + 3); i++) sampleIndices.add(i);
  for (let i = Math.max(0, len - 5); i < len; i++) sampleIndices.add(i);

  sampleIndices.forEach((idx) => {
    const r = rows[idx];
    if (r) {
      headers.forEach((h) => {
        strToHash(`${h}:${r[h] ?? ''}`);
      });
    }
  });

  return `DS_${rows.length}x${headers.length}_${Math.abs(hash).toString(16)}`;
}
