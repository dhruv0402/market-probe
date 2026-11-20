"""
Compliant SEC EDGAR & Corporate Filings Ingestion Service for MarketProbe.

Features:
- Mandatory SEC-compliant User-Agent & polite rate limiting (<= 7 req/sec)
- 24-hour local disk cache under data/cache/edgar/
- Ticker -> 10-digit CIK resolution (SEC company_tickers.json + NSE-to-US ADR alias table)
- Multi-taxonomy XBRL CompanyFacts parser supporting BOTH `us-gaap` (10-K/10-Q)
  and `ifrs-full` (20-F foreign private issuers like INFY, HDFCBANK, ICICIBANK, WIPRO)
- Primary filing excerpt extraction (Risk Factors / MD&A) + pypdf NSE Annual Report support
- Form 4 raw XML open-market transaction parser (`Code P` buys & `Code S` sales ONLY)
"""

import io
import json
import os
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE_DIR = os.path.join(PROJECT_ROOT, "data", "cache", "edgar")
os.makedirs(CACHE_DIR, exist_ok=True)

SEC_HEADERS = {
    "User-Agent": "MarketProbeQuantResearch/1.0 (research@marketprobe.in)",
    "Accept-Encoding": "gzip, deflate",
    "Accept": "application/json, text/html, application/xml;q=0.9, */*;q=0.8",
}

CACHE_TTL_SECONDS = 24 * 3600
_LAST_SEC_REQ_TS = 0.0

# Explicit alias table mapping popular NSE symbols & ADRs to verified 10-digit SEC CIKs
NSE_ADR_CIK_MAP: Dict[str, Tuple[str, str, str]] = {
    "INFY": ("0001067491", "INFOSYS LTD (NYSE ADR / NSE)", "INFY"),
    "INFOSYS": ("0001067491", "INFOSYS LTD (NYSE ADR / NSE)", "INFY"),
    "HDFCBANK": ("0001144967", "HDFC BANK LTD (NYSE ADR: HDB / NSE)", "HDB"),
    "HDB": ("0001144967", "HDFC BANK LTD (NYSE ADR: HDB / NSE)", "HDB"),
    "ICICIBANK": ("0001103838", "ICICI BANK LTD (NYSE ADR: IBN / NSE)", "IBN"),
    "IBN": ("0001103838", "ICICI BANK LTD (NYSE ADR: IBN / NSE)", "IBN"),
    "WIPRO": ("0001123799", "WIPRO LTD (NYSE ADR: WIT / NSE)", "WIT"),
    "WIT": ("0001123799", "WIPRO LTD (NYSE ADR: WIT / NSE)", "WIT"),
    "DRREDDY": ("0001135951", "DR. REDDY'S LABORATORIES LTD (NYSE ADR: RDY)", "RDY"),
    "RDY": ("0001135951", "DR. REDDY'S LABORATORIES LTD (NYSE ADR: RDY)", "RDY"),
    "MMYT": ("0001495153", "MAKEMYTRIP LTD (NASDAQ: MMYT)", "MMYT"),
    "AAPL": ("0000320193", "APPLE INC.", "AAPL"),
    "NVDA": ("0001045810", "NVIDIA CORP", "NVDA"),
    "MSFT": ("0000789019", "MICROSOFT CORP", "MSFT"),
    "TSLA": ("0001318605", "TESLA, INC.", "TSLA"),
    "META": ("0001326801", "META PLATFORMS, INC.", "META"),
    "AMZN": ("0001018724", "AMAZON.COM, INC.", "AMZN"),
    "GOOGL": ("0001652044", "ALPHABET INC.", "GOOGL"),
    "INTC": ("0000050863", "INTEL CORP", "INTC"),
    "AMD": ("0000002488", "ADVANCED MICRO DEVICES INC", "AMD"),
    "JPM": ("0000019617", "JPMORGAN CHASE & CO", "JPM"),
}

