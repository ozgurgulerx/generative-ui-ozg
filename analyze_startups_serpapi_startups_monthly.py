"""Analyze startup fintech use cases via Azure OpenAI with SERP tool assistance."""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import re
import html
from pathlib import Path
from typing import Any, Dict, Iterable, List
from urllib.parse import urlparse, urljoin

import requests
from dotenv import load_dotenv
from openai import OpenAI

STARTUPS_FILE = "2508_inv.csv"
OUTPUT_CSV = "2508_inv.with_analysis.csv"
DEFAULT_MODEL_DEPLOYMENT = "gpt-5-mini"

# Optional Playwright support (for JS-rendered pages)
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

    HAS_PLAYWRIGHT = True
except Exception:  # noqa: BLE001
    HAS_PLAYWRIGHT = False


# --- Classification Taxonomy (top verticals -> representative sub-verticals) ---
# Startups should be classified using EXACT strings from these keys/values.
TAXONOMY: dict[str, list[str]] = {
    "AI & Machine Learning": [
        "Foundation Models/LLMs", "Agentic AI/Orchestration", "AI Safety/Evals", "RAG/Vector DBs/LLMOps",
        "MLOps", "Multimodal", "Synthetic Data/Labeling", "Edge AI", "AutoML/Low-code AI", "AI for Code",
    ],
    "Developer Tools & Platforms": [
        "IDEs/Code Intelligence", "CI/CD", "Testing/QA/Observability", "APIs/SDKs", "Feature Flags",
        "IaC/Policy-as-Code", "Package Mgmt", "Containers/K8s", "Serverless", "Internal Dev Portals",
    ],
    "Data Infrastructure": [
        "Data Lakes/Warehouses", "ETL/ELT", "Stream Processing", "Catalog/Lineage/Governance",
        "Data Quality/Observability", "Lakehouse/HTAP", "Time-series/Graph/Vector DBs", "Data Marketplace",
        "Privacy-preserving Analytics", "Virtualization/Federation",
    ],
    "Cybersecurity": [
        "IAM", "AppSec/DevSecOps", "Cloud Security/CNAPP", "Endpoint EDR/XDR", "Network/SASE/Zero-Trust",
        "Threat Intel/Hunting", "DSPM/Data Security", "Email Defense", "OT/ICS", "GRC",
    ],
    "Fintech": [
        "Payments/Orchestration", "BaaS/Core", "Lending/Credit", "Wealth/Trading", "Accounting/CFO",
        "Treasury/FX/Embedded", "Risk/Fraud/KYC/AML", "Insurtech", "RegTech", "Crypto/Web3 Finance",
    ],
    "Insurance (Insurtech)": [
        "Distribution", "Underwriting/Pricing", "Claims Automation", "Usage-based/Parametric", "Reinsurance/ILS",
        "Risk Data/Cat Models", "Health/Benefits", "Core Systems", "Fraud/SIU", "Broker Tools",
    ],
    "Healthcare (HealthTech)": [
        "Telehealth", "Clinical Decision Support", "Digital Therapeutics", "RPM", "EHR/Interoperability",
        "RCM", "Care Navigation", "Mental Health", "Employer Benefits", "Imaging/Diagnostics",
    ],
    "Biotech & Life Sciences": [
        "Drug Discovery (AI)", "Genomics", "Cell/Gene Therapy", "Synthetic Biology", "Lab Automation",
        "Bio-manufacturing", "Protein Engineering", "Comp Bio Platforms", "ELN/LIMS", "Biosecurity",
    ],
    "MedTech & Devices": [
        "Wearables", "Surgical Robots", "Diagnostics/POC", "Devices/Implants", "Rehab/Assistive",
        "Imaging HW", "Clinical Trial Tech", "Hospital Ops", "Digital Pathology", "FemTech",
    ],
    "Retail, Commerce & Marketplaces": [
        "eCommerce Platforms", "Marketplaces", "Checkout/Conversion", "Personalization", "Inventory/Pricing",
        "Returns", "Social Commerce", "BNPL", "Retail Media", "POS/Omnichannel",
    ],
    "Sales, Marketing & CX": [
        "CRM/RevOps", "Sales Enablement", "Marketing Automation", "AdTech/Attribution", "GenAI Creative",
        "Conversational AI/Contact Center", "VoC/Surveys", "Product Analytics", "Community", "CPQ/Contracts",
    ],
    "Productivity & Collaboration": [
        "Docs/Notes", "Work Mgmt/PMO", "Email/Chat/Video", "Knowledge/Search", "Automation/Agents",
        "Meeting Intelligence", "Whiteboarding", "OKRs/Goals", "File Sync", "Copilots",
    ],
    "HRTech & Future of Work": [
        "ATS", "HCM/Payroll/Benefits", "L&D", "Performance/OKRs", "Scheduling/WFM", "Background Checks",
        "Gig Platforms", "DEI/Engagement", "Compliance", "EOR",
    ],
    "EdTech": [
        "K-12", "Higher-Ed", "Test Prep", "Corporate LXP", "Language Learning", "STEM/Coding",
        "Tutor Marketplaces", "Credentialing/Skills Graph", "VR/AR Learning", "Teacher/Admin",
    ],
    "LegalTech": [
        "eDiscovery", "CLM", "Research/Drafting (AI)", "IP Mgmt", "Case Mgmt", "Compliance",
        "Notary/ID", "Litigation Funding", "Practice Mgmt", "Firm Ops/BI",
    ],
    "GovTech & Defense": [
        "Citizen Services", "Gov Data/Interop", "Public Safety", "Smart Cities", "Defense/Autonomy",
        "FinOps/Procurement", "Digital ID", "Civic/Elections", "ISR/Space", "RegTech for Agencies",
    ],
    "Climate, Energy & Sustainability": [
        "Renewables", "Grid/DER", "Building Energy Mgmt", "Carbon Accounting/MRV", "CCUS/Removal",
        "Batteries/Materials", "EV/Charging", "Circular/Recycle", "Ag-climate/Soil", "WaterTech",
    ],
    "Mobility & Transportation": [
        "Autonomy/ADAS", "MaaS", "Fleet/Telematics", "Routing/Dispatch", "Micro-mobility",
        "Rail/Maritime/Aviation Ops", "Aftermarket/Repair", "Parking/Tolling", "HMI/Infotainment",
        "Mobility Finance/Insurance",
    ],
    "Supply Chain & Logistics": [
        "WMS/TMS/YMS", "Freight Marketplaces", "Visibility/ETA", "Demand Planning", "S&OP/Inventory Opt",
        "Procurement/Sourcing", "Cross-border/Customs", "Last-mile/Returns", "Cold Chain", "Trade Finance",
    ],
    "Manufacturing, Industrial & Robotics": [
        "IIoT", "MES/SCADA/Twins", "Predictive Maintenance", "Visual Inspection (AI)", "AMRs/Robotics",
        "Additive/Adv Mfg", "PLM/CAD/CAM", "Factory Safety", "Industrial Analytics", "Spares Marketplaces",
    ],
    "Construction & PropTech": [
        "AEC/BIM", "Jobsite/Project Mgmt", "Estimating/Bidding", "Prop Mgmt/Leasing", "Broker/MLS/Portals",
        "Smart Buildings", "FM/Maintenance", "Mortgages/Transactions", "Tenant Experience", "Construc-Fin/Ins",
    ],
    "Consumer Social & Media": [
        "Social/Communities", "Creator Monetization", "Streaming/Short-video", "Audio/Podcasts", "Publishing",
        "UGC Safety", "Virtual Events", "Fan Engagement", "Dating", "Virtual Humans",
    ],
    "Gaming & Interactive": [
        "Studios", "Engines/Tools", "UGC/Modding", "eSports", "Cloud Gaming", "Live-ops/Analytics",
        "Monetization/IAP", "Web3 Gaming", "XR/Spatial", "Anti-cheat/Safety",
    ],
    "Design, Creative & Content": [
        "Design Systems/Proto", "Video/Audio Editing", "3D/Assets", "Creative Ops", "Templates/Stock",
        "Generative Media", "Localization", "Doc Automation", "Creative Collab", "DAM",
    ],
    "Crypto, Web3 & Digital Assets": [
        "Exchanges/Custody", "DeFi/Stablecoins", "Wallets/ID", "NFTs", "L1/L2/Infra", "Oracles/Indexing",
        "Compliance/Analytics", "RWA/Tokenization", "On-/Off-ramps", "Metaverse/Gaming",
    ],
    "Telecom & Connectivity": [
        "5G/Open RAN", "Edge/SD-WAN", "Satellite/Space Internet", "IoT/eSIM", "NetOps/Automation",
        "OSS/BSS", "Private 5G", "Spectrum", "Rural", "Telco Cloud",
    ],
    "Semiconductors & Advanced Compute": [
        "EDA/Chip Design", "AI Accelerators", "RISC-V", "Packaging/Advanced Nodes", "Photonic/Analog",
        "Verification/DFT", "Firmware/RTOS", "FPGA/Embedded", "Chiplets/Interconnect", "Foundry/SCM",
    ],
    "Quantum Tech": [
        "Hardware", "SDKs/Platforms", "Error-correction/Compilers", "Sensing", "Networking",
        "Cryo/Control", "Post-quantum Crypto", "Apps (Chem/Finance)", "Hybrid HPC+Quantum", "Benchmarks/Evals",
    ],
    "Aerospace & SpaceTech": [
        "Launch/Propulsion", "Satellites/Constellations", "Earth Observation", "Space Data", "In-space Mfg",
        "Servicing/Logistics", "GNSS/Nav", "SSA", "Insurance/Finance", "Dual-use",
    ],
    "Agriculture & Food": [
        "Precision Ag", "Ag Robotics/Drones", "Crop Models", "Traceability", "Alt Proteins/Cultivated",
        "Ag Finance/Marketplaces", "Food Safety", "Farm Mgmt", "Cold Chain", "Food Waste",
    ],
    "Travel & Hospitality": [
        "Booking/Meta", "Revenue Mgmt", "Guest Experience", "Airline/Rail Ops", "Tours/Activities",
        "Corp Travel/Expense", "Loyalty", "Events/MICE", "Travel Risk", "Sustainability/Offsets",
    ],
    "Sports & Wellness": [
        "Athlete Analytics", "Fan/Ticketing", "Connected Fitness", "Nutrition", "Mental Wellness",
        "Recovery/Physio", "Wearables/Coaching", "Venue Ops", "Media/Rights", "eSports x Sports",
    ],
    "Household, Family & Pets": [
        "Parenting/Child Dev", "STEM Kits", "Home Services", "Smart Home/IoT", "Family Banking",
        "Elder Care", "Pet Health/Insurance", "Home Fitness", "Safety/Monitoring", "Personal Agents",
    ],
    "Materials, Mining & Industrial Resources": [
        "Advanced Materials", "Critical Minerals", "Geospatial/Exploration", "Safety/Env Monitoring",
        "Recycling/Upcycling", "Process Opt", "Industrial Marketplaces", "Additives/Chemicals", "Coatings",
        "Scale-up",
    ],
    "Financial & Corporate Software": [
        "ERP/GL", "Spend/Procure", "AP/AR/Collections", "Tax/Compliance", "Close/Consol", "BI/FP&A",
        "Treasury/Cash", "Billing/RevRec", "Quote-to-Cash", "IR/ESG",
    ],
    "Privacy, Compliance & Trust": [
        "Consent/Prefs", "DPaaS", "Sovereign Cloud", "PII Discovery/Tokenization", "Audit/Monitoring",
        "Policy-as-Code", "AI Governance/Ethics", "Third-party Risk", "Secure Collab", "Content Safety",
    ],
    "IoT, Edge & Hardware": [
        "Sensors", "Edge Compute/Gateways", "Digital Twins", "Remote Monitoring", "Firmware/OTA",
        "Industrial Edge", "Smart City Devices", "Building IoT", "Consumer Devices", "Device Security",
    ],
    "Nonprofit & Impact": [
        "Philanthropy", "Impact MRV", "Fundraising/CRM", "Civic/Open Data", "Education Access",
        "Health Access", "Climate/Conservation", "Refugee/Disaster", "Gov–NGO", "Social Finance",
    ],
}


