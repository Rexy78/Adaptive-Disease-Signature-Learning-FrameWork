import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sklearn.feature_selection import mutual_info_classif
from scipy import stats

# 1. Load or generate master dataset identical to defaultDataset.ts / NHANES cohort
def get_master_data():
    np.random.seed(42)
    count = 9254
    # Replicate generateMasterDataset logic
    # Or load if file exists
    r = np.random.RandomState(42)
    
    # Generate synthetic NHANES cohort
    age = np.round(18 + r.uniform(0, 1, count) * 62)
    is_male = r.uniform(0, 1, count) > 0.49
    sex = np.where(is_male, 1, 0)
    
    r_bmi = r.uniform(0, 1, count)
    r_age_flag = np.where(r.uniform(0, 1, count) > 0.6, 2.5, 0)
    bmi = np.round((18.5 + r_bmi * 18.5 + r_age_flag) * 10) / 10.0
    height_cm = np.where(is_male, np.round(165 + r.uniform(0, 1, count) * 22), np.round(152 + r.uniform(0, 1, count) * 18))
    weight = np.round((bmi * (height_cm / 100.0)**2) * 10) / 10.0
    waist = np.round(np.where(is_male, 76, 70) + bmi * 1.05 + r.uniform(0, 1, count) * 8)
    
    adiposity_factor = np.maximum(0, (bmi - 25) / 15.0)
    r_gly = r.uniform(0, 1, count)
    gly_spike = np.where(r_gly > 0.85, 45, 0)
    fasting_glucose = np.round(75 + adiposity_factor * 35 + r_gly * 45 + gly_spike)
    hba1c = np.round((4.6 + (fasting_glucose - 75) * 0.038 + r.uniform(0, 1, count) * 0.6) * 10) / 10.0
    
    r_bp = r.uniform(0, 1, count)
    bp_spike = np.where(r_bp > 0.88, 20, 0)
    sys_bp = np.round(102 + (age - 18) * 0.35 + np.where(bmi > 28, 10, 0) + r_bp * 32 + bp_spike)
    dia_bp = np.round(64 + np.where(age < 55, (age - 18) * 0.2, 7) + np.where(bmi > 28, 5, 0) + r.uniform(0, 1, count) * 20)
    pulse = np.round(58 + np.where(bmi > 30, 6, 0) + r.uniform(0, 1, count) * 30)
    
    r_lip = r.uniform(0, 1, count)
    lip_spike = np.where(r_lip > 0.82, 35, 0)
    ldl = np.round(75 + r_lip * 75 + lip_spike + np.where(age > 50, 10, 0))
    r_trig = r.uniform(0, 1, count)
    trig_spike = np.where(r_trig > 0.85, 80, 0)
    triglycerides = np.round(75 + adiposity_factor * 55 + r_trig * 95 + trig_spike)
    hdl = np.round(np.maximum(25, np.where(is_male, 50, 58) - adiposity_factor * 10 - np.where(triglycerides > 150, 8, 0) + (r.uniform(0, 1, count) - 0.5) * 20))
    total_chol = np.round(ldl + hdl + triglycerides * 0.2)
    
    r_renal = r.uniform(0, 1, count)
    renal_risk = np.where(sys_bp > 140, 0.25, 0) + np.where(hba1c >= 6.5, 0.25, 0) + np.where(age > 60, 0.20, 0) + r_renal * 0.5
    has_renal_impairment = renal_risk > 0.65
    
    creatinine = np.where(is_male,
        np.where(has_renal_impairment, np.round((1.5 + r_renal * 2.2) * 100) / 100, np.round((0.75 + r_renal * 0.40) * 100) / 100),
        np.where(has_renal_impairment, np.round((1.3 + r_renal * 2.0) * 100) / 100, np.round((0.60 + r_renal * 0.35) * 100) / 100)
    )
    
    k = np.where(is_male, 0.9, 0.7)
    alpha = np.where(is_male, -0.302, -0.241)
    egfr = np.round(np.maximum(12, np.minimum(130, 142 * ((np.minimum(creatinine / k, 1))**alpha) * ((np.maximum(creatinine / k, 1))**(-1.2)) * (0.9938**age) * np.where(is_male, 1.0, 1.012))))
    
    r_bun = r.uniform(0, 1, count)
    bun = np.round(np.where(egfr < 60, 22 + (60 - egfr) * 0.55, 11 + r_bun * 8) + (r_bun - 0.5) * 4)
    bun = np.clip(bun, 7, 95)
    
    alt = np.round(14 + np.where(bmi > 30, 10, 0) + r.uniform(0, 1, count) * 28)
    ast = np.round(15 + np.where(bmi > 30, 6, 0) + r.uniform(0, 1, count) * 25)
    
    # Outcomes
    has_prior_dm = (hba1c >= 6.2) & (fasting_glucose >= 115) & (r_gly > 0.6)
    diabetes = np.where((hba1c >= 6.5) | (fasting_glucose >= 126) | has_prior_dm, 1, 0)
    
    has_ckd_dmg = (creatinine >= 1.5) | (egfr < 60) | ((egfr < 65) & (bun >= 22) & (r_renal > 0.5))
    ckd = np.where((egfr < 60) | (creatinine >= 1.5) | has_ckd_dmg, 1, 0)
    
    r_cvd = r.uniform(0, 1, count)
    cvd_score = (
        np.where(age > 55, 0.25, 0.08) +
        np.where(sys_bp >= 140, 0.28, np.where(sys_bp >= 130, 0.15, 0)) +
        np.where(ldl >= 140, 0.25, np.where(ldl >= 120, 0.12, 0)) +
        np.where(hdl < 40, 0.18, 0) +
        np.where(pulse >= 80, 0.10, 0) +
        np.where(diabetes == 1, 0.18, 0)
    )
    heart_disease = np.where((cvd_score + r_cvd * 0.35) >= 0.65, 1, 0)
    
    df = pd.DataFrame({
        'Age': age,
        'Sex': sex,
        'BMI': bmi,
        'Weight': weight,
        'Waist_Circumference': waist,
        'Systolic_BP': sys_bp,
        'Diastolic_BP': dia_bp,
        'Pulse': pulse,
        'HDL': hdl,
        'LDL': ldl,
        'Total_Cholesterol': total_chol,
        'Triglycerides': triglycerides,
        'HbA1c': hba1c,
        'Fasting_Glucose': fasting_glucose,
        'Serum_Creatinine': creatinine,
        'BUN': bun,
        'eGFR': egfr,
        'ALT': alt,
        'AST': ast,
        'Diabetes': diabetes,
        'Heart_Disease': heart_disease,
        'CKD': ckd
    })
    return df

