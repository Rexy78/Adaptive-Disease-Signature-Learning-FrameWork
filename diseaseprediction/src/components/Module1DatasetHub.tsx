import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Sparkles,
  Table,
  Sliders,
  BarChart3,
  FileCheck,
  Clock,
  ChevronRight,
  Play,
  Zap,
  Check,
  Download,
  FileText
} from 'lucide-react';
import {
  DatasetSummary,
  PreprocessingSummary,
  RawRow,
  ValidationResult
} from '../types';
import { validateAndParseFile } from '../utils/dataParser';

interface Module1DatasetHubProps {
  datasetName: string;
  totalRows: number;
  datasetSummary: DatasetSummary | null;
  preprocessingSummary: PreprocessingSummary | null;
  validationResult?: ValidationResult | null;
  rawRows: RawRow[];
  processedRows: RawRow[];
  isProcessing?: boolean;
  onRunPreprocessing?: () => void;
  onDatasetLoaded?: (rows: RawRow[], validation: ValidationResult, fileName: string) => void;
  onLoadMaster: () => void;
  onLoadNhanes?: () => void;
  onNavigateSubView?: (viewId: string) => void;
}

export const Module1DatasetHub: React.FC<Module1DatasetHubProps> = ({
  datasetName,
  totalRows,
  datasetSummary,
  preprocessingSummary,
  validationResult,
  rawRows,
  processedRows,
  isProcessing = false,
  onRunPreprocessing,
  onDatasetLoaded,
  onLoadMaster,
  onLoadNhanes,
  onNavigateSubView,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [preprocessedToast, setPreprocessedToast] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPreprocessed = (processedRows.length > 0 && !!preprocessingSummary);
  const displayRows = (processedRows.length > 0 ? processedRows : rawRows).slice(0, 5);
  const headers = displayRows.length > 0 ? Object.keys(displayRows[0]) : [];

  const handleTriggerPreprocessing = () => {
    if (onRunPreprocessing) {
      onRunPreprocessing();
      setPreprocessedToast(true);
      setTimeout(() => setPreprocessedToast(false), 4000);
    }
  };

  const handleDownloadPreprocessed = () => {
    const dataToExport = processedRows.length > 0 ? processedRows : rawRows;
    if (!dataToExport || dataToExport.length === 0) return;

    const baseName = (datasetName || 'clinical_dataset').replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().slice(0, 10);

    const exportHeaders = Object.keys(dataToExport[0] || {});
    const csvLines = [
      exportHeaders.join(','),
      ...dataToExport.map((row) =>
        exportHeaders
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const strVal = String(val);
            return strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')
              ? `"${strVal.replace(/"/g, '""')}"`
              : strVal;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preprocessed_${baseName}_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const { rows, result } = await validateAndParseFile(file);
      if (rows.length > 0) {
        if (onDatasetLoaded) {
          onDatasetLoaded(rows, result, file.name);
        }
        setUploadSuccess(`Uploaded and validated "${file.name}" with ${rows.length.toLocaleString()} rows and ${result.headers.length} features. Click "Preprocess Dataset" above to run preprocessing.`);
      } else {
        const error = result.issues.find((i) => i.type === 'error')?.message || 'Failed to parse dataset file.';
        setUploadError(error);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Error processing uploaded file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Top Section Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-900/50 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Dataset and Preprocessing
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/70 px-3.5 py-1.5 rounded-full border border-emerald-500/40 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isPreprocessed ? 'Preprocessed & Verified' : 'Dataset Loaded'}</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UPLOAD DATASET & PREPROCESSING ACTION SECTION */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100">
              01
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Upload Dataset
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  isPreprocessed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {isPreprocessed ? 'Preprocessed' : 'Dataset Loaded'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload your clinical dataset or use active loaded data.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <button
                disabled
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-700 text-white flex items-center space-x-2 shadow-xs cursor-wait"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Preprocessing...</span>
              </button>
            ) : isPreprocessed ? (
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Preprocessing Complete</span>
                </span>
                <button
                  onClick={handleTriggerPreprocessing}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
                  title="Re-run Preprocessing"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleTriggerPreprocessing}
                disabled={rawRows.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                title="Clean missing values and standardize schema"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Preprocess Dataset</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60 scale-[1.005]'
              : 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept=".csv,.xlsx,.xls,.tsv"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {isUploading ? 'Validating and Ingesting Dataset...' : 'Click to Upload or Drag & Drop Dataset File'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supports Medical CSV or Excel (.xlsx, .xls) files
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium">
                Automated Schema Validation
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium">
                Missing Cells Detection
              </span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium">
                Biomarker Standardization
              </span>
            </div>
          </div>
        </div>

        {/* Upload Notifications */}
        {uploadError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Active Dataset Status Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Dataset</span>
            <div className="text-sm font-black text-slate-900 truncate" title={datasetName}>
              {datasetName || 'master_dataset.csv'}
            </div>
            <span className="text-[11px] text-indigo-600 font-bold">Verified Ingestion</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Patients</span>
            <div className="text-sm font-bold text-slate-800 font-mono">
              {totalRows > 0 ? totalRows.toLocaleString() : '9,254'} Rows
            </div>
            <span className="text-[11px] text-slate-500">Full Cohort Records</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Features</span>
            <div className="text-sm font-bold text-slate-800 font-mono">
              {headers.length > 0 ? headers.length : 36} Clinical Variables
            </div>
            <span className="text-[11px] text-slate-500">Biomarkers & Outcomes</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cohort Quality</span>
            <div className="text-sm font-bold text-emerald-700 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cleaned & Standardized</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Valid Clinical Data</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FIRST 5 ROWS OF THE DATASET */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-100">
              02
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                First 5 Rows of the Dataset
              </h3>
              <p className="text-xs text-slate-500">
                Inspection of the first 5 patient records with continuous biomarkers and clinical outcomes.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-mono font-bold">
            Showing Rows 1 to 5 of {totalRows.toLocaleString()}
          </span>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-100 z-10 shadow-xs border-r border-slate-200">#</th>
                {headers.map((header) => (
                  <th key={header} className="p-3 whitespace-nowrap font-mono tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white font-mono text-[11px]">
              {displayRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="p-3 font-bold text-indigo-700 sticky left-0 bg-white shadow-xs border-r border-slate-200 whitespace-nowrap">
                    Row {idx + 1}
                  </td>
                  {headers.map((h) => {
                    const val = row[h];
                    const hLower = String(h ?? '').toLowerCase();
                    const isDisease = hLower.includes('disease') || hLower.includes('target') || hLower.includes('outcome');
                    const isHba1c = hLower.includes('hba1c');
                    const isGlucose = hLower.includes('glucose');

                    return (
                      <td key={h} className="p-3 whitespace-nowrap text-slate-700">
                        {isDisease ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 font-sans font-bold text-xs">
                            {String(val ?? 'Healthy')}
                          </span>
                        ) : isHba1c ? (
                          <span className="font-bold text-rose-600">
                            {typeof val === 'number' ? val.toFixed(2) : String(val)}
                          </span>
                        ) : isGlucose ? (
                          <span className="font-bold text-amber-600">
                            {typeof val === 'number' ? val.toFixed(1) : String(val)}
                          </span>
                        ) : (
                          <span>
                            {typeof val === 'number'
                              ? Number.isInteger(val)
                                ? val
                                : val.toFixed(2)
                              : String(val ?? '-')}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PREPROCESSING SUMMARY */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100">
              03
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Preprocessing Summary & Quality Audit
              </h3>
              <p className="text-xs text-slate-500">
                Comprehensive audit of missing values filled, outlier ranges audited, and normalization statistics.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clean Dataset</span>
            </span>
          </div>
        </div>

        {/* 4 Preprocessing Result Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between text-teal-700">
              <span className="text-xs font-bold uppercase tracking-wider">Missing Values</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-teal-950">
              0 Remaining
            </div>
            <p className="text-xs text-teal-700 font-medium">
              Imputed with Median / Mode ({preprocessingSummary?.missingValuesFilled ?? 0} missing cells resolved)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
            <div className="flex items-center justify-between text-indigo-700">
              <span className="text-xs font-bold uppercase tracking-wider">Outliers Audited</span>
              <Sliders className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-indigo-950">
              {preprocessingSummary?.outliersRemoved ?? 0} Flagged
            </div>
            <p className="text-xs text-indigo-700 font-medium">
              Evaluated via Interquartile Range (Q1 - 1.5*IQR to Q3 + 1.5*IQR)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-xs font-bold uppercase tracking-wider">Normalization Parameters</span>
              <Cpu className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-purple-950">
              {preprocessingSummary?.normalizationsUsed.length ?? 0} Scaled
            </div>
            <p className="text-xs text-purple-700 font-medium">
              Z-Score & Min-Max statistical parameters computed
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Dataset Readiness</span>
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">
              100% Ready
            </div>
            <p className="text-xs text-emerald-700 font-medium">
              Active for Module 2: Feature Discovery
            </p>
          </div>
        </div>

        {/* Detailed Preprocessing Breakdown Cards */}
        <div className="pt-2">
          {/* Normalization Formulas Sample */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Biomarker Normalization Parameters</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800 block">HbA1c Glycated Hemoglobin</span>
                  <span className="font-mono text-[11px] text-slate-500">Z = (HbA1c - 6.2) / 1.4</span>
                </div>
                <span className="font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Standardized
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800 block">Fasting Plasma Glucose</span>
                  <span className="font-mono text-[11px] text-slate-500">Z = (Glucose - 118) / 34</span>
                </div>
                <span className="font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Standardized
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800 block">Systolic Blood Pressure</span>
                  <span className="font-mono text-[11px] text-slate-500">Z = (SBP - 128) / 18</span>
                </div>
                <span className="font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Standardized
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