def read_startup_urls(path: Path) -> List[str]:
    """Load startup URLs from a newline-delimited text file or a CSV.

    When the input is a CSV, this function reads the 'Organization Website' column.
    """
    urls: List[str] = []
    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            if "Organization Website" not in headers:
                raise RuntimeError("Input CSV missing required 'Organization Website' column")
            for row in reader:
                u = (row.get("Organization Website") or "").strip()
                if u:
                    urls.append(u)
        return urls

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if line:
            urls.append(line)
    return urls


def infer_startup_name(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc or parsed.path
    host = host.replace("www.", "")
    name = host.split(".")[0]
    return name.capitalize()


def serp_web_search(query: str, num_results: int = 5) -> Dict[str, Any]:
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise RuntimeError("SERPAPI_API_KEY must be set in the environment for web search")
    if not query:
        raise ValueError("serp_web_search requires a non-empty query")

    params = {
        "engine": "google",
        "q": query,
        "api_key": api_key,
        "num": num_results,
    }
    url = os.getenv("SERP_API_URL", "https://serpapi.com/search.json")
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    results = []
    for item in data.get("organic_results", [])[:num_results]:
        results.append(
            {
                "title": item.get("title"),
                "link": item.get("link"),
                "snippet": item.get("snippet"),
            }
        )
    return {"query": query, "results": results}


def _coerce_to_text(value: Any) -> str | None:
    """Best-effort conversion of various SDK objects or dicts to plain text."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    # Prefer a 'text' attribute if present
    text_attr = getattr(value, "text", None)
    if isinstance(text_attr, str) and text_attr:
        return text_attr
    # If dict-like, try common keys
    if isinstance(value, dict):
        for k in ("text", "content", "value", "message"):
            v = value.get(k)
            if isinstance(v, str) and v:
                return v
    # Fallback: stringify
    try:
        return str(value)
    except Exception:  # noqa: BLE001
        return None


def extract_text_from_message_blocks(blocks: Iterable[Any] | None) -> str:
    """Extract text from message content blocks.

    Handles dict-based blocks and SDK object instances (e.g., ResponseOutputText, TextContentBlock).
    """
    if not blocks:
        return ""
    texts: List[str] = []
    for block in blocks:
        text = _coerce_to_text(block)
        if text:
            texts.append(text)
    return "\n".join(texts)


# ------- Logging helpers -------
LOG_PREVIEW_CHARS = 220
MAX_MODEL_RETRIES = 3
RETRY_BASE_DELAY_S = 1.5


def log(msg: str) -> None:
    print(f"[serp] {msg}")


def safe_preview(text: str | None, limit: int = LOG_PREVIEW_CHARS) -> str:
    if not text:
        return ""
    s = str(text).replace("\n", " ")
    return s[:limit] + ("..." if len(s) > limit else "")


def _canonical_host(u: str) -> str:
    try:
        p = urlparse(u)
        host = p.netloc or p.path or ""
        return host.replace("www.", "").strip().lower()
    except Exception:
        return ""


def _likely_same_site(root: str, link: str) -> bool:
    a = _canonical_host(root)
    b = _canonical_host(link)
    if not a or not b:
        return False
    if a == b:
        return True
    # Allow subdomains (b endswith a)
    return b.endswith("." + a)


def _strip_html(html_text: str) -> str:
    # Remove scripts/styles
    html_text = re.sub(r"<script[\s\S]*?</script>", " ", html_text, flags=re.IGNORECASE)
    html_text = re.sub(r"<style[\s\S]*?</style>", " ", html_text, flags=re.IGNORECASE)
    # Remove tags
    text = re.sub(r"<[^>]+>", " ", html_text)
    # Unescape entities and collapse whitespace
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fetch_page_text(page_url: str, timeout_s: int = 15) -> str:
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        resp = requests.get(page_url, headers=headers, timeout=timeout_s)
        if resp.status_code >= 400:
            log(f"SERP fetch: {page_url} -> HTTP {resp.status_code}")
            return ""
        content = resp.text or ""
        return _strip_html(content)
    except Exception as exc:  # noqa: BLE001
        log(f"SERP fetch error for {page_url}: {exc}")
        return ""


def fetch_page_text_rendered(page_url: str, timeout_ms: int = 15000) -> str:
    """Fetch fully rendered HTML via Playwright (if available), then strip to text."""
    if not HAS_PLAYWRIGHT:
        return ""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(ignore_https_errors=True)
            page = context.new_page()
            page.set_default_navigation_timeout(timeout_ms)
            page.set_default_timeout(timeout_ms)
            page.goto(page_url, wait_until="networkidle")
            # Gentle scroll to trigger lazy-loaded content
            try:
                page.evaluate(
                    "() => new Promise(res => { let y=0; const id=setInterval(()=>{ window.scrollBy(0, 800); if (window.scrollY>y) { y=window.scrollY; } else { clearInterval(id); res(); } }, 200); })"
                )
            except Exception:
                pass
            html_content = page.content()
            context.close()
            browser.close()
        return _strip_html(html_content or "")
    except Exception as exc:  # noqa: BLE001
        log(f"Playwright fetch error for {page_url}: {exc}")
        return ""


def _score_candidate(link: str, title: str | None, snippet: str | None) -> int:
    """Heuristic score to prioritize pages (products, services, blog, research, engineering, docs)."""
    score = 0
    try:
        path = (urlparse(link).path or "").lower()
    except Exception:
        path = link.lower()
    t = (title or "").lower()
    sn = (snippet or "").lower()

    # Strong positive path indicators
    path_weights = {
        "product": 8,
        "products": 8,
        "platform": 7,
        "solution": 7,
        "solutions": 7,
        "use-cases": 6,
        "usecases": 6,
        "case-studies": 6,
        "case-study": 6,
        "blog": 6,
        "posts": 5,
        "article": 5,
        "insights": 5,
        "research": 7,
        "engineering": 7,
        "technology": 5,
        "tech": 5,
        "docs": 4,
        "documentation": 4,
        "developer": 4,
        "api": 4,
        "pricing": 3,
        "whitepaper": 6,
    }
    for key, w in path_weights.items():
        if f"/{key}" in path:
            score += w

    # Negative path indicators we want to avoid
    neg_weights = {
        "careers": -6,
        "jobs": -6,
        "privacy": -8,
        "terms": -8,
        "legal": -8,
        "cookie": -6,
        "gdpr": -6,
        "press": -2,
        "media": -2,
        "brand": -2,
        "about": -2,
        "contact": -4,
        "status": -4,
    }
    for key, w in neg_weights.items():
        if f"/{key}" in path:
            score += w

    # Content signals in title/snippet
    ai_terms = [
        " ai", "genai", " llm", "gpt", "rag", "embedding", "transformer", "bert", "llama", "mistral",
        "claude", "gemini", "machine learning", "ml ", "nlg", "nlp", "computer vision", "retrieval",
    ]
    product_terms = ["product", "platform", "solution", "service", "features", "technology"]
    blog_terms = ["blog", "post", "article", "research", "engineering", "whitepaper", "insight"]

    for term in ai_terms:
        if term in t or term in sn:
            score += 3
    for term in product_terms:
        if term in t or term in sn:
            score += 2
    for term in blog_terms:
        if term in t or term in sn:
            score += 2

    return score


def gather_serp_context(root_url: str, max_pages: int = 5, max_chars: int = 8000) -> str:
    """Use SerpAPI to discover a few key pages on the official site and fetch text excerpts.

    Priority order: products/services/platform/solutions, then blog/research/engineering, then docs/API, then pricing.
    Strict limits: up to max_pages pages and max_chars characters of context.
    """
    if not root_url or not root_url.startswith("http"):
        return ""

    host = _canonical_host(root_url)
    if not host:
        return ""

    queries = [
        f"site:{host} product OR platform OR solution",
        f"site:{host} blog OR research OR engineering",
        f"site:{host} docs OR api OR developer",
        f"site:{host} features OR technology",
        f"site:{host} ai OR genai OR llm",
        f"site:{host} pricing OR plans",
    ]

    seen: set[str] = set()
    candidates: list[dict] = []

    # Seed with homepage as a candidate (baseline score)
    candidates.append({
        "link": root_url,
        "title": "Homepage",
        "snippet": "",
        "score": 5,
    })
    seen.add(root_url)

    # Collect candidates from SERP (without fetching yet)
    for q in queries:
        try:
            sr = serp_web_search(q, num_results=6)
        except Exception as exc:  # noqa: BLE001
            log(f"SERP query failed: {q} -> {exc}")
            continue
        results = sr.get("results", [])
        for item in results:
            link = (item.get("link") or "").strip()
            if not link or link in seen:
                continue
            if not _likely_same_site(root_url, link):
                continue
            title = item.get("title") or ""
            snippet = item.get("snippet") or ""
            score = _score_candidate(link, title, snippet)
            candidates.append({"link": link, "title": title, "snippet": snippet, "score": score})
            seen.add(link)
            log(f"SERP candidate: score={score} | {link} | {title}")

    # Rank candidates and fetch top pages until limits reached
    candidates.sort(key=lambda x: x.get("score", 0), reverse=True)
    chunks: list[str] = []
    total_chars = 0
    used = 0
    for cand in candidates:
        if used >= max_pages:
            break
        link = cand["link"]
        text = fetch_page_text_rendered(link) or fetch_page_text(link)
        if not text:
            continue
        snippet = text[:2500] + ("..." if len(text) > 2500 else "")
        piece = f"URL: {link}\n{snippet}"
        prospective = total_chars + len(piece) + (4 if chunks else 0)
        if chunks and prospective > max_chars:
            log(f"SERP context limit hit (chars) before adding {link}")
            break
        chunks.append(piece)
        total_chars += len(piece) + (4 if len(chunks) > 1 else 0)
        used += 1
        log(f"SERP context: added {link} (ranked, chars so far={total_chars}, used={used}/{max_pages})")

    context = "\n\n---\n\n".join(chunks)
    if len(context) > max_chars:
        context = context[:max_chars] + "\n..."
    log(f"SERP context assembled: {len(chunks)} page(s), {len(context)} chars (prioritized)")
    return context

def run_analysis_for_startup(
    client: OpenAI,
    startup_name: str,
    url: str,
    model: str,
    org_description: str | None = None,
    org_industries: str | None = None,
) -> Dict[str, Any]:
    log(f"Building prompt for {startup_name} ({url})")
    taxonomy_json = json.dumps(TAXONOMY, ensure_ascii=False)
    system_prompt = (
        "You are a startup domain analyst. Classify the company's verticals and summarize their offering. "
        "Ground claims STRICTLY in verifiable descriptions from official sources: the provided CSV fields (Organization Description, Organization Industries) and the company's OFFICIAL WEBSITE. "
        "Do NOT hallucinate or invent details. If information is not available from these sources, leave the field empty (\"\") or set booleans to false. Return ONLY a valid "
        "single-line JSON object with these keys: \n"
        "- startup_name (string)\n"
        "- url (string)\n"
        "- products_summary (string, concise)\n"
        "- startup_vertical (string; primary industry vertical, e.g., Banking, Payments, Insurtech, Healthtech, DevTools, etc.)\n"
        "- startup_sub_vertical (string; more specific sub-vertical, e.g., BNPL, KYC, Claims, FP&A, RAG infra, etc.)\n"
        "- use_case (string, concise)\n"
        "- uses_genai (boolean; uses LLMs or other GenAI models)\n"
        "- genai_details (string; if uses_genai is true, explain how GenAI/LLMs are used; else empty)\n"
        "- uses_traditional_ml (boolean; uses traditional ML or CV, non-generative)\n"
        "- ml_details (string; if uses_traditional_ml is true, explain briefly; else empty)\n"
        "- unique_value (string; 1-2 sentences on differentiation/secret sauce)\n"
        "- site_context_summary (string; 2-3 sentences summarizing fetched website context, focusing on products/services and AI/GenAI usage and implementation; leave empty if no context)\n"
        "- evidence (array of short strings citing sources or quotes).\n"
        "Use ONLY the following taxonomy for startup_vertical and startup_sub_vertical (exact strings, case-sensitive):\n"
        f"{taxonomy_json}\n"
        "Hard constraints: do NOT invent providers, models, features or product claims not supported by the sources. Evidence must cite only the CSV fields or the official website (by URL and/or short quote).\n"
        "Self-check (internal, do NOT output the check): verify all required keys are present; booleans are strictly true/false; evidence is an array of up to 3 short items; startup_vertical is EXACTLY one of the taxonomy keys; startup_sub_vertical is EXACTLY one item from that key's list; and the final answer is ONE single-line JSON object. Fix issues before returning.\n"
        "Output JSON only. No prose, no markdown, no tool logs."
    )
    desc_block = f"\nOrganization Description (from CSV): {org_description}" if org_description else ""
    industries_block = f"\nOrganization Industries (from CSV): {org_industries}" if org_industries else ""
    serp_ctx = ""
    try:
        serp_ctx = gather_serp_context(url, max_pages=5, max_chars=6000)
    except Exception as exc:  # noqa: BLE001
        log(f"SERP context error: {exc}")
        serp_ctx = ""
    context_block = f"\n\nWebsite context (SERP-crawled excerpts):\n{serp_ctx}\n" if serp_ctx else ""
    user_prompt = (
        f"Startup URL: {url}\nStartup name: {startup_name}.{desc_block}{industries_block}{context_block}\n"
        "Task: Identify their products, classify the startup_vertical and startup_sub_vertical, and state the primary use_case. "
        "Then assess if they use GenAI/LLMs (uses_genai) and describe briefly (genai_details). If they use traditional ML/CV (non-generative), set uses_traditional_ml=true and describe briefly (ml_details). "
        "Provide a short 'unique_value' explanation (1-2 sentences) focusing on differentiation/secret sauce. "
        "Do NOT make up information: if a detail is not supported by the provided CSV or the official site, leave it empty or set the boolean to false. "
        "Based ONLY on the 'Website context' above and CSV fields, provide 'site_context_summary' (2-3 sentences) that captures what the company/product does and any explicit AI/GenAI details disclosed; leave empty if insufficient context. "
        "Before returning, perform an internal self-reflection to ensure the output matches the required JSON keys and types; then output ONLY the final single-line JSON object."
    )

    # Compose a single string input to mirror the minimal call style
    prompt = f"{system_prompt}\n\n{user_prompt}"
    log(
        f"Prompt chars: {len(prompt)} | desc chars: {len(org_description or '')} | serp_ctx chars: {len(serp_ctx)} | preview: {safe_preview(prompt)}"
    )

    response = None
    last_exc: Exception | None = None
    for attempt in range(1, MAX_MODEL_RETRIES + 1):
        t0 = time.time()
        log(f"Calling model via client.responses.create() (attempt {attempt}/{MAX_MODEL_RETRIES})")
        try:
            response = client.responses.create(
                model=model,
                input=prompt,
            )
            dt = time.time() - t0
            log(f"Model call finished in {dt:.2f}s on attempt {attempt}")
            break
        except Exception as exc:  # noqa: BLE001
            dt = time.time() - t0
            last_exc = exc
            # Heuristic: retry on timeouts and transient server errors
            msg = str(exc).lower()
            status = getattr(exc, "status", None) or getattr(exc, "status_code", None)
            transient = ("timeout" in msg) or (status in (429, 500, 502, 503, 504))
            log(f"Model call failed in {dt:.2f}s on attempt {attempt}: {exc} | transient={transient} status={status}")
            if transient and attempt < MAX_MODEL_RETRIES:
                delay = RETRY_BASE_DELAY_S * (2 ** (attempt - 1))
                log(f"Retrying in {delay:.1f}s...")
                time.sleep(delay)
                continue
            # Not retrying further
            raise

    # Safety: if response still None (shouldn't happen unless raised), raise last error
    if response is None and last_exc is not None:  # pragma: no cover
        raise last_exc

    # Prefer the SDK's aggregate text if available, otherwise coerce from blocks
    final_text: str | None = _coerce_to_text(getattr(response, "output_text", None))
    if not final_text:
        final_text = extract_text_from_message_blocks(getattr(response, "output", None))

    if not final_text:
        raise RuntimeError("Model did not return a message")

    try:
        parsed = json.loads(final_text)
        log(f"LLM JSON parsed OK for {startup_name}")
    except json.JSONDecodeError:
        log(f"LLM returned non-JSON for {startup_name}; preview: {safe_preview(final_text)}")
        parsed = {
            "startup_name": startup_name,
            "url": url,
            "products_summary": "",
            "startup_vertical": "",
            "startup_sub_vertical": "",
            "use_case": final_text,
            "evidence": "Model response could not be parsed as JSON.",
            "uses_genai": False,
            "genai_details": "",
            "uses_traditional_ml": False,
            "ml_details": "",
            "unique_value": "",
            "site_context_summary": "",
        }

    parsed.setdefault("startup_name", startup_name)
    parsed.setdefault("url", url)
    parsed.setdefault("products_summary", "")
    parsed.setdefault("startup_vertical", "")
    parsed.setdefault("startup_sub_vertical", "")
    parsed.setdefault("use_case", "")
    parsed.setdefault("uses_genai", False)
    parsed.setdefault("genai_details", "")
    parsed.setdefault("uses_traditional_ml", False)
    parsed.setdefault("ml_details", "")
    parsed.setdefault("unique_value", "")
    parsed.setdefault("site_context_summary", "")
    return parsed


def write_results_csv(results: Iterable[Dict[str, Any]], path: Path) -> None:
    fieldnames = [
        "startup_name",
        "url",
        "products_summary",
        "startup_vertical",
        "startup_sub_vertical",
        "use_case",
        "uses_genai",
        "genai_details",
        "uses_traditional_ml",
        "ml_details",
        "unique_value",
        "site_context_summary",
        "evidence",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in results:
            # Flatten evidence list to a single string if needed
            evidence = row.get("evidence", "")
            if isinstance(evidence, list):
                evidence_str = " | ".join(str(x) for x in evidence)
            else:
                evidence_str = str(evidence or "")
            out_row = {key: row.get(key, "") for key in fieldnames}
            out_row["evidence"] = evidence_str
            writer.writerow(out_row)


def build_client() -> OpenAI:
    load_dotenv()

    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("AZURE_OPENAI_API_KEY must be present in the environment")

    # Hardcoded to match call_azure_openai.py example
    return OpenAI(
        api_key=api_key,
        base_url="https://aoai-ep-swedencentral02.openai.azure.com/openai/v1/",
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(STARTUPS_FILE),
        help="Path to 2508_inv.csv (must include 'Organization Website' and 'Organization Description' columns)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(OUTPUT_CSV),
        help="Output CSV path (a copy of input with appended analysis columns)",
    )
    args = parser.parse_args(argv)

    if args.input.suffix.lower() != ".csv":
        raise RuntimeError("This script expects a CSV input (e.g., 2508_inv.csv)")

    client = build_client()

    model = DEFAULT_MODEL_DEPLOYMENT
    print(f"Using Azure OpenAI deployment: {model}")
    out_abs = args.output.resolve()
    log(f"Output will be written to: {out_abs}")

    # Read input and prepare output schema
    with args.input.open("r", encoding="utf-8") as fin, args.output.open("w", newline="", encoding="utf-8") as fout:
        reader = csv.DictReader(fin)
        original_fieldnames = reader.fieldnames or []
        if "Organization Website" not in original_fieldnames:
            raise RuntimeError("Input CSV missing required 'Organization Website' column")

        # Analysis columns to append
        analysis_cols = [
            "products_summary",
            "startup_vertical",
            "startup_sub_vertical",
            "use_case",
            "uses_genai",
            "genai_details",
            "uses_traditional_ml",
            "ml_details",
            "unique_value",
            "site_context_summary",
            "evidence",
        ]

        out_fieldnames = original_fieldnames + [c for c in analysis_cols if c not in original_fieldnames]

        writer = csv.DictWriter(fout, fieldnames=out_fieldnames)
        writer.writeheader()
        fout.flush()
        try:
            info = os.stat(out_abs)
            log(f"Header written to {out_abs} (size={info.st_size} bytes)")
        except Exception:
            pass

        total = 0
        for idx, row in enumerate(reader, start=1):
            url = (row.get("Organization Website") or "").strip() or "N/A"
            desc = (row.get("Organization Description") or "").strip()
            industries = (row.get("Organization Industries") or "").strip()
            startup_name = infer_startup_name(url) if url and url != "N/A" else (row.get("Transaction Name") or "").split(" - ")[-1].strip() or "Startup"

            log(
                f"[{idx}] Start: {startup_name} ({url}); desc chars: {len(desc)} | industries: {safe_preview(industries, 120)}"
            )
            try:
                analysis = run_analysis_for_startup(
                    client, startup_name, url, model=model, org_description=desc, org_industries=industries
                )
                print(f"Processed {startup_name} ({url})")
                log(f"[{idx}] Parsed keys: {list(analysis.keys())}")
            except Exception as exc:  # noqa: BLE001
                print(f"Failed to process {url}: {exc}", file=sys.stderr)
                log(f"[{idx}] Error: {exc}")
                analysis = {
                    "products_summary": "",
                    "startup_vertical": "",
                    "startup_sub_vertical": "",
                    "use_case": "",
                    "uses_genai": "",
                    "genai_details": f"Error: {exc}",
                    "uses_traditional_ml": "",
                    "ml_details": "",
                    "unique_value": "",
                    "evidence": f"Error: {exc}",
                }

            # Flatten evidence for output
            evidence = analysis.get("evidence", "")
            if isinstance(evidence, list):
                evidence_str = " | ".join(str(x) for x in evidence)
            else:
                evidence_str = str(evidence or "")

            out_row = dict(row)
            out_row.update({k: analysis.get(k, "") for k in analysis_cols})
            out_row["evidence"] = evidence_str

            # Ensure all fields exist
            for col in out_fieldnames:
                out_row.setdefault(col, "")

            writer.writerow(out_row)
            fout.flush()
            total += 1
            try:
                info = os.stat(out_abs)
                log(f"Wrote row {total} to {out_abs} (size={info.st_size} bytes)")
            except Exception:
                log(f"Wrote row {total} to {out_abs}")

    log(f"Finished writing rows to {out_abs}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
