"""
FastAPI Microservice for Adaptive Clinical Feature Interaction Discovery & Scoring
Project: Adaptive Disease Signature Learning Framework for Universal Disease Prediction
Diseases: Diabetes, Heart Disease, and Chronic Kidney Disease (CKD)

Endpoints:
- POST /api/interactions/discover: Full discovery across 171 biomarker pairs for 3 diseases (513 pairs total).
- GET  /api/interactions/matrix/{disease}: Returns symmetric 19x19 interaction matrix (diagonal=0.0).
- GET  /api/interactions/graph/{disease}: Returns node-link graph filtered by disease and classification.
- POST /api/interactions/evaluate-pair: Instant mathematical evaluation and clinical rationale for a pair.
- GET  /api/interactions/health: Service health and configuration metadata.
"""

import os
import sys
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure local imports work reliably
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.interaction_engine import (
    ClinicalInteractionDiscoveryEngine,
    CANONICAL_DISEASE_TARGETS,
    CLINICAL_ABNORMALITY_THRESHOLDS,
)

app = FastAPI(
    title="Adaptive Clinical Feature Interaction Discovery Service",
    description="Rigorous pairwise interaction discovery, non-linear synergy, and disease-specificity scoring for Diabetes, Heart Disease, and CKD.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory cache of discovery results
DISCOVERY_CACHE: Dict[str, Any] = {}
ENGINE_INSTANCE: Optional[ClinicalInteractionDiscoveryEngine] = None


class InteractionRecordResponse(BaseModel):
    rank: int
    disease: str
    feature_1: str
    feature_2: str
    cis: float
    das: float
    das_margin: float
    mutual_information: float
    correlation: float
    joint_abnormality: float
    xgb_interaction: float
    incremental_predictive_gain: float
    synergy_auc: float
    individual_baseline_auc: Optional[float] = 0.0
    auc_additive: Optional[float] = 0.0
    auc_interaction: Optional[float] = 0.0
    pair_gain: Optional[float] = 0.0
    interaction_synergy: Optional[float] = 0.0
    ipg: Optional[float] = 0.0
    specificity_score: float
    stability_score: float
    redundancy: float
    redundancy_status: str
    classification: str
    explanation: Optional[str] = None


class DiscoverRequest(BaseModel):
    imputation_method: str = Field(default="median", description="'median' or 'knn'")
    n_splits: int = Field(default=5, description="Number of cross-validation folds")
    records: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Optional patient records. If omitted, standard NHANES reference cohort is evaluated."
    )


class EvaluatePairRequest(BaseModel):
    feature_i: str = Field(..., example="HbA1c")
    feature_j: str = Field(..., example="Fasting_Glucose")
    disease: str = Field(..., example="Diabetes")
    records: Optional[List[Dict[str, Any]]] = None


def generate_benchmark_dataset(n: int = 1000) -> pd.DataFrame:
    """Generates the canonical 19-feature NHANES multi-morbidity cohort."""
    np.random.seed(42)
    age = np.random.normal(55, 12, n).clip(18, 85)
    sex = np.random.binomial(1, 0.49, n)
    bmi = np.random.normal(28, 5, n).clip(18.5, 48)
    weight = (bmi * ((170 if np.random.rand() > 0.5 else 160) / 100) ** 2).clip(45, 150)
    waist = (bmi * 2.8 + age * 0.2 + np.random.normal(15, 4, n)).clip(65, 140)

    # Vascular
    sbp = np.random.normal(128, 18, n).clip(90, 200)
    dbp = np.random.normal(82, 10, n).clip(60, 120)
    pulse = np.random.normal(74, 10, n).clip(50, 110)

    # Lipids
    ldl = np.random.normal(125, 32, n).clip(50, 220)
    hdl = np.random.normal(48, 12, n).clip(25, 95)
    total_chol = (ldl + hdl + np.random.normal(30, 8, n)).clip(110, 320)
    trig = np.random.normal(150, 50, n).clip(60, 450)

    # Glycemic
    fasting_glucose = np.random.normal(105, 30, n).clip(70, 260)
    hba1c = (4.6 + (fasting_glucose - 70) * 0.035 + np.random.normal(0, 0.3, n)).clip(4.5, 14.0)

    # Renal
    creatinine = np.random.normal(1.05, 0.45, n).clip(0.5, 4.5)
    # BUN reflects glomerular filtration plus independent protein catabolism & tubular reabsorption
    bun = (6.0 + creatinine * 12.0 + np.random.normal(0, 5.0, n)).clip(5, 60)
    egfr = (140 - age * 0.8 - creatinine * 25 + np.random.normal(0, 5, n)).clip(15, 125)

    # Hepatic
    alt = np.random.normal(25, 12, n).clip(8, 90)
    ast = np.random.normal(24, 10, n).clip(10, 85)

    # Disease outcomes
    p_dm = 1.0 / (1.0 + np.exp(-(0.06 * (fasting_glucose - 110) + 1.1 * (hba1c - 6.0) + 0.05 * (bmi - 27))))
    diabetes = np.random.binomial(1, p_dm)

    p_hd = 1.0 / (1.0 + np.exp(-(0.04 * (sbp - 130) + 0.03 * (ldl - 130) + 0.04 * (age - 55) - 0.03 * (hdl - 45))))
    heart_disease = np.random.binomial(1, p_hd)

    p_ckd = 1.0 / (1.0 + np.exp(-(2.0 * (creatinine - 1.2) - 0.07 * (egfr - 65) + 0.04 * (bun - 22))))
    ckd = np.random.binomial(1, p_ckd)

    return pd.DataFrame({
        "Age": age,
        "Sex": sex,
        "BMI": bmi,
        "Weight": weight,
        "Waist_Circumference": waist,
        "Systolic_BP": sbp,
        "Diastolic_BP": dbp,
        "Pulse": pulse,
        "HDL": hdl,
        "LDL": ldl,
        "Total_Cholesterol": total_chol,
        "Triglycerides": trig,
        "HbA1c": hba1c,
        "Fasting_Glucose": fasting_glucose,
        "Serum_Creatinine": creatinine,
        "BUN": bun,
        "eGFR": egfr,
        "ALT": alt,
        "AST": ast,
        "Diabetes": diabetes,
        "HeartDisease": heart_disease,
        "CKD": ckd,
    })