_TICKER_MAP_MEM: Optional[Dict[str, Tuple[str, str]]] = None


def _clean_ticker(ticker: str) -> str:
    return ticker.upper().replace(".NS", "").replace(".BO", "").strip()


def _rate_limit_sec() -> None:
    global _LAST_SEC_REQ_TS
    elapsed = time.time() - _LAST_SEC_REQ_TS
    if elapsed < 0.14:
        time.sleep(0.14 - elapsed)
    _LAST_SEC_REQ_TS = time.time()


def _cache_path(name: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", name)
    return os.path.join(CACHE_DIR, safe)


def _read_cache_json(name: str, ttl: int = CACHE_TTL_SECONDS) -> Optional[Any]:
    path = _cache_path(name)
    if not os.path.exists(path):
        return None
    if time.time() - os.path.getmtime(path) > ttl:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _write_cache_json(name: str, payload: Any) -> None:
    path = _cache_path(name)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f)
    except Exception:
        pass


def _sec_get_json(url: str, cache_key: str, timeout: float = 12.0, ttl: int = CACHE_TTL_SECONDS) -> Optional[Dict[str, Any]]:
    cached = _read_cache_json(cache_key, ttl=ttl)
    if cached is not None:
        return cached
    _rate_limit_sec()
    try:
        with httpx.Client(headers=SEC_HEADERS, timeout=timeout, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                _write_cache_json(cache_key, data)
                return data
    except Exception:
        return None
    return None


def _sec_get_text(url: str, timeout: float = 10.0, max_bytes: int = 400_000) -> Optional[str]:
    _rate_limit_sec()
    try:
        with httpx.Client(headers=SEC_HEADERS, timeout=timeout, follow_redirects=True) as client:
            with client.stream("GET", url) as resp:
                if resp.status_code != 200:
                    return None
                chunks = []
                total = 0
                for chunk in resp.iter_bytes():
                    chunks.append(chunk)
                    total += len(chunk)
                    if total >= max_bytes:
                        break
                return b"".join(chunks).decode("utf-8", errors="ignore")
    except Exception:
        return None


def _load_sec_ticker_map() -> Dict[str, Tuple[str, str]]:
    global _TICKER_MAP_MEM
    if _TICKER_MAP_MEM is not None:
        return _TICKER_MAP_MEM

    raw = _sec_get_json(
        "https://www.sec.gov/files/company_tickers.json",
        "company_tickers.json",
        timeout=12.0,
        ttl=7 * 24 * 3600,
    )
    mapping: Dict[str, Tuple[str, str]] = {}
    if isinstance(raw, dict):
        for _, entry in raw.items():
            if not isinstance(entry, dict):
                continue
            sym = str(entry.get("ticker", "")).upper().strip()
            cik_int = entry.get("cik_str")
            title = str(entry.get("title", "")).strip()
            if sym and cik_int is not None:
                mapping[sym] = (str(int(cik_int)).zfill(10), title)
    _TICKER_MAP_MEM = mapping
    return mapping


def resolve_cik(ticker: str) -> Optional[Dict[str, str]]:
    """Resolves US ticker or NSE ADR symbol to a 10-digit SEC CIK and canonical company name."""
    sym = _clean_ticker(ticker)
    if sym in NSE_ADR_CIK_MAP:
        cik, title, sec_sym = NSE_ADR_CIK_MAP[sym]
        return {"ticker": sym, "sec_ticker": sec_sym, "cik": cik, "company_name": title}

    sec_map = _load_sec_ticker_map()
    if sym in sec_map:
        cik, title = sec_map[sym]
        return {"ticker": sym, "sec_ticker": sym, "cik": cik, "company_name": title}

    return None


def _extract_xbrl_series(
    facts_root: Dict[str, Any],
    tag_candidates: List[Tuple[str, str]],
    preferred_forms: Tuple[str, ...] = ("10-K", "20-F", "10-Q"),
) -> List[Dict[str, Any]]:
    """
    Extracts chronological audited annual/quarterly observations for a metric
    across both `us-gaap` and `ifrs-full` taxonomies, selecting the candidate tag
    with the MOST RECENT fiscal period end date (handles IFRS/GAAP tag migrations).
    """
    facts = facts_root.get("facts", {})
    best_series: List[Dict[str, Any]] = []
    best_end = ""

    for taxonomy, tag in tag_candidates:
        tax_block = facts.get(taxonomy, {})
        if tag not in tax_block:
            continue
        units = tax_block[tag].get("units", {})
        if not units:
            continue
        # Prefer USD, then INR, then USD/shares, then first available unit
        unit_key = None
        for preferred in ("USD", "INR", "USD/shares", "INR/shares", "shares"):
            if preferred in units and units[preferred]:
                unit_key = preferred
                break
        if unit_key is None:
            unit_key = next(iter(units.keys()))

        rows = units.get(unit_key, [])
        annual_rows = []
        for r in rows:
            form = str(r.get("form", "")).upper()
            val = r.get("val")
            end = r.get("end")
            if val is None or not end:
                continue
            if form in ("10-K", "20-F"):
                start = r.get("start")
                if start:
                    try:
                        d0 = datetime.strptime(start, "%Y-%m-%d")
                        d1 = datetime.strptime(end, "%Y-%m-%d")
                        if (d1 - d0).days < 300:
                            continue
                    except Exception:
                        pass
                annual_rows.append(
                    {
                        "end": end,
                        "filed": r.get("filed", ""),
                        "fy": r.get("fy"),
                        "form": form,
                        "val": float(val),
                        "unit": unit_key,
                        "tag": f"{taxonomy}:{tag}",
                    }
                )
        if not annual_rows:
            for r in rows:
                form = str(r.get("form", "")).upper()
                val = r.get("val")
                end = r.get("end")
                if val is not None and end and form in preferred_forms:
                    annual_rows.append(
                        {
                            "end": end,
                            "filed": r.get("filed", ""),
                            "fy": r.get("fy"),
                            "form": form,
                            "val": float(val),
                            "unit": unit_key,
                            "tag": f"{taxonomy}:{tag}",
                        }
                    )

        if annual_rows:
            by_end: Dict[str, Dict[str, Any]] = {}
            for r in annual_rows:
                prev = by_end.get(r["end"])
                if prev is None or r["filed"] >= prev["filed"]:
                    by_end[r["end"]] = r
            ordered = sorted(by_end.values(), key=lambda x: x["end"], reverse=True)
            latest_end = ordered[0]["end"]
            if latest_end > best_end:
                best_end = latest_end
                best_series = ordered[:4]
    return best_series


def _fmt_money(val: Optional[float], unit: str = "USD") -> str:
    if val is None:
        return "N/A"
    sym = "₹" if "INR" in unit else "$"
    abs_v = abs(val)
    sign = "-" if val < 0 else ""
    if abs_v >= 1e9:
        return f"{sign}{sym}{abs_v / 1e9:.2f}B"
    if abs_v >= 1e6:
        return f"{sign}{sym}{abs_v / 1e6:.2f}M"
    return f"{sign}{sym}{abs_v:,.2f}"


def extract_xbrl_snapshot(cik: str) -> Dict[str, Any]:
    """Pulls and normalizes key audited XBRL metrics from SEC CompanyFacts."""
    raw = _sec_get_json(
        f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
        f"companyfacts_{cik}.json",
        timeout=14.0,
    )
    if not raw:
        return {}

    revenue = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "RevenueFromContractWithCustomerExcludingAssessedTax"),
            ("us-gaap", "Revenues"),
            ("us-gaap", "SalesRevenueNet"),
            ("us-gaap", "InterestAndDividendIncomeOperating"),
            ("ifrs-full", "Revenue"),
            ("ifrs-full", "RevenueFromContractsWithCustomers"),
            ("ifrs-full", "InterestRevenueCalculatedUsingEffectiveInterestMethod"),
        ],
    )
    net_income = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "NetIncomeLoss"),
            ("ifrs-full", "ProfitLoss"),
            ("ifrs-full", "ProfitLossAttributableToOwnersOfParent"),
        ],
    )
    op_income = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "OperatingIncomeLoss"),
            ("ifrs-full", "ProfitLossFromOperatingActivities"),
        ],
    )
    ocf = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "NetCashProvidedByUsedInOperatingActivities"),
            ("ifrs-full", "CashFlowsFromUsedInOperatingActivities"),
        ],
    )
    cash = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "CashAndCashEquivalentsAtCarryingValue"),
            ("us-gaap", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"),
            ("ifrs-full", "CashAndCashEquivalents"),
        ],
    )
    debt = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "LongTermDebtNoncurrent"),
            ("us-gaap", "LongTermDebt"),
            ("us-gaap", "LongTermDebtAndCapitalLeaseObligations"),
            ("ifrs-full", "NoncurrentFinancialLiabilities"),
            ("ifrs-full", "Borrowings"),
        ],
    )
    eps = _extract_xbrl_series(
        raw,
        [
            ("us-gaap", "EarningsPerShareDiluted"),
            ("ifrs-full", "DilutedEarningsLossPerShare"),
        ],
    )

    def _latest(series: List[Dict[str, Any]]) -> Tuple[Optional[float], Optional[float], str, str, str]:
        if not series:
            return None, None, "USD", "", ""
        cur = series[0]
        prev_val = series[1]["val"] if len(series) > 1 else None
        return cur["val"], prev_val, cur.get("unit", "USD"), cur.get("end", ""), cur.get("tag", "")

    rev_v, rev_prev, rev_unit, rev_end, rev_tag = _latest(revenue)
    ni_v, ni_prev, ni_unit, ni_end, ni_tag = _latest(net_income)
    op_v, _, op_unit, _, _ = _latest(op_income)
    ocf_v, _, ocf_unit, _, _ = _latest(ocf)
    cash_v, _, cash_unit, _, _ = _latest(cash)
    debt_v, _, debt_unit, _, _ = _latest(debt)
    eps_v, eps_prev, eps_unit, _, _ = _latest(eps)

    rev_yoy = round(((rev_v - rev_prev) / abs(rev_prev)) * 100.0, 2) if (rev_v is not None and rev_prev and abs(rev_prev) > 0) else None
    ni_yoy = round(((ni_v - ni_prev) / abs(ni_prev)) * 100.0, 2) if (ni_v is not None and ni_prev and abs(ni_prev) > 0) else None
    net_margin = round((ni_v / rev_v) * 100.0, 2) if (ni_v is not None and rev_v and rev_v > 0) else None
    op_margin = round((op_v / rev_v) * 100.0, 2) if (op_v is not None and rev_v and rev_v > 0) else None
    cash_to_debt = round(cash_v / debt_v, 2) if (cash_v is not None and debt_v and debt_v > 0) else None
    ocf_to_ni = round(ocf_v / ni_v, 2) if (ocf_v is not None and ni_v and ni_v > 0) else None

    return {
        "entity_name": raw.get("entityName", ""),
        "currency_unit": rev_unit or ni_unit or "USD",
        "period_end": rev_end or ni_end,
        "revenue": rev_v,
        "revenue_prev": rev_prev,
        "revenue_formatted": _fmt_money(rev_v, rev_unit),
        "revenue_yoy_pct": rev_yoy,
        "revenue_tag": rev_tag,
        "net_income": ni_v,
        "net_income_prev": ni_prev,
        "net_income_formatted": _fmt_money(ni_v, ni_unit),
        "net_income_yoy_pct": ni_yoy,
        "net_margin_pct": net_margin,
        "operating_income": op_v,
        "operating_margin_pct": op_margin,
        "operating_cash_flow": ocf_v,
        "operating_cash_flow_formatted": _fmt_money(ocf_v, ocf_unit),
        "ocf_to_net_income_ratio": ocf_to_ni,
        "cash_and_equivalents": cash_v,
        "cash_formatted": _fmt_money(cash_v, cash_unit),
        "long_term_debt": debt_v,
        "debt_formatted": _fmt_money(debt_v, debt_unit),
        "cash_to_debt_ratio": cash_to_debt,
        "diluted_eps": eps_v,
        "diluted_eps_prev": eps_prev,
        "diluted_eps_unit": eps_unit,
    }


