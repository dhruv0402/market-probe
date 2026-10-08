# Official NSE / BSE Index Constituent Mappings & Tiers

INDEX_BENCHMARKS = {
    "^NSEI": {"name": "NIFTY 50 Benchmark Index", "aliases": ["NIFTY 50", "NIFTY", "NIFTY50", "NIFTY SPOT"], "tier": "INDEX"},
    "^NSEBANK": {"name": "Bank Nifty Index", "aliases": ["BANK NIFTY", "BANKNIFTY", "BANK NIFTY SPOT", "BNF"], "tier": "INDEX"},
    "^CNX100": {"name": "NIFTY 100 Index", "aliases": ["NIFTY 100", "NIFTY100", "CNX 100"], "tier": "INDEX"},
    "^CRSLDX": {"name": "NIFTY LargeMidcap 250 Index", "aliases": ["NIFTY 250", "NIFTY250", "LARGEMIDCAP 250", "NIFTY MIDCAP 150"], "tier": "INDEX"},
    "^BSESN": {"name": "BSE SENSEX 30 Benchmark Index", "aliases": ["SENSEX", "SENSEX 30", "BSESN", "BSE 30"], "tier": "INDEX"}
}

# Major Constituents by Index Tier
NIFTY_50_STOCKS = {
    "RELIANCE.NS": "Reliance Industries Limited",
    "TCS.NS": "Tata Consultancy Services Limited",
    "HDFCBANK.NS": "HDFC Bank Limited",
    "ICICIBANK.NS": "ICICI Bank Limited",
    "INFY.NS": "Infosys Limited",
    "BHARTIARTL.NS": "Bharti Airtel Limited",
    "SBIN.NS": "State Bank of India",
    "ITC.NS": "ITC Limited",
    "LT.NS": "Larsen & Toubro Limited",
    "TATAMOTORS.NS": "Tata Motors Limited",
    "BAJFINANCE.NS": "Bajaj Finance Limited",
    "HINDUNILVR.NS": "Hindustan Unilever Limited",
    "SUNPHARMA.NS": "Sun Pharmaceutical Industries Limited",
    "TITAN.NS": "Titan Company Limited",
    "MARUTI.NS": "Maruti Suzuki India Limited",
    "AXISBANK.NS": "Axis Bank Limited",
    "KOTAKBANK.NS": "Kotak Mahindra Bank Limited",
    "NTPC.NS": "NTPC Limited",
    "POWERGRID.NS": "Power Grid Corporation of India Limited",
    "ONGC.NS": "Oil and Natural Gas Corporation Limited",
    "M&M.NS": "Mahindra & Mahindra Limited",
    "TATASTEEL.NS": "Tata Steel Limited",
    "ADANIENT.NS": "Adani Enterprises Limited",
    "ADANIPORTS.NS": "Adani Ports and Special Economic Zone Limited",
    "COALINDIA.NS": "Coal India Limited",
    "BAJAJFINSV.NS": "Bajaj Finserv Limited",
    "ASIANPAINT.NS": "Asian Paints Limited",
    "ULTRACEMCO.NS": "UltraTech Cement Limited",
    "HCLTECH.NS": "HCL Technologies Limited",
    "WIPRO.NS": "Wipro Limited",
    "JSWSTEEL.NS": "JSW Steel Limited",
    "GRASIM.NS": "Grasim Industries Limited",
    "HINDALCO.NS": "Hindalco Industries Limited",
    "NESTLEIND.NS": "Nestle India Limited",
    "TECHM.NS": "Tech Mahindra Limited",
    "DRREDDY.NS": "Dr. Reddy's Laboratories Limited",
    "CIPLA.NS": "Cipla Limited",
    "TATACONSUM.NS": "Tata Consumer Products Limited",
    "APOLLOHOSP.NS": "Apollo Hospitals Enterprise Limited",
    "EICHERMOT.NS": "Eicher Motors Limited",
    "DIVISLAB.NS": "Divi's Laboratories Limited",
    "HEROMOTOCO.NS": "Hero MotoCorp Limited",
    "BPCL.NS": "Bharat Petroleum Corporation Limited",
    "BRITANNIA.NS": "Britannia Industries Limited",
    "SBILIFE.NS": "SBI Life Insurance Company Limited",
    "HDFCLIFE.NS": "HDFC Life Insurance Company Limited",
    "LTIM.NS": "LTIMindtree Limited",
    "SHRIRAMFIN.NS": "Shriram Finance Limited",
    "BEL.NS": "Bharat Electronics Limited",
    "TRENT.NS": "Trent Limited"
}

