"""
Generate personalized UI schema using Azure OpenAI GPT-5 Responses API.

This script reads user traits from the browser's IndexedDB (via manual export or
simulation) and calls GPT-5 to generate a UISchema JSON file.

Usage:
    python scripts/genui_llm_composer.py [--traits-file TRAITS.json]

If no traits file is provided, uses sample traits for demo purposes.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_FILE = PROJECT_ROOT / "public" / "llm_schema.json"

# Azure OpenAI configuration
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv(
    "AZURE_OPENAI_ENDPOINT",
    "https://aoai-ep-swedencentral02.openai.azure.com/openai/v1/",
)
DEFAULT_MODEL = "gpt-5-mini"

# System prompt with UISchema contract and rules
SYSTEM_PROMPT = """You are a UI layout composer for a modern banking app. Your task is to generate a personalized UI schema based on user behavior and preferences.

# UISchema Contract

type ActionId = "TRANSFER" | "PAY_BILL" | "FX" | "OPEN_SAVINGS";

type UISchema = {
  version: "1.0",
  sections: Array<
    | { id: string; component: "HeroCard"; props: { title: string; subtitle?: string } }
    | { id: string; component: "ActionGrid"; props: { actions: { label: string; actionId: ActionId }[] } }
    | { id: string; component: "FXRates"; props: { expanded?: boolean } }
    | { id: string; component: "Balances"; props: {} }
    | { id: string; component: "OffersCard"; props: { title: string; body: string; cta?: { text: string; actionId: ActionId } } }
    | { id: string; component: "RecentBeneficiaries"; props: { aliases: string[] } }
    | { id: string; component: "ContinueBillPay"; props: { visible: boolean } }
  >;
};

# Constraints

1. JSON only, ≤5 sections
2. Always include "Balances" and "ActionGrid" components
3. Only use allowlisted ActionIds: TRANSFER, PAY_BILL, FX, OPEN_SAVINGS
4. Locale: if TR → use Turkish copy; else English
5. Neutral copy (no fees/rates/APR/claims), no PII
6. Aliases only for beneficiaries (e.g., "Alias-A", "Alias-B")

# Layout Rules

1. If fxAffinity > 0.4 → include FXRates near top; expanded=true if "exchange" searched ≥2× in last 7 days
2. If transferAffinity > 0.4 → prioritize TRANSFER or PAY_BILL based on topActions
3. If lastPaths contains /payments/utilities → PAY_BILL first in ActionGrid
4. If aliases exist → include RecentBeneficiaries with 2–3 masked strings
5. If explorerScore high or Savings dwell detected → include OffersCard (Auto-Save) with OPEN_SAVINGS CTA
6. If incompleteBillPay → include ContinueBillPay with visible=true
7. Respect prefersDense; keep copy concise
8. Obey locale (TR/EN)

# Self-Check

Before returning:
- Valid JSON?
- ≤5 sections?
- Includes Balances and ActionGrid?
- All ActionIds from allowlist?
- Locale matches user?
- No PII or hard-coded rates?

Return JSON only, no markdown."""


def build_user_prompt(traits: dict) -> str:
    """Build user prompt from traits."""
    behavior = {
        "fxAffinity": traits.get("fxAffinity", 0),
        "transferAffinity": traits.get("transferAffinity", 0),
        "explorerScore": traits.get("explorerScore", 0),
        "topActions": traits.get("topActions", []),
        "lastPaths": traits.get("lastPaths", []),
        "searchTerms": traits.get("searchTerms", [])[:5],  # top 5
        "incompleteBillPay": traits.get("incompleteBillPay"),
    }

    prefs = {
        "locale": traits.get("locale", "en"),
        "prefersDense": traits.get("prefersDense", False),
        "darkMode": traits.get("darkMode", False),
    }

    return f"""Generate a personalized UI schema for this user:

# User Traits
{json.dumps(behavior, indent=2)}

# User Preferences
{json.dumps(prefs, indent=2)}