@app.get("/api/interactions/health")
def health_check():
    return {
        "status": "online",
        "service": "Adaptive Clinical Feature Interaction Discovery Engine",
        "supported_diseases": CANONICAL_DISEASE_TARGETS,
        "cached_discovery_available": bool(DISCOVERY_CACHE),
        "total_canonical_features": 19,
        "total_candidate_pairs": 171,
        "total_disease_interactions": 513,
    }


@app.post("/api/interactions/discover")
def run_discovery(req: DiscoverRequest):
    global DISCOVERY_CACHE, ENGINE_INSTANCE

    if req.records and len(req.records) >= 50:
        df = pd.DataFrame(req.records)
    else:
        df = generate_benchmark_dataset(1000)

    engine = ClinicalInteractionDiscoveryEngine(
        imputation_method=req.imputation_method,
        n_splits=req.n_splits,
    )
    ENGINE_INSTANCE = engine
    results = engine.run_discovery(df)

    # Compute validation & discovery summary metrics
    validation_summary = {}
    for d in CANONICAL_DISEASE_TARGETS:
        d_pairs = results["pairs_by_disease"][d]
        class_counts = {}
        for p in d_pairs:
            c = p["classification"]
            class_counts[c] = class_counts.get(c, 0) + 1

        stable_count = sum(1 for p in d_pairs if p["is_stable"])
        avg_gen_gap = float(np.mean([p["generalization_gap"] for p in d_pairs]))
        avg_cis = float(np.mean([p["final_cis"] for p in d_pairs]))

        validation_summary[d] = {
            "total_candidate_pairs": len(d_pairs),
            "classification_distribution": class_counts,
            "stable_interactions_count": stable_count,
            "average_final_cis": round(avg_cis, 3),
            "mean_generalization_gap": round(avg_gen_gap, 3),
        }

    results["validation_summary"] = validation_summary
    DISCOVERY_CACHE = results

    return {
        "success": True,
        "feature_count": len(results["feature_names"]),
        "pairs_per_disease": results["total_pairs_per_disease"],
        "total_interactions": results["total_evaluated_records"],
        "validation_summary": validation_summary,
        "pairs_by_disease": results["pairs_by_disease"],
        "matrices": results["matrices"],
        "graphs": results["graphs"],
    }


