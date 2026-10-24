import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import GradientBoostingClassifier

np.random.seed(42)
n = 1000
x1 = np.random.normal(0, 1, n)
x2 = np.random.normal(0, 1, n)
y = (0.5 * x1 + 0.5 * x2 + 0.8 * (x1 * x2) + np.random.normal(0, 1, n) > 0).astype(int)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Unscaled x_int with LogisticRegression
oof_base = np.zeros(n)
oof_int_unscaled = np.zeros(n)
oof_int_scaled = np.zeros(n)
oof_gb = np.zeros(n)

x_base = np.column_stack([x1, x2])
x_int_unscaled = np.column_stack([x1, x2, x1 * x2])
x12_scaled = StandardScaler().fit_transform((x1 * x2).reshape(-1, 1))
x_int_scaled = np.column_stack([x1, x2, x12_scaled])

for tr, val in skf.split(x_base, y):
    clf1 = LogisticRegression(C=1.0).fit(x_base[tr], y[tr])
    oof_base[val] = clf1.predict_proba(x_base[val])[:, 1]
    
    clf2 = LogisticRegression(C=1.0).fit(x_int_unscaled[tr], y[tr])
    oof_int_unscaled[val] = clf2.predict_proba(x_int_unscaled[val])[:, 1]

    clf3 = LogisticRegression(C=1.0).fit(x_int_scaled[tr], y[tr])
    oof_int_scaled[val] = clf3.predict_proba(x_int_scaled[val])[:, 1]

    clf4 = GradientBoostingClassifier(n_estimators=30, max_depth=3, random_state=42).fit(x_base[tr], y[tr])
    oof_gb[val] = clf4.predict_proba(x_base[val])[:, 1]

auc_base = roc_auc_score(y, oof_base)
auc_unscaled = roc_auc_score(y, oof_int_unscaled)
auc_scaled = roc_auc_score(y, oof_int_scaled)
auc_gb = roc_auc_score(y, oof_gb)

print(f"AUC Base (x1, x2): {auc_base:.4f}")
print(f"AUC Unscaled int:  {auc_unscaled:.4f}  (Gain: {auc_unscaled - auc_base:.4f})")
print(f"AUC Scaled int:    {auc_scaled:.4f}  (Gain: {auc_scaled - auc_base:.4f})")
print(f"AUC GBDT:          {auc_gb:.4f}  (Gain: {auc_gb - auc_base:.4f})")
