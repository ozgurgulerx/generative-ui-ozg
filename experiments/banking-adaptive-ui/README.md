# Banking Adaptive UI Demo

A modern, frontend-only banking demo that removes UX friction via runtime adaptive UI. The app learns from user behavior (with consent) and adapts the interface to prioritize frequently-used actions, remember navigation patterns, and provide contextual suggestions.

## What it does

- **Mini-CDP**: Tracks behavioral events (views, clicks, actions, searches, journeys) with user consent
- **Adaptive UX**: Dynamically adjusts UI based on derived user traits (FX affinity, transfer patterns, exploration behavior)
- **Generative Layout**: Optional GPT-5 integration generates personalized UI schemas based on behavior
- **Privacy-first**: All data stored locally (IndexedDB/localStorage), no PII, clear consent gates
- **Locale support**: English and Turkish (TR) with sticky preferences

## Why it exists

Demonstrates how modern banking apps can:
1. Reduce friction by learning user patterns without server-side tracking
2. Use generative AI to compose personalized layouts
3. Maintain privacy with client-side-only data and explicit consent

## Architecture

- **Frontend**: Next.js 15 (App Router) + React 18, Tailwind CSS, shadcn/ui
- **Storage**: IndexedDB (events) + localStorage (consent/preferences)
- **Validation**: Zod for schema validation, strict TypeScript
- **LLM Integration**: Optional Python script calls Azure OpenAI GPT-5 to generate UI schemas

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+ (for optional LLM layout generation)
- Azure OpenAI API key (optional, for generative layouts)

### Install dependencies

```bash
cd experiments/banking-adaptive-ui
npm install
```

### Environment variables (optional for LLM features)

Create `.env.local`:

```bash
# Optional: for GPT-5 layout generation
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/openai/v1/
```

## Running the demo

### Development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Generate LLM layout (optional)

```bash
# First, install Python dependencies
pip install -r scripts/requirements.txt

# Set your Azure OpenAI credentials in .env (see .env.example)
# Then generate the schema (uses sample traits if no file provided)
python scripts/genui_llm_composer.py

# This writes public/llm_schema.json which the UI can read
```

### Build for production

```bash
npm run build
npm start
```

## Usage

1. **First visit**: Accept consent to enable personalization (or decline for defaults)
2. **Interact**: Use quick actions, navigate pages, search, trigger journeys
3. **See adaptations**: Reload to see the UI adapt based on your behavior
4. **Persona shortcuts**: Use toolbar buttons to simulate common user patterns
5. **Toggle LLM mode**: Enable "Use LLM Schema" to test generative layouts

## Key Features

### Adaptive scenarios

- **Action-first home**: Frequently-used actions move to the top
- **Remembered navigation**: Previously visited sections get priority
- **Contextual banners**: Show relevant offers based on dwell/exploration
- **Search recall**: Pre-expand widgets for repeated searches
- **Journey completion**: Remind users of incomplete flows
- **Locale stickiness**: Remember language preference

### Privacy controls

- Clear consent gate on first use
- View what data is tracked (no PII)
- One-click reset to clear all personalization
- Configurable suppression for dismissed banners

### Demo controls (Toolbar)

- **Consent toggle**: Enable/disable tracking
- **Density**: Switch between compact/comfortable layouts
- **Dark mode**: Theme preference
- **Locale**: EN/TR language toggle
- **LLM mode**: Use GPT-5 generated layout vs. rule-based
- **Reset**: Clear all personalization data
- **Personas**: Quick buttons to simulate user patterns

## Testing

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Playwright smoke tests (requires build to be running)
npm run test:e2e
```

## Structure

```
experiments/banking-adaptive-ui/
├── app/
│   ├── page.tsx                    # Main entry: consent → derive → render
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── HeroCard.tsx
│   ├── Balances.tsx
│   ├── ActionGrid.tsx
│   ├── FXRates.tsx
│   ├── Shortcuts.tsx
│   ├── OffersCard.tsx
│   ├── ContinueBillPay.tsx
│   └── Toolbar.tsx
├── lib/
│   ├── analytics/
│   │   ├── events.ts               # Event & Traits types
│   │   ├── tracker.ts              # autoTrackPage, track()
│   │   ├── storage.ts              # IndexedDB helpers
│   │   ├── derive.ts               # deriveTraits()
│   │   └── layout.ts               # rule-based layout selection
│   └── i18n/
│       └── strings.ts              # EN/TR translations
├── personalization/
│   ├── schema.ts                   # UISchema types + Zod
│   ├── renderer.tsx                # schema → components
│   └── llm_prompt.ts               # System/User prompts for GPT-5
├── privacy/
│   └── consent.ts                  # ensureConsent(), resetAll()
├── public/
│   └── llm_schema.json             # Generated by Python script
├── scripts/
│   └── genui_llm_composer.py       # Calls Azure OpenAI GPT-5
├── tests/
│   └── smoke.spec.ts               # Playwright tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md                       # This file
```

## Notes

- All personalization is client-side only
- No backend required (frontend-only demo)
- Python script is dev-only helper for generating layout schemas
- Beneficiaries shown as masked aliases, never real names/IBANs
- Suppressions use TTL (default 30 days, configurable)
- Event history capped at 1000 to avoid unbounded growth

## License

TBD (matches parent repo)