def _extract_pdf_text(pdf_bytes: bytes, max_chars: int = 12000) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        chunks = []
        total = 0
        for idx, page in enumerate(reader.pages[:35]):
            txt = (page.extract_text() or "").strip()
            if not txt:
                continue
            chunks.append(f"[PDF Page {idx + 1}] {txt}")
            total += len(txt)
            if total >= max_chars:
                break
        return "\n".join(chunks)[:max_chars]
    except Exception:
        return ""


def _extract_filing_excerpt(filing_url: str, cache_key: str) -> str:
    cached = _read_cache_json(cache_key, ttl=7 * 24 * 3600)
    if isinstance(cached, dict) and cached.get("excerpt"):
        return str(cached["excerpt"])

    html = _sec_get_text(filing_url, timeout=8.0, max_bytes=320_000)
    if not html:
        return ""

    try:
        soup = BeautifulSoup(html, "lxml")
        for tag in soup(["script", "style", "noscript", "table"]):
            tag.decompose()
        raw_text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))
        # Prioritize Risk Factors / MD&A / Overview paragraphs if present
        snippets = []
        for pattern in (
            r"(Item\s+1A\.?\s*Risk\s+Factors.{0,2200})",
            r"(Item\s+7\.?\s*Management.{0,2200})",
            r"(Risk\s+Factors.{0,1800})",
            r"(Operating\s+and\s+Financial\s+Review.{0,1800})",
        ):
            m = re.search(pattern, raw_text, re.IGNORECASE)
            if m:
                snippets.append(m.group(1)[:1800])
        excerpt = " ... ".join(snippets) if snippets else raw_text[:2800]
        excerpt = excerpt[:3600]
        _write_cache_json(cache_key, {"excerpt": excerpt})
        return excerpt
    except Exception:
        return ""