df = get_master_data()
features = [
    'Age', 'Sex', 'BMI', 'Weight', 'Waist_Circumference', 'Systolic_BP', 'Diastolic_BP',
    'Pulse', 'HDL', 'LDL', 'Total_Cholesterol', 'Triglycerides', 'HbA1c',
    'Fasting_Glucose', 'Serum_Creatinine', 'BUN', 'eGFR', 'ALT', 'AST'
]

diseases = {
    'Diabetes': 'Diabetes',
    'Heart Disease': 'Heart_Disease',
    'CKD': 'CKD'
}

print(f"Total samples: {len(df)}")
for d_name, d_col in diseases.items():
    print(f"Prevalence of {d_name}: {df[d_col].mean():.3f} ({df[d_col].sum()}/{len(df)})")

# Analyze each disease
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for d_name, d_col in diseases.items():
    print("\n" + "="*80)
    print(f"DISEASE HEAD: {d_name.upper()} ({d_col})")
    print("="*80)
    
    y = df[d_col].values
    X = df[features]
    
    # 1. Feature association, direction, value/range, contribution, stability
    results = []
    
    # Train full model for feature importances
    gbm = GradientBoostingClassifier(n_estimators=100, max_depth=3, random_state=42)
    gbm.fit(X, y)
    importances = gbm.feature_importances_
    
    # Cross-validation stability for each feature
    fold_imps = []
    fold_dirs = []
    for train_idx, val_idx in cv.split(X, y):
        X_tr, y_tr = X.iloc[train_idx], y[train_idx]
        fold_gbm = GradientBoostingClassifier(n_estimators=80, max_depth=3, random_state=42)
        fold_gbm.fit(X_tr, y_tr)
        fold_imps.append(fold_gbm.feature_importances_)
        
        # Check fold direction
        f_dirs = []
        for feat in features:
            mean_pos = X_tr.loc[y_tr == 1, feat].mean()
            mean_neg = X_tr.loc[y_tr == 0, feat].mean()
            f_dirs.append(1 if mean_pos > mean_neg else -1)
        fold_dirs.append(f_dirs)
        
    fold_imps = np.array(fold_imps) # (5, n_feats)
    fold_dirs = np.array(fold_dirs) # (5, n_feats)
    
    cv_stability = 1.0 - (np.std(fold_imps, axis=0) / (np.mean(fold_imps, axis=0) + 1e-5))
    cv_stability = np.clip(cv_stability, 0.1, 0.99)
    dir_stability = np.mean(fold_dirs == fold_dirs[0:1], axis=0) # fraction of folds agreeing on sign
    
    for idx, feat in enumerate(features):
        pos_vals = df.loc[y == 1, feat]
        neg_vals = df.loc[y == 0, feat]
        
        mu_pos = pos_vals.mean()
        mu_neg = neg_vals.mean()
        std_all = df[feat].std()
        
        delta_mu = mu_pos - mu_neg
        cohen_d = delta_mu / (std_all + 1e-6)
        
        # Pearson correlation with target
        corr, p_val = stats.pointbiserialr(df[feat], y)
        
        # Determine direction
        if abs(cohen_d) < 0.10 and abs(corr) < 0.05:
            direction = "No Clear Direction"
        elif cohen_d > 0.10:
            direction = "Higher values associated with disease"
        elif cohen_d < -0.10:
            direction = "Lower values associated with disease"
        else:
            direction = "Nonlinear / Ambiguous"
            
        # Informative range (empirical 25th-75th percentile of disease cohort, or threshold)
        q25_pos = np.percentile(pos_vals, 25)
        q75_pos = np.percentile(pos_vals, 75)
        median_pos = np.median(pos_vals)
        median_neg = np.median(neg_vals)
        
        if direction == "Higher values associated with disease":
            cutoff = np.percentile(neg_vals, 75)
            range_desc = f"Elevated (>= {cutoff:.1f}, disease median: {median_pos:.1f} vs control: {median_neg:.1f})"
        elif direction == "Lower values associated with disease":
            cutoff = np.percentile(neg_vals, 25)
            range_desc = f"Reduced (<= {cutoff:.1f}, disease median: {median_pos:.1f} vs control: {median_neg:.1f})"
        else:
            range_desc = f"Baseline / intermediate (disease median: {median_pos:.1f})"
            
        contrib = importances[idx]
        stab = (cv_stability[idx] + dir_stability[idx]) / 2.0
        
        results.append({
            'feature': feat,
            'direction': direction,
            'range': range_desc,
            'contribution': contrib,
            'importance': contrib,
            'correlation': corr,
            'cohen_d': cohen_d,
            'delta_mu': delta_mu,
            'stability': stab,
            'mu_pos': mu_pos,
            'mu_neg': mu_neg
        })
        
    # Sort by importance descending
    results.sort(key=lambda r: r['contribution'], reverse=True)
    
    print(f"\nTOP FEATURE SIGNALS FOR {d_name}:")
    for r in results[:7]:
        print(f"  * {r['feature']:<20} | Dir: {r['direction']:<36} | Contrib: {r['contribution']:.3f} | CV Stab: {r['stability']:.2f} | {r['range']}")

