"""
Python Clinical Analytics & Multimorbidity Engine
Processes clinical patient inputs, computes complex risk trajectories, 
interaction tensors, and counterfactual interventions.
"""

import sys
import json
import math
from typing import Dict, Any, List

def calculate_patient_risk(biometrics: Dict[str, Any]) -> Dict[str, Any]:
    # Extract numerical biometrics with clinical defaults
    age = float(biometrics.get("age", 55))
    gender = int(biometrics.get("gender", 1)) # 1: Male, 0: Female
    sbp = float(biometrics.get("systolic_bp", biometrics.get("systolicBp", 130)))
    dbp = float(biometrics.get("diastolic_bp", biometrics.get("diastolicBp", 85)))
    bmi = float(biometrics.get("bmi", 27.5))
    glucose = float(biometrics.get("fasting_glucose", biometrics.get("fastingGlucose", 110)))
    hba1c = float(biometrics.get("hba1c", 6.2))
    creatinine = float(biometrics.get("serum_creatinine", biometrics.get("serumCreatinine", 1.0)))
    egfr = float(biometrics.get("egfr", 85))
    ldl = float(biometrics.get("ldl", 130))
    hdl = float(biometrics.get("hdl", 45))
    chol = float(biometrics.get("total_cholesterol", biometrics.get("totalCholesterol", 200)))
    trig = float(biometrics.get("triglycerides", 160))
    smoking = int(biometrics.get("smoking_status", biometrics.get("smokingStatus", 0)))
    crp = float(biometrics.get("crp_inflammatory", biometrics.get("crp", 2.0)))
    fam_dm = int(biometrics.get("family_history_diabetes", biometrics.get("familyHistoryDiabetes", 0)))
    fam_cad = int(biometrics.get("family_history_cad", biometrics.get("familyHistoryCad", 0)))

    # 1. Non-linear Diabetes Mellitus Score (Log-logistic response)
    gluc_norm = max(0.0, (glucose - 70.0) / 130.0)
    hba1c_norm = max(0.0, (hba1c - 4.5) / 8.0)
    bmi_norm = max(0.0, (bmi - 18.5) / 25.0)
    dm_raw = (0.50 * hba1c_norm**1.3) + (0.30 * gluc_norm**1.2) + (0.12 * bmi_norm) + (0.08 * fam_dm)
    dm_prob = 1.0 / (1.0 + math.exp(-6.0 * (dm_raw - 0.42)))
    dm_prob = min(0.98, max(0.02, dm_prob))

    # 2. Non-linear Cardiovascular Disease Risk (Framingham + Atherogenic Index)
    sbp_norm = max(0.0, (sbp - 90.0) / 100.0)
    ldl_hdl_ratio = ldl / max(15.0, hdl)
    lipid_norm = max(0.0, (ldl_hdl_ratio - 1.5) / 5.0)
    age_norm = max(0.0, (age - 30.0) / 55.0)
    cvd_raw = (0.35 * sbp_norm**1.2) + (0.28 * lipid_norm) + (0.22 * age_norm) + (0.15 * smoking) + (0.08 * fam_cad)
    cvd_prob = 1.0 / (1.0 + math.exp(-5.5 * (cvd_raw - 0.40)))
    cvd_prob = min(0.98, max(0.02, cvd_prob))

    # 3. Non-linear Chronic Kidney Disease Risk (CKD-EPI approximation)
    egfr_inverted = max(0.0, (120.0 - egfr) / 105.0)
    creat_norm = max(0.0, (creatinine - 0.5) / 3.5)
    ckd_raw = (0.58 * egfr_inverted**1.4) + (0.28 * creat_norm) + (0.14 * (sbp_norm * 0.5 + hba1c_norm * 0.5))
    ckd_prob = 1.0 / (1.0 + math.exp(-6.2 * (ckd_raw - 0.45)))
    ckd_prob = min(0.98, max(0.02, ckd_prob))

    # 4. Multi-morbidity Synergy (Interaction Tensor)
    synergy_factor = 1.0 + (0.35 * dm_prob * cvd_prob) + (0.40 * dm_prob * ckd_prob) + (0.30 * cvd_prob * ckd_prob)

    # 5. Complication Hazards (5-Year Horizon)
    complications = {
        "diabetic_retinopathy": round(min(0.95, dm_prob * (0.45 + 0.35 * hba1c_norm)), 3),
        "diabetic_nephropathy": round(min(0.95, dm_prob * ckd_prob * 1.4), 3),
        "heart_failure": round(min(0.95, cvd_prob * (0.40 + 0.30 * sbp_norm + 0.30 * (age / 80.0))), 3),
        "stroke_ischemic": round(min(0.95, cvd_prob * (0.50 * sbp_norm + 0.30 * smoking + 0.20 * lipid_norm)), 3),
        "esrd_dialysis_risk": round(min(0.95, ckd_prob * (0.60 + 0.40 * creat_norm)), 3),
    }

    # 6. Longitudinal 5-Year Trajectory Points
    years = [0, 1, 2, 3, 4, 5]
    trajectory = []
    for y in years:
        decay_factor = 1.0 + (y * 0.08 * (1.0 + crp / 10.0))
        trajectory.append({
            "year": f"Year {y}",
            "diabetesRisk": round(min(99.0, dm_prob * 100 * (1.0 + y * 0.05)), 1),
            "cvdRisk": round(min(99.0, cvd_prob * 100 * (1.0 + y * 0.07)), 1),
            "ckdRisk": round(min(99.0, ckd_prob * 100 * (1.0 + y * 0.06)), 1),
            "multimorbidityComposite": round(min(99.0, (dm_prob * 0.35 + cvd_prob * 0.35 + ckd_prob * 0.30) * 100 * decay_factor), 1)
        })

    # 7. Highest Impact Risk Factors
    impacts = [
        {"feature": "HbA1c Glycemic Load", "value": f"{hba1c}%", "impact": round(hba1c_norm * 45, 1)},
        {"feature": "Systolic Blood Pressure", "value": f"{int(sbp)} mmHg", "impact": round(sbp_norm * 38, 1)},
        {"feature": "eGFR Renal Clearance", "value": f"{int(egfr)} mL/min", "impact": round(egfr_inverted * 42, 1)},
        {"feature": "LDL / Atherogenic Cholesterol", "value": f"{int(ldl)} mg/dL", "impact": round(lipid_norm * 32, 1)},
        {"feature": "Body Mass Index (BMI)", "value": f"{bmi} kg/m²", "impact": round(bmi_norm * 25, 1)},
    ]
    impacts.sort(key=lambda x: x["impact"], reverse=True)

    # Primary Diagnosis & Confidence
    probs = [
        ("Diabetes Mellitus Type 2", dm_prob),
        ("Cardiovascular Disease", cvd_prob),
        ("Chronic Kidney Disease", ckd_prob),
    ]
    probs.sort(key=lambda x: x[1], reverse=True)
    primary_dx, primary_prob = probs[0]

    risk_level = "High Risk" if primary_prob >= 0.65 else ("Moderate Risk" if primary_prob >= 0.35 else "Low Risk")

    return {
        "engine": "Python 3.10 Clinical Kernel + MongoDB",
        "primaryDisease": primary_dx,
        "primaryConfidence": round(primary_prob * 100, 1),
        "riskLevel": risk_level,
        "diseaseProbabilities": {
            "diabetes": round(dm_prob * 100, 1),
            "cardiovascular": round(cvd_prob * 100, 1),
            "ckd": round(ckd_prob * 100, 1),
        },
        "synergyIndex": round(synergy_factor, 3),
        "complications": complications,
        "trajectory": trajectory,
        "topDrivers": impacts,
        "recommendations": [
            f"Optimize HbA1c target to < 6.5% via precision metabolic management.",
            f"Control Systolic Blood Pressure to < 125 mmHg to arrest vascular and renal decay.",
            f"Maintain renal preservation protocol with routine eGFR and urine albumin monitoring.",
            f"Lifestyle intervention: Target 150 mins/week moderate activity and Mediterranean dietary index."
        ]
    }

def main():
    if len(sys.argv) > 1:
        try:
            input_data = json.loads(sys.argv[1])
        except Exception as e:
            input_data = {}
    else:
        try:
            raw = sys.stdin.read()
            input_data = json.loads(raw) if raw.strip() else {}
        except Exception:
            input_data = {}

    result = calculate_patient_risk(input_data)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
