import numpy as np
import pandas as pd
from python_engine.interaction_engine import ClinicalInteractionDiscoveryEngine, CANONICAL_DISEASE_TARGETS

np.random.seed(42)
n = 1000
age = np.random.normal(55, 12, n).clip(18, 85)
sex = np.random.binomial(1, 0.49, n)
bmi = np.random.normal(28, 5, n).clip(18.5, 48)
weight = (bmi * ((170 if np.random.rand() > 0.5 else 160) / 100)**2).clip(45, 150)
waist = (bmi * 2.8 + age * 0.2 + np.random.normal(15, 4, n)).clip(65, 140)
sbp = np.random.normal(128, 18, n).clip(90, 200)
dbp = np.random.normal(82, 10, n).clip(60, 120)
pulse = np.random.normal(74, 10, n).clip(50, 110)
ldl = np.random.normal(125, 32, n).clip(50, 220)
hdl = np.random.normal(48, 12, n).clip(25, 95)
total_chol = (ldl + hdl + np.random.normal(30, 8, n)).clip(110, 320)
trig = np.random.normal(150, 50, n).clip(60, 450)
fasting_glucose = np.random.normal(105, 30, n).clip(70, 260)
hba1c = (4.6 + (fasting_glucose - 70) * 0.035 + np.random.normal(0, 0.3, n)).clip(4.5, 14.0)
creatinine = np.random.normal(1.05, 0.45, n).clip(0.5, 4.5)
bun = (6.0 + creatinine * 12.0 + np.random.normal(0, 5.0, n)).clip(5, 60)
egfr = (140 - age * 0.8 - creatinine * 25 + np.random.normal(0, 0.3, n)).clip(15, 125)
alt = np.random.normal(25, 12, n).clip(8, 90)
ast = np.random.normal(24, 10, n).clip(10, 85)

# Synergistic interaction in synthetic data
p_dm = 1.0 / (1.0 + np.exp(-(0.06 * (fasting_glucose - 110) + 1.1 * (hba1c - 6.0) + 0.15 * (fasting_glucose - 110)*(hba1c - 6.0)/30 + 0.05 * (bmi - 27))))
diabetes = np.random.binomial(1, p_dm)

p_hd = 1.0 / (1.0 + np.exp(-(0.04 * (sbp - 130) + 0.03 * (ldl - 130) + 0.002 * (sbp - 130)*(ldl - 130) + 0.04 * (age - 55))))
heart_disease = np.random.binomial(1, p_hd)

p_ckd = 1.0 / (1.0 + np.exp(-(2.0 * (creatinine - 1.2) - 0.07 * (egfr - 65) + 0.05 * (creatinine - 1.2)*(bun - 22))))
ckd = np.random.binomial(1, p_ckd)

df = pd.DataFrame({
    "Age": age, "Sex": sex, "BMI": bmi, "Weight": weight, "Waist_Circumference": waist,
    "Systolic_BP": sbp, "Diastolic_BP": dbp, "Pulse": pulse, "HDL": hdl, "LDL": ldl,
    "Total_Cholesterol": total_chol, "Triglycerides": trig, "HbA1c": hba1c,
    "Fasting_Glucose": fasting_glucose, "Serum_Creatinine": creatinine, "BUN": bun,
    "eGFR": egfr, "ALT": alt, "AST": ast,
    "Diabetes": diabetes, "HeartDisease": heart_disease, "CKD": ckd
})

engine = ClinicalInteractionDiscoveryEngine(imputation_method="median", n_splits=5)
output = engine.run_discovery(df)
for d in CANONICAL_DISEASE_TARGETS:
    print(f"\nTarget: {d}")
    for p in output["pairs_by_disease"][d][:5]:
        print(f"  {p['rank']}. {p['feature_1']} x {p['feature_2']} -> CIS: {p['cis']}, IPG: {p['incremental_predictive_gain']}, SHAP: {p['xgb_interaction']}, Tier: {p['classification']}")
