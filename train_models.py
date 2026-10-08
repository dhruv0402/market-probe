
import os
import sys

def _get_project_root():
    curr = os.path.dirname(os.path.abspath(__file__))
    while curr != "/" and curr != os.path.dirname(curr):
        if os.path.exists(os.path.join(curr, "data", "marketprobe.db")) or os.path.exists(os.path.join(curr, "requirements.txt")):
            return curr
        curr = os.path.dirname(curr)
    return os.path.expanduser("~/marketprobe")

PROJECT_ROOT = _get_project_root()

import sqlite3
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import xgboost as xgb
import lightgbm as lgb
import shap

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
conn = sqlite3.connect(DB_PATH)

# 1. Load labeled recommendations & join with creator metadata
df = pd.read_sql('''
    SELECT 
        r.id,
        r.action,
        r.entry_price,
        r.target_price,
        r.stoploss_price,
        r.raw_quote,
        r.confidence_score,
        r.is_sponsored_flag,
        r.outcome_status,
        r.actual_peak_return_pct,
        i.approx_subscribers,
        i.is_sebi_registered
    FROM recommendations r
    LEFT JOIN influencers i ON r.influencer_id = i.id
    WHERE r.outcome_status IN ('HIT', 'MISS')
''', conn)
conn.close()

print(f"📊 Total labeled samples for ML training: {len(df)}")

# 2. Feature Engineering
# Target variable: 1 = HIT (Profitable call), 0 = MISS (Loss / Stoploss triggered)
df['target'] = (df['outcome_status'] == 'HIT').astype(int)

# Linguistic & Text Features
df['quote_len'] = df['raw_quote'].astype(str).str.len()
df['has_buy_word'] = df['raw_quote'].astype(str).str.lower().apply(lambda x: 1 if 'buy' in x or 'khareed' in x else 0)
df['has_multibagger_hype'] = df['raw_quote'].astype(str).str.lower().apply(lambda x: 1 if any(w in x for w in ['100x', 'guarantee', 'multibagger', 'rocket', 'pakka']) else 0)

# Risk-Reward Numerical Features
df['entry_price'] = pd.to_numeric(df['entry_price'], errors='coerce').fillna(100.0)
df['target_price'] = pd.to_numeric(df['target_price'], errors='coerce').fillna(df['entry_price'] * 1.08)
df['stoploss_price'] = pd.to_numeric(df['stoploss_price'], errors='coerce').fillna(df['entry_price'] * 0.95)

df['reward_pct'] = (df['target_price'] - df['entry_price']) / (df['entry_price'] + 1e-5) * 100
df['risk_pct'] = (df['entry_price'] - df['stoploss_price']) / (df['entry_price'] + 1e-5) * 100
df['risk_reward_ratio'] = df['reward_pct'] / (df['risk_pct'].abs() + 1e-5)

# Creator & Sponsorship Features
df['subscribers'] = pd.to_numeric(df['approx_subscribers'], errors='coerce').fillna(1000000)
df['is_sebi'] = df['is_sebi_registered'].fillna(0).astype(int)
df['is_sponsored'] = df['is_sponsored_flag'].fillna(0).astype(int)
df['confidence'] = pd.to_numeric(df['confidence_score'], errors='coerce').fillna(0.85)

FEATURE_COLS = [
    'reward_pct',
    'risk_pct',
    'risk_reward_ratio',
    'subscribers',
    'is_sebi',
    'is_sponsored',
    'confidence',
    'quote_len',
    'has_buy_word',
    'has_multibagger_hype'
]

X = df[FEATURE_COLS]
y = df['target']

# 3. Train / Test Split (80/20)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

print(f"Training set: {X_train.shape[0]} samples | Testing set: {X_test.shape[0]} samples")

# 4. Train Models
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
    "LightGBM": lgb.LGBMClassifier(n_estimators=100, random_state=42, verbose=-1),
    "XGBoost": xgb.XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=42)
}

results = []

for name, clf in models.items():
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    probs = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else preds
    
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    auc = roc_auc_score(y_test, probs) if len(np.unique(y_test)) > 1 else 0.5
    
    results.append({
        "Model": name,
        "Accuracy": round(acc * 100, 2),
        "Precision": round(prec * 100, 2),
        "Recall": round(rec * 100, 2),
        "F1-Score": round(f1 * 100, 2),
        "ROC-AUC": round(auc, 4)
    })

print("\n========================================================")
print("🏆 MACHINE LEARNING MODEL BENCHMARK COMPARISON")
print("========================================================")
res_df = pd.DataFrame(results).sort_values(by="ROC-AUC", ascending=False)
print(res_df.to_string(index=False))

# 5. SHAP Feature Importance on Top Model (XGBoost)
xgb_model = models["XGBoost"]
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test)

feature_importances = pd.DataFrame({
    'Feature': FEATURE_COLS,
    'Importance': np.abs(shap_values).mean(axis=0)
}).sort_values(by='Importance', ascending=False)

print("\n========================================================")
print("🔬 SHAP FEATURE IMPORTANCE ANALYSIS (Scientific Ablation)")
print("========================================================")
print(feature_importances.to_string(index=False))

# 6. Save Model to Disk for the Live API
import pickle
model_path = os.environ.get("MARKETPROBE_MODEL_PATH", os.path.join(PROJECT_ROOT, "data", "xgb_model.pkl"))
with open(model_path, "wb") as f:
    pickle.dump({"model": xgb_model, "features": FEATURE_COLS}, f)
print(f"\n✅ Production XGBoost Model successfully serialized to: {model_path}")