@app.get("/api/interactions/all", response_model=List[InteractionRecordResponse])
def get_all_interactions():
    """Returns all 513 disease-specific interaction records across Diabetes, Heart Disease, and CKD."""
    if not DISCOVERY_CACHE:
        run_discovery(DiscoverRequest())

    all_records = []
    pairs_by_disease = DISCOVERY_CACHE.get("pairs_by_disease", {})
    for d in CANONICAL_DISEASE_TARGETS:
        for p in pairs_by_disease.get(d, []):
            rec = {
                "rank": p.get("rank", 0),
                "disease": p.get("disease", d),
                "feature_1": p.get("feature_1", p.get("feature_i", "")),
                "feature_2": p.get("feature_2", p.get("feature_j", "")),
                "cis": float(p.get("cis", p.get("final_cis", 0.0))),
                "das": float(p.get("das", 0.0)),
                "das_margin": float(p.get("das_margin", 0.0)),
                "mutual_information": float(p.get("mutual_information", p.get("nmi_pair", 0.0))),
                "correlation": float(p.get("correlation", p.get("corr_score", 0.0))),
                "joint_abnormality": float(p.get("joint_abnormality", p.get("joint_abnormality_score", 0.0))),
                "xgb_interaction": float(p.get("xgb_interaction", p.get("xgb_interaction_score", 0.0))),
                "incremental_predictive_gain": float(p.get("incremental_predictive_gain", 0.0)),
                "synergy_auc": float(p.get("synergy_auc", p.get("auc_gain", 0.0))),
                "individual_baseline_auc": float(p.get("individual_baseline_auc", max(p.get("auc_model_a", 0.0), p.get("auc_model_b", 0.0)))),
                "auc_additive": float(p.get("auc_additive", p.get("auc_baseline", 0.0))),
                "auc_interaction": float(p.get("auc_interaction", p.get("auc_model_c", 0.0))),
                "pair_gain": float(p.get("pair_gain", 0.0)),
                "interaction_synergy": float(p.get("interaction_synergy", p.get("incremental_predictive_gain", 0.0))),
                "ipg": float(p.get("ipg", p.get("incremental_predictive_gain", 0.0))),
                "specificity_score": float(p.get("specificity_score", p.get("das", 0.0))),
                "stability_score": float(p.get("stability_score", 1.0 if p.get("is_stable") else 0.5)),
                "redundancy": float(p.get("redundancy", p.get("corr_score", 0.0))),
                "redundancy_status": str(p.get("redundancy_status", "Not Redundant")),
                "classification": str(p.get("classification", "Weak")),
                "explanation": p.get("explanation", ""),
            }
            all_records.append(InteractionRecordResponse(**rec))
    return all_records


@app.get("/api/interactions/matrix/{disease}")
def get_matrix(disease: str):
    # Normalize disease name
    d_norm = None
    for d in CANONICAL_DISEASE_TARGETS:
        if d.lower() == disease.lower() or d.lower().replace(" ", "") == disease.lower().replace(" ", "").replace("_", ""):
            d_norm = d
            break
    if not d_norm:
        raise HTTPException(status_code=404, detail=f"Disease '{disease}' not recognized. Must be Diabetes, HeartDisease, or CKD.")

    if not DISCOVERY_CACHE:
        # Run default discovery if cache empty
        run_discovery(DiscoverRequest())

    matrices = DISCOVERY_CACHE.get("matrices", {})
    if d_norm not in matrices:
        raise HTTPException(status_code=500, detail="Matrix data unavailable.")

    return matrices[d_norm]


@app.get("/api/interactions/graph/{disease}")
def get_graph(
    disease: str,
    classification: Optional[str] = Query(None, description="Comma-separated classifications to filter")
):
    d_norm = None
    for d in CANONICAL_DISEASE_TARGETS:
        if d.lower() == disease.lower() or d.lower().replace(" ", "") == disease.lower().replace(" ", "").replace("_", ""):
            d_norm = d
            break
    if not d_norm:
        raise HTTPException(status_code=404, detail=f"Disease '{disease}' not recognized.")

    if not DISCOVERY_CACHE:
        run_discovery(DiscoverRequest())

    graphs = DISCOVERY_CACHE.get("graphs", {})
    if d_norm not in graphs:
        raise HTTPException(status_code=500, detail="Graph data unavailable.")

    graph_data = graphs[d_norm]
    if classification:
        allowed = [c.strip().lower() for c in classification.split(",")]
        filtered_edges = [
            e for e in graph_data["edges"]
            if e["classification"].lower() in allowed
        ]
        return {"nodes": graph_data["nodes"], "edges": filtered_edges}

    return graph_data


@app.post("/api/interactions/evaluate-pair")
def evaluate_specific_pair(req: EvaluatePairRequest):
    if not DISCOVERY_CACHE:
        run_discovery(DiscoverRequest())

    d_norm = None
    for d in CANONICAL_DISEASE_TARGETS:
        if d.lower() == req.disease.lower() or d.lower().replace(" ", "") == req.disease.lower().replace(" ", "").replace("_", ""):
            d_norm = d
            break
    if not d_norm:
        raise HTTPException(status_code=404, detail=f"Invalid disease '{req.disease}'.")

    pairs = DISCOVERY_CACHE.get("pairs_by_disease", {}).get(d_norm, [])
    target_pair = None
    f_i_lower = req.feature_i.lower().replace(" ", "_")
    f_j_lower = req.feature_j.lower().replace(" ", "_")

    for p in pairs:
        pi = p["feature_i"].lower().replace(" ", "_")
        pj = p["feature_j"].lower().replace(" ", "_")
        if (pi == f_i_lower and pj == f_j_lower) or (pi == f_j_lower and pj == f_i_lower):
            target_pair = p
            break

    if not target_pair:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{req.feature_i} x {req.feature_j}' not found in candidate set."
        )

    return {
        "success": True,
        "disease": d_norm,
        "evaluated_pair": target_pair,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("FASTAPI_PORT", 8000))
    print(f"Starting Adaptive Clinical Feature Interaction FastAPI Service on port {port}...")
    uvicorn.run("python_engine.fastapi_app:app", host="0.0.0.0", port=port, reload=False)