def fetch_company_filings_context(
    ticker: str,
    pdf_bytes: Optional[bytes] = None,
    pdf_filename: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Aggregates verified SEC EDGAR submissions, XBRL financial metrics, primary filing
    excerpts, and optional uploaded Indian NSE/BSE Annual Report / Concall PDF text.
    """
    sym = _clean_ticker(ticker)
    resolved = resolve_cik(sym)
    pdf_excerpt = _extract_pdf_text(pdf_bytes) if pdf_bytes else ""

    if not resolved:
        # Pure NSE equity without SEC ADR — ground via PDF upload + FAISS RAG corpus
        rag_snippets: List[str] = []
        try:
            from src.quant.rag_service import search_knowledge_base

            hits = search_knowledge_base(f"{sym} earnings revenue margin risk outlook", top_k=4)
            for h in hits:
                rag_snippets.append(f"[{h.get('source', 'MarketProbe Corpus')}] {str(h.get('content', ''))[:400]}")
        except Exception:
            pass

        return {
            "ticker": sym,
            "company_name": f"{sym} (NSE Listed Equity)",
            "cik": None,
            "source_mode": "NSE_PDF_AND_CORPUS" if pdf_excerpt else "NSE_CORPUS_ONLY",
            "edgar_available": False,
            "filings": [],
            "xbrl_snapshot": {},
            "filing_excerpt": pdf_excerpt or "\n".join(rag_snippets),
            "pdf_filename": pdf_filename,
            "nse_disclosure_url": f"https://www.nseindia.com/get-quotes/equity?symbol={sym}",
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
        }

    cik = resolved["cik"]
    cik_int_str = str(int(cik))
    submissions = _sec_get_json(
        f"https://data.sec.gov/submissions/CIK{cik}.json",
        f"submissions_{cik}.json",
        timeout=12.0,
    )

    filings: List[Dict[str, str]] = []
    if submissions:
        recent = submissions.get("filings", {}).get("recent", {})
        forms = recent.get("form", [])
        dates = recent.get("filingDate", [])
        report_dates = recent.get("reportDate", [])
        accessions = recent.get("accessionNumber", [])
        docs = recent.get("primaryDocument", [])
        for idx, form in enumerate(forms):
            if form in ("10-K", "20-F", "10-Q", "8-K", "6-K"):
                acc = accessions[idx] if idx < len(accessions) else ""
                doc = docs[idx] if idx < len(docs) else ""
                acc_clean = acc.replace("-", "")
                url = f"https://www.sec.gov/Archives/edgar/data/{cik_int_str}/{acc_clean}/{doc}" if (acc_clean and doc) else ""
                filings.append(
                    {
                        "form": form,
                        "filing_date": dates[idx] if idx < len(dates) else "",
                        "report_date": report_dates[idx] if idx < len(report_dates) else "",
                        "accession_no": acc,
                        "document": doc,
                        "url": url,
                    }
                )
            if len(filings) >= 8:
                break

    xbrl = extract_xbrl_snapshot(cik)
    primary_annual = next((f for f in filings if f["form"] in ("10-K", "20-F", "10-Q")), None)
    excerpt = ""
    if primary_annual and primary_annual.get("url"):
        excerpt = _extract_filing_excerpt(
            primary_annual["url"],
            f"excerpt_{cik}_{primary_annual['accession_no']}.json",
        )
    if pdf_excerpt:
        excerpt = f"[Uploaded Document: {pdf_filename or 'Annual Report PDF'}]\n{pdf_excerpt}\n\n[SEC Filing Excerpt]\n{excerpt}"

    return {
        "ticker": sym,
        "sec_ticker": resolved.get("sec_ticker", sym),
        "company_name": (submissions or {}).get("name") or resolved["company_name"],
        "cik": cik,
        "sic_description": (submissions or {}).get("sicDescription", ""),
        "source_mode": "SEC_EDGAR_AND_PDF" if pdf_excerpt else "SEC_EDGAR_LIVE",
        "edgar_available": True,
        "filings": filings,
        "latest_primary_filing": primary_annual,
        "xbrl_snapshot": xbrl,
        "filing_excerpt": excerpt,
        "pdf_filename": pdf_filename,
        "edgar_browse_url": f"https://www.sec.gov/edgar/browse/?CIK={cik}",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


def _xml_text(elem: Optional[ET.Element], path: str) -> str:
    if elem is None:
        return ""
    found = elem.find(path)
    if found is not None and found.text:
        return found.text.strip()
    return ""


def parse_form4_xml(
    xml_text: str,
    ticker: str,
    company_name: str,
    filing_date: str,
    filing_url: str,
    accession_no: str,
) -> List[Dict[str, Any]]:
    """
    Strictly parses SEC Form 4 XML `<nonDerivativeTransaction>` elements.
    Keeps ONLY Open-Market Purchases (`P`) and Open-Market Sales (`S`) —
    strictly rejecting RSU awards (`A`), tax withholdings (`F`), option exercises (`M`), and gifts (`G`).
    """
    if not xml_text or "<ownershipDocument" not in xml_text:
        return []
    try:
        root = ET.fromstring(xml_text)
    except Exception:
        return []

    owner_el = root.find(".//reportingOwner")
    owner_name = _xml_text(owner_el, ".//rptOwnerName") or "Corporate Insider"
    officer_title = _xml_text(owner_el, ".//officerTitle")
    is_director = _xml_text(owner_el, ".//isDirector").lower() in ("1", "true")
    is_officer = _xml_text(owner_el, ".//isOfficer").lower() in ("1", "true")
    is_ten_pct = _xml_text(owner_el, ".//isTenPercentOwner").lower() in ("1", "true")

    if officer_title:
        role = officer_title
    elif is_officer and is_director:
        role = "Executive Director / Officer"
    elif is_director:
        role = "Director"
    elif is_ten_pct:
        role = "10% Beneficial Owner"
    else:
        role = "Section 16 Insider"

    results: List[Dict[str, Any]] = []
    for tx in root.findall(".//nonDerivativeTransaction"):
        code = _xml_text(tx, ".//transactionCoding/transactionCode").upper()
        # STRICT FILTER: Open-Market Purchase ('P') and Open-Market Sale ('S') ONLY
        if code not in ("P", "S"):
            continue
        tx_date = _xml_text(tx, ".//transactionDate/value") or filing_date
        shares_str = _xml_text(tx, ".//transactionAmounts/transactionShares/value")
        price_str = _xml_text(tx, ".//transactionAmounts/transactionPricePerShare/value")
        try:
            shares = float(shares_str) if shares_str else 0.0
            price = float(price_str) if price_str else 0.0
        except ValueError:
            continue
        if shares <= 0 or price <= 0:
            continue

        results.append(
            {
                "ticker": _clean_ticker(ticker),
                "company_name": company_name,
                "market": "US_SEC",
                "insider_name": owner_name,
                "insider_role": role[:80],
                "transaction_code": code,
                "shares": round(shares, 2),
                "price": round(price, 4),
                "total_value": round(shares * price, 2),
                "currency": "USD",
                "transaction_date": tx_date,
                "filing_date": filing_date,
                "filing_url": filing_url,
                "accession_no": accession_no,
                "verification_tier": "VERIFIED_SEC_FORM4",
            }
        )
    return results


def fetch_form4_transactions_for_ticker(ticker: str, max_filings: int = 10) -> List[Dict[str, Any]]:
    """Fetches and parses live SEC EDGAR Form 4 XML open-market buys & sells for a ticker."""
    resolved = resolve_cik(ticker)
    if not resolved:
        return []

    cik = resolved["cik"]
    cik_int_str = str(int(cik))
    submissions = _sec_get_json(
        f"https://data.sec.gov/submissions/CIK{cik}.json",
        f"submissions_{cik}.json",
        timeout=12.0,
        ttl=6 * 3600,
    )
    if not submissions:
        return []

    company_name = submissions.get("name") or resolved["company_name"]
    recent = submissions.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    dates = recent.get("filingDate", [])
    accessions = recent.get("accessionNumber", [])
    docs = recent.get("primaryDocument", [])

    txs: List[Dict[str, Any]] = []
    scanned = 0
    for idx, form in enumerate(forms):
        if form != "4":
            continue
        acc = accessions[idx] if idx < len(accessions) else ""
        doc = docs[idx] if idx < len(docs) else ""
        fdate = dates[idx] if idx < len(dates) else ""
        if not acc or not doc:
            continue
        # Strip XSLT viewer folder (e.g., xslF345X05/form4.xml -> form4.xml) to get pure XML!
        raw_doc = doc.split("/")[-1]
        if not raw_doc.lower().endswith(".xml"):
            continue
        acc_clean = acc.replace("-", "")
        raw_xml_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int_str}/{acc_clean}/{raw_doc}"
        viewer_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int_str}/{acc_clean}/{doc}"

        xml_body = _sec_get_text(raw_xml_url, timeout=8.0, max_bytes=120_000)
        if xml_body:
            parsed = parse_form4_xml(
                xml_body,
                ticker=resolved["ticker"],
                company_name=company_name,
                filing_date=fdate,
                filing_url=viewer_url,
                accession_no=acc,
            )
            txs.extend(parsed)
        scanned += 1
        if scanned >= max_filings:
            break

    return txs
