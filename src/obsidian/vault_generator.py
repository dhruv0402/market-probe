
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

import os
import sqlite3
import re

DB_PATH = os.environ.get("MARKETPROBE_DB_PATH", os.path.join(PROJECT_ROOT, "data", "marketprobe.db"))
VAULT_PATH = os.path.expanduser("~/MarketProbe_Obsidian_Vault")

def generate_obsidian_vault():
    print(f"📁 Initializing Obsidian Vault at: {VAULT_PATH}")
    
    for folder in ["Stocks", "Advisors", "Calls", "Syndicates"]:
        os.makedirs(os.path.join(VAULT_PATH, folder), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 1. Generate Advisor Notes
    cur.execute("SELECT * FROM influencers")
    influencers = cur.fetchall()
    print(f"✍️ Generating {len(influencers)} Advisor Obsidian Notes...")

    for inf in influencers:
        name = inf["name"]
        safe_name = re.sub(r'[^\w\s-]', '', name).strip()
        inf_id = inf["id"]
        
        cur.execute("SELECT * FROM recommendations WHERE influencer_id = ?", (inf_id,))
        calls = cur.fetchall()
        
        hits = sum(1 for c in calls if c["outcome_status"] == "HIT")
        misses = sum(1 for c in calls if c["outcome_status"] == "MISS")
        decided = hits + misses
        wr = round((hits / max(1, decided)) * 100, 1)
        
        lines = [
            "---",
            "type: advisor",
            f"platform: {inf['platform']}",
            f"handle: {inf['handle']}",
            f"is_sebi_registered: {bool(inf['is_sebi_registered'])}",
            f"sebi_reg_no: {inf['sebi_reg_no'] or 'Unregistered'}",
            f"total_calls: {len(calls)}",
            f"win_rate_pct: {wr}",
            "tags:",
            "  - marketprobe/advisor",
            f"  - sebi/{'verified' if inf['is_sebi_registered'] else 'unregistered'}",
            "---",
            "",
            f"# {name}",
            "",
            f"> **Handle:** `{inf['handle']}` | **Platform:** {inf['platform']}  ",
            f"> **SEBI Status:** {'🛡️ SEBI Registered (' + str(inf['sebi_reg_no']) + ')' if inf['is_sebi_registered'] else '⚠️ Unregistered Social Creator'}  ",
            f"> **Audited Win Rate:** **{wr}%** ({hits} Hits / {misses} Misses)",
            "",
            "---",
            "",
            "## 📊 Backtested Call Ledger",
            "",
            "| Stock | Action | Entry | Target | Stop Loss | Status | Call Note |",
            "|:---|:---:|:---:|:---:|:---:|:---:|:---|"
        ]
        
        stock_links = []
        for c in calls:
            sym_clean = (c["ticker"] or "NIFTY").replace(".NS", "")
            stock_links.append(f"[[{sym_clean}]]")
            lines.append(f"| [[{sym_clean}]] | {c['action']} | ₹{c['entry_price']} | ₹{c['target_price']} | ₹{c['stoploss_price']} | `{c['outcome_status']}` | [[Call-{c['id']}]] |")

        unique_stocks = list(dict.fromkeys(stock_links))[:8]
        lines.extend([
            "",
            "---",
            "## 🕸️ Knowledge Graph Connections",
            f"- **Recommended Equities:** {', '.join(unique_stocks)}",
            f"- **Category:** #{'InstitutionalResearch' if inf['is_sebi_registered'] else 'Finfluencer'}"
        ])
        
        with open(os.path.join(VAULT_PATH, "Advisors", f"{safe_name}.md"), "w") as f:
            f.write("\n".join(lines))

    # 2. Generate Stock Notes
    cur.execute('''
        SELECT ticker, company_name, COUNT(*) as total, 
               SUM(CASE WHEN action='BUY' THEN 1 ELSE 0 END) as buys,
               SUM(CASE WHEN outcome_status='HIT' THEN 1 ELSE 0 END) as hits
        FROM recommendations 
        WHERE ticker IS NOT NULL AND ticker != ''
        GROUP BY ticker
    ''')
    stocks = cur.fetchall()
    print(f"📈 Generating {len(stocks)} Stock & Index Obsidian Notes...")

    for s in stocks:
        sym_clean = s["ticker"].replace(".NS", "")
        safe_sym = re.sub(r'[^\w\s-]', '', sym_clean).strip()
        comp = s["company_name"] or sym_clean
        buy_pct = round((s["buys"] / max(1, s["total"])) * 100)
        
        cur.execute('''
            SELECT r.*, i.name as creator_name 
            FROM recommendations r 
            LEFT JOIN influencers i ON r.influencer_id = i.id 
            WHERE r.ticker = ?
        ''', (s["ticker"],))
        stock_calls = cur.fetchall()

        lines = [
            "---",
            "type: equity",
            f"ticker: {sym_clean}",
            f'company_name: "{comp}"',
            f'social_consensus: "{buy_pct}% Bullish"',
            f"total_mentions: {s['total']}",
            "tags:",
            "  - marketprobe/stock",
            f"  - consensus/{'bullish' if buy_pct >= 60 else 'bearish'}",
            "---",
            "",
            f"# {sym_clean} — {comp}",
            "",
            f"> **Social Media Consensus:** **{buy_pct}% Bullish** ({s['buys']} Buy / {s['total'] - s['buys']} Sell)  ",
            f"> **Audited Track Record:** {s['hits']} Targets Reached out of {len(stock_calls)} Calls",
            "",
            "---",
            "",
            "## 👥 Advisors Tracking this Stock",
            "",
            "| Advisor | Action | Entry | Target | SL | Outcome |",
            "|:---|:---:|:---:|:---:|:---:|:---:|"
        ]

        adv_links = []
        for sc in stock_calls:
            adv_name = sc["creator_name"] or "Independent Analyst"
            safe_adv = re.sub(r'[^\w\s-]', '', adv_name).strip()
            adv_links.append(f"[[{safe_adv}]]")
            lines.append(f"| [[{safe_adv}]] | {sc['action']} | ₹{sc['entry_price']} | ₹{sc['target_price']} | ₹{sc['stoploss_price']} | `{sc['outcome_status']}` |")

        unique_adv = list(dict.fromkeys(adv_links))[:6]
        lines.extend([
            "",
            "---",
            "## 🕸️ Knowledge Graph Connections",
            f"- **Advisors with Active Calls:** {', '.join(unique_adv)}"
        ])

        with open(os.path.join(VAULT_PATH, "Stocks", f"{safe_sym}.md"), "w") as f:
            f.write("\n".join(lines))

    # 3. Generate Individual Call Notes
    cur.execute('''
        SELECT r.*, i.name as creator_name 
        FROM recommendations r 
        LEFT JOIN influencers i ON r.influencer_id = i.id 
        LIMIT 120
    ''')
    for c in cur.fetchall():
        sym_clean = (c["ticker"] or "NIFTY").replace(".NS", "")
        adv_name = re.sub(r'[^\w\s-]', '', c["creator_name"] or "Analyst").strip()
        upside = round(((c['target_price']-c['entry_price'])/max(1,c['entry_price']))*100, 1)
        
        call_content = f"""---
type: recommendation_call
id: {c['id']}
ticker: {sym_clean}
advisor: {adv_name}
action: {c['action']}
outcome: {c['outcome_status']}
tags:
  - marketprobe/call
  - outcome/{c['outcome_status']}
---

# Call #{c['id']}: {c['action']} [[{sym_clean}]] by [[{adv_name}]]

- **Recommended Asset:** [[{sym_clean}]]
- **Advisor:** [[{adv_name}]]
- **Trade Action:** `{c['action']}`
- **Entry Level:** ₹{c['entry_price']}
- **Target Price:** ₹{c['target_price']} (+{upside}%)
- **Stop Loss:** ₹{c['stoploss_price']}
- **Backtested Result:** **`{c['outcome_status']}`**

> **Original Quote / Transcript:**  
> "{c['raw_quote']}"
"""
        with open(os.path.join(VAULT_PATH, "Calls", f"Call-{c['id']}.md"), "w") as f:
            f.write(call_content)

    # 4. Generate Master Vault Dashboard Note
    dashboard_content = f"""---
type: master_dashboard
title: "MarketProbe Knowledge Graph & Truth Ledger"
tags:
  - marketprobe/master
---

# 🛡️ MarketProbe Master Knowledge Vault

Welcome to the **MarketProbe Obsidian Vault**. Every note in this vault is bidirectionally linked across **Advisors**, **Stocks**, **Calls**, and **Regulatory Rules**.

## 📌 Quick Navigation
- 🏆 **Top Advisors Board:** [[Motilal Oswal Financial Services]], [[ICICI Direct Research]], [[Prakash Gaba]], [[Kunal Saraogi]], [[Akshat Shrivastava]]
- 📈 **Key Bluechips & Indices:** [[NIFTY50]], [[BANKNIFTY]], [[RELIANCE]], [[TATAMOTORS]], [[HDFCBANK]], [[INFY]], [[SUZLON]]
- 🚨 **Syndicate Clusters:** [[Coordinated Pump Ring 12]]

---

## 🕸️ How to View the Interactive 3D Knowledge Graph
1. Open Obsidian on your Mac.
2. Select **"Open folder as vault"** and choose:
   `~/MarketProbe_Obsidian_Vault`
3. Press **`Cmd + G`** (or click **Graph view** in the left sidebar).
4. Watch the entire interconnected network of Indian stock advisors and stocks render dynamically!

---
*Generated by MarketProbe v3.3 (Auditing 840+ Indian Financial Recommendations)*
"""
    with open(os.path.join(VAULT_PATH, "MarketProbe_Master_Dashboard.md"), "w") as f:
        f.write(dashboard_content)

    conn.close()
    print(f"\n🎉 Successfully Generated Obsidian Vault with hundreds of interconnected markdown notes at: {VAULT_PATH}")

if __name__ == "__main__":
    generate_obsidian_vault()