Return a valid UISchema JSON object following all constraints and rules."""


def build_client() -> OpenAI:
    """Build Azure OpenAI client."""
    if not AZURE_OPENAI_API_KEY:
        raise RuntimeError("AZURE_OPENAI_API_KEY must be set in environment")

    return OpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        base_url=AZURE_OPENAI_ENDPOINT,
    )


def generate_schema(client: OpenAI, traits: dict, model: str) -> dict:
    """Call GPT-5 to generate UI schema using Responses API."""
    user_prompt = build_user_prompt(traits)
    full_input = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

    print(f"Calling Azure OpenAI {model} via responses.create()...")
    print(f"Input length: {len(full_input)} chars")

    try:
        # Call responses.create() API as per analyze_startups pattern
        response = client.responses.create(
            model=model,
            input=full_input,
        )

        # Extract text from response - try multiple paths
        output_text = None
        
        # Try output_text attribute first
        if hasattr(response, "output_text") and response.output_text:
            output_text = response.output_text
        # Try output attribute
        elif hasattr(response, "output") and response.output:
            output_text = response.output
        # Try choices path (fallback for different API versions)
        elif hasattr(response, "choices") and len(response.choices) > 0:
            choice = response.choices[0]
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                output_text = choice.message.content
            elif hasattr(choice, "text"):
                output_text = choice.text

        if not output_text:
            raise RuntimeError(f"Could not extract text from response: {response}")

        print(f"✓ Response received ({len(output_text)} chars)")

        # Clean up response (remove markdown code blocks if present)
        output_text = output_text.strip()
        if output_text.startswith("```json"):
            output_text = output_text[7:]
        if output_text.startswith("```"):
            output_text = output_text[3:]
        if output_text.endswith("```"):
            output_text = output_text[:-3]
        output_text = output_text.strip()

        # Parse JSON
        schema = json.loads(output_text)
        print("✓ JSON parsed successfully")
        return schema

    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}", file=sys.stderr)
        print(f"Response preview: {output_text[:500] if output_text else 'None'}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"❌ API call failed: {e}", file=sys.stderr)
        raise


def validate_schema(schema: dict) -> bool:
    """Basic validation of generated schema."""
    if schema.get("version") != "1.0":
        print("❌ Invalid version", file=sys.stderr)
        return False

    sections = schema.get("sections", [])
    if not sections or len(sections) > 5:
        print(f"❌ Invalid section count: {len(sections)}", file=sys.stderr)
        return False

    # Check for required components
    components = [s.get("component") for s in sections]
    if "Balances" not in components or "ActionGrid" not in components:
        print("❌ Missing required components (Balances, ActionGrid)", file=sys.stderr)
        return False

    print("✅ Schema validation passed")
    return True


def get_sample_traits() -> dict:
    """Return sample traits for demo."""
    return {
        "fxAffinity": 0.6,
        "transferAffinity": 0.3,
        "explorerScore": 0.4,
        "topActions": ["FX", "TRANSFER"],
        "lastPaths": ["/", "/exchange", "/transfers"],
        "searchTerms": [
            {"term": "exchange rates", "count": 3, "lastSeen": 1234567890},
        ],
        "incompleteBillPay": None,
        "locale": "en",
        "prefersDense": False,
        "darkMode": False,
    }


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate UI schema using Azure OpenAI GPT-5"
    )
    parser.add_argument(
        "--traits-file",
        type=Path,
        help="Path to JSON file with user traits (optional, uses sample if not provided)",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Azure OpenAI model deployment name (default: {DEFAULT_MODEL})",
    )

    args = parser.parse_args()

    # Load or generate traits
    if args.traits_file and args.traits_file.exists():
        print(f"Loading traits from {args.traits_file}")
        with open(args.traits_file) as f:
            traits = json.load(f)
    else:
        print("Using sample traits (no traits file provided)")
        traits = get_sample_traits()

    # Build client
    client = build_client()

    # Generate schema
    schema = generate_schema(client, traits, args.model)

    # Validate
    if not validate_schema(schema):
        sys.exit(1)

    # Write to output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(schema, f, indent=2)

    print(f"✅ Schema written to {OUTPUT_FILE}")
    print("\nTo use this schema:")
    print("1. Open the app in your browser")
    print("2. Enable 'Use AI Layout' in settings")
    print("3. Reload the page")


if __name__ == "__main__":
    main()
