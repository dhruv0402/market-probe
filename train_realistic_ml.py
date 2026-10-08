
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
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import lightgbm as lgb
import shap

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
conn = sqlite3.connect(DB_PATH)

df = pd.read_sql('''
    SELECT 
        r.id,
        r.influencer_id,
        r.action,
        r.entry_price,
        r.target_price,
        r.stoploss_price,
        r.raw_quote,
        r.confidence_score,
        r.is_sponsored_flag,
        r.outcome_status,
        i.approx_subscribers,
        i.is_sebi_registered
    FROM recommendations r
    LEFT JOIN influencers i ON r.influencer_id = i.id
    WHERE r.outcome_status IN ('HIT', 'MISS')
''', conn)
conn.close()

# Target variable: 1 = HIT, 0 = MISS
df['target'] = (df['outcome_status'] == 'HIT').astype(int)

# 1. Historical Creator Track Record Prior (Bayesian Shrinkage)
creator_stats = df.groupby('influencer_id')['target'].agg(['mean', 'count']).reset_index()
creator_stats.columns = ['influencer_id', 'creator_raw_winrate', 'creator_call_count']
global_mean = df['target'].mean()
K = 5.0 # Bayesian smoothing constant
creator_stats['creator_historical_winrate'] = (
    (creator_stats['creator_call_count'] * creator_stats['creator_raw_winrate'] + K * global_mean) / 
    (creator_stats['creator_call_count'] + K)
)

df = df.merge(creator_stats[['influencer_id', 'creator_historical_winrate', 'creator_call_count']], on='influencer_id', how='left')

# Pre-Trade Features ONLY
df['quote_len'] = df['raw_quote'].astype(str).str.len()
df['has_buy_signal'] = df['raw_quote'].astype(str).str.lower().apply(lambda x: 1 if any(k in x for k in ['buy', 'khareed', 'breakout', 'long', 'accumulate']) else 0)
df['hype_language_score'] = df['raw_quote'].astype(str).str.lower().apply(lambda x: 1 if any(w in x for w in ['100x', 'guarantee', 'multibagger', 'rocket', 'pakka', 'target', 'jackpot']) else 0)
df['is_sebi'] = df['is_sebi_registered'].fillna(0).astype(int)
df['is_sponsored'] = df['is_sponsored_flag'].fillna(0).astype(int)
df['log_subscribers'] = np.log10(pd.to_numeric(df['approx_subscribers'], errors='coerce').fillna(500000) + 1)
df['linguistic_confidence'] = pd.to_numeric(df['confidence_score'], errors='coerce').fillna(0.85)

# Stated Intent Risk/Reward
entry = pd.to_numeric(df['entry_price'], errors='coerce').fillna(100.0)
target = pd.to_numeric(df['target_price'], errors='coerce').fillna(entry * 1.08)
stoploss = pd.to_numeric(df['stoploss_price'], errors='coerce').fillna(entry * 0.95)

df['stated_reward_pct'] = (target - entry) / (entry + 1e-5) * 100
df['stated_risk_pct'] = (entry - stoploss) / (entry + 1e-5) * 100
df['stated_rr_ratio'] = df['stated_reward_pct'] / (df['stated_risk_pct'].abs() + 1e-5)

# High Quality Technical Setup Flag
df['high_quality_setup'] = ((df['stated_rr_ratio'] >= 1.75) & (df['stated_risk_pct'] <= 4.5) & (df['creator_historical_winrate'] >= 0.42)).astype(int)

FEATURES = [
    'creator_historical_winrate',
    'creator_call_count',
    'high_quality_setup',
    'stated_reward_pct',
    'stated_risk_pct',
    'stated_rr_ratio',
    'log_subscribers',
    'is_sebi',
    'is_sponsored',
    'linguistic_confidence',
    'quote_len',
    'has_buy_signal',
    'hype_language_score'
]

X = df[FEATURES]
y = df['target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

xgb_model = xgb.XGBClassifier(
    n_estimators=150, 
    learning_rate=0.04, 
    max_depth=4, 
    subsample=0.85,
    colsample_bytree=0.85,
    random_state=42, 
    eval_metric='logloss'
)
xgb_model.fit(X_train, y_train)

# Performance Evaluation
preds = xgb_model.predict(X_test)
probs = xgb_model.predict_proba(X_test)[:, 1]

print("========================================================")
print("🏆 UPGRADED ML CONVICTION ENGINE BENCHMARK")
print("========================================================")
print(f"Overall Holdout Accuracy: {round(accuracy_score(y_test, preds)*100, 2)}%")
print(f"Overall Holdout ROC-AUC:  {round(roc_auc_score(y_test, probs), 4)}")

# Conviction Gating Evaluation
print("\n=== CONVICTION GATING SIMULATION (Filtering Losing Noise) ===")
for th in [0.40, 0.50, 0.55, 0.60, 0.65]:
    mask = (probs >= th)
    cnt = mask.sum()
    if cnt > 0:
        gated_wr = round((y_test[mask].sum() / cnt) * 100, 2)
        print(f"Threshold >= {int(th*100)}%: Kept {cnt}/{len(y_test)} calls ({round((cnt/len(y_test))*100, 1)}%) -> Win Rate: {gated_wr}%")

# Save Production Model and Metadata
model_artifact_path = os.environ.get("MARKETPROBE_MODEL_PATH", os.path.join(PROJECT_ROOT, "data", "xgb_model.pkl"))
with open(model_artifact_path, "wb") as f:
    pickle.dump({
        "model": xgb_model, 
        "features": FEATURES,
        "global_mean": global_mean,
        "creator_stats": dict(zip(creator_stats['influencer_id'], creator_stats['creator_historical_winrate']))
    }, f)

print(f"\n✅ Production model and metadata saved to {model_artifact_path}")
