import sys
sys.path.insert(0, 'python_engine')
from interaction_engine import ClinicalInteractionDiscoveryEngine
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd
import json

# Reproduce test_df from interaction_engine.py
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
egfr = (140 - age * 0.8 - creatinine * 25 + np.random.normal(0, 5, n)).clip(15, 125)
alt = np.random.normal(25, 12, n).clip(8, 90)
ast = np.random.normal(24, 10, n).clip(10, 85)

p_dm = 1.0 / (1.0 + np.exp(-(0.06 * (fasting_glucose - 110) + 1.1 * (hba1c - 6.0) + 0.05 * (bmi - 27))))
diabetes = np.random.binomial(1, p_dm)
p_hd = 1.0 / (1.0 + np.exp(-(0.04 * (sbp - 130) + 0.03 * (ldl - 130) + 0.04 * (age - 55) - 0.03 * (hdl - 45))))
heart_disease = np.random.binomial(1, p_hd)
p_ckd = 1.0 / (1.0 + np.exp(-(1.8 * (creatinine - 1.3) - 0.05 * (egfr - 60) + 0.04 * (bun - 20))))
ckd = np.random.binomial(1, p_ckd)

test_df = pd.DataFrame({
    'Age': age, 'Sex': sex, 'BMI': bmi, 'Weight': weight, 'Waist_Circumference': waist,
    'Systolic_BP': sbp, 'Diastolic_BP': dbp, 'Pulse': pulse, 'HDL': hdl, 'LDL': ldl,
    'Total_Cholesterol': total_chol, 'Triglycerides': trig, 'HbA1c': hba1c,
    'Fasting_Glucose': fasting_glucose, 'Serum_Creatinine': creatinine, 'BUN': bun,
    'eGFR': egfr, 'ALT': alt, 'AST': ast,
    'Diabetes': diabetes, 'HeartDisease': heart_disease, 'CKD': ckd
})

engine = ClinicalInteractionDiscoveryEngine(imputation_method='median', n_splits=5)
X, Y_dict = engine.preprocess_dataset(test_df)
X_train, X_val, Y_train, Y_val = {}, {}, {}, {}
for tgt in ['Diabetes', 'HeartDisease', 'CKD']:
    xt, xv, yt, yv = train_test_split(X, Y_dict[tgt], test_size=0.20, random_state=42)
    X_train[tgt], X_val[tgt], Y_train[tgt], Y_val[tgt] = xt, xv, yt, yv

existing = json.load(open('all_interactions_513.json'))
print('Total existing records:', len(existing))

pairs_list = [(ex['feature_1'], ex['feature_2']) for ex in existing if ex['disease'] == 'Diabetes']
unique_pairs = list(set(pairs_list))
print('Unique candidate pairs:', len(unique_pairs))

additive_aucs = {}
for tgt in ['Diabetes', 'HeartDisease', 'CKD']:
    print(f'Computing additive models for {tgt}...')
    g = engine.compute_incremental_predictive_gains(X_train[tgt], {tgt: Y_train[tgt]}, unique_pairs)
    additive_aucs[tgt] = g[tgt]

print('Computed all additive models successfully.')
# Let us inspect the enriched metrics for Age x Systolic_BP and HbA1c x Fasting_Glucose
for tgt in ['HeartDisease', 'Diabetes']:
    pair = ('Age', 'Systolic_BP') if tgt == 'HeartDisease' else ('HbA1c', 'Fasting_Glucose')
    res = additive_aucs[tgt][pair]
    print(f"\n{pair} on {tgt}:")
    print(f"  AUC_A: {res['auc_a']:.6f}")
    print(f"  AUC_B: {res['auc_b']:.6f}")
    print(f"  Individual_Baseline: {res['individual_baseline_auc']:.6f}")
    print(f"  AUC_Additive: {res['auc_additive']:.6f}")
    print(f"  AUC_Interaction: {res['auc_interaction']:.6f}")
    print(f"  Pair_Gain: {res['pair_gain']:.6f}")
    print(f"  Interaction_Synergy: {res['interaction_synergy']:.6f}")
    print(f"  IPG: {res['ipg']:.6f}")