NIFTY_NEXT_50_STOCKS = {
    "HAL.NS": "Hindustan Aeronautics Limited",
    "VEDL.NS": "Vedanta Limited",
    "ZOMATO.NS": "Zomato Limited",
    "JIOFIN.NS": "Jio Financial Services Limited",
    "DLF.NS": "DLF Limited",
    "SIEMENS.NS": "Siemens Limited",
    "PFC.NS": "Power Finance Corporation Limited",
    "RECLTD.NS": "REC Limited",
    "GAIL.NS": "GAIL (India) Limited",
    "CHOLAFIN.NS": "Cholamandalam Investment and Finance Company Limited",
    "ABB.NS": "ABB India Limited",
    "BANKBARODA.NS": "Bank of Baroda",
    "CANBK.NS": "Canara Bank",
    "TVSMOTOR.NS": "TVS Motor Company Limited",
    "INDIGO.NS": "InterGlobe Aviation Limited",
    "PNB.NS": "Punjab National Bank",
    "IOC.NS": "Indian Oil Corporation Limited",
    "PIDILITIND.NS": "Pidilite Industries Limited",
    "HAVELLS.NS": "Havells India Limited",
    "DABUR.NS": "Dabur India Limited"
}

NIFTY_MIDCAP_150_STOCKS = {
    "SUZLON.NS": "Suzlon Energy Limited",
    "FEDERALBNK.NS": "The Federal Bank Limited",
    "POLYCAB.NS": "Polycab India Limited",
    "PERSISTENT.NS": "Persistent Systems Limited",
    "IDFCFIRSTB.NS": "IDFC FIRST Bank Limited",
    "ASHOKLEY.NS": "Ashok Leyland Limited",
    "ASTRAL.NS": "Astral Limited",
    "COFORGE.NS": "Coforge Limited",
    "DIXON.NS": "Dixon Technologies (India) Limited",
    "VOLTAS.NS": "Voltas Limited",
    "KPITTECH.NS": "KPIT Technologies Limited",
    "ESCORTS.NS": "Escorts Kubota Limited",
    "TATACOMM.NS": "Tata Communications Limited",
    "MAXHEALTH.NS": "Max Healthcare Institute Limited",
    "BATAINDIA.NS": "Bata India Limited",
    "AUROPHARMA.NS": "Aurobindo Pharma Limited",
    "LUPIN.NS": "Lupin Limited",
    "OBEROIRLTY.NS": "Oberoi Realty Limited",
    "GODREJPROP.NS": "Godrej Properties Limited",
    "PRESTIGE.NS": "Prestige Estates Projects Limited"
}

def get_index_tier(ticker: str) -> str:
    sym = ticker.replace(".NS", "")
    full_sym = ticker if ticker.endswith(".NS") or ticker.startswith("^") else f"{ticker}.NS"
    
    if full_sym in INDEX_BENCHMARKS or ticker in INDEX_BENCHMARKS:
        return "BENCHMARK INDEX"
    elif full_sym in NIFTY_50_STOCKS or sym in [s.replace(".NS", "") for s in NIFTY_50_STOCKS]:
        return "NIFTY 50 / SENSEX BLUECHIP"
    elif full_sym in NIFTY_NEXT_50_STOCKS or sym in [s.replace(".NS", "") for s in NIFTY_NEXT_50_STOCKS]:
        return "NIFTY 100 LARGE-CAP"
    elif full_sym in NIFTY_MIDCAP_150_STOCKS or sym in [s.replace(".NS", "") for s in NIFTY_MIDCAP_150_STOCKS]:
        return "NIFTY 250 MID-CAP"
    else:
        return "NSE SMALLCAP / GROWTH TIER"
