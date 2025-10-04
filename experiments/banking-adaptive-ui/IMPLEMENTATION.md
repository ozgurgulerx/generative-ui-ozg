# Banking Adaptive UI - Implementation Summary

## Overview

A complete, production-ready banking demo that demonstrates adaptive UI based on user behavior. The application is entirely frontend-only, using client-side storage and optional GPT-5 integration for generative layout composition.

## Key Features Implemented

### 1. **Mini-CDP (Customer Data Platform)**
- **Event Tracking**: Comprehensive behavioral event capture
  - Views, clicks, actions (TRANSFER, PAY_BILL, FX, OPEN_SAVINGS)
  - Search queries, scroll depth, dwell time
  - Journey states (started, completed, cancelled)
- **Storage**: IndexedDB for events (capped at 1000), localStorage for preferences
- **Privacy-first**: All data stays on device, consent gate on first use

### 2. **Trait Derivation**
- **Affinities**: FX affinity, transfer affinity, explorer score
- **Recency/Frequency**: Last 5 visited paths, top 3 actions (recency-weighted)
- **Search Patterns**: Track and count search terms with timestamps
- **Journey State**: Incomplete flows detection (e.g., Bill Pay started but not completed)
- **Locale Detection**: Automatic TR locale for Turkish users

### 3. **Rule-Based Layout Engine**
- Dynamic section ordering based on user traits
- Action prioritization (e.g., Pay Bill first if /payments/utilities visited)
- Contextual widgets (FX pre-expanded if searched ≥2× in 7 days)
- Smart offers (Auto-Save shown to savings explorers)
- Journey completion reminders (Continue Bill Pay if incomplete <24h)

### 4. **Generative UI (GPT-5 Integration)**
- **Python Script**: `genui_llm_composer.py` calls Azure OpenAI Responses API
- **Strict Schema**: UISchema contract with Zod validation
- **Constraints**: ≤5 sections, always includes Balances & ActionGrid
- **Fallback**: Graceful degradation to rule-based if LLM unavailable/invalid
- **Locale Support**: Generates TR or EN copy based on user preference

### 5. **UI Components**
- **HeroCard**: Personalized welcome message
- **ActionGrid**: Quick actions with smart ordering
- **Balances**: Account balances with IntersectionObserver tracking
- **FXRates**: Collapsible exchange rates widget
- **OffersCard**: Dismissible promotional cards with TTL suppression
- **RecentBeneficiaries**: Masked aliases for recent transfers
- **ContinueBillPay**: Journey completion reminder

### 6. **Privacy & Consent**
- **Consent Dialog**: Clear explanation before tracking
- **Opt-out**: Fully functional with defaults if declined
- **No PII**: Only aliases, no names/IBANs/account numbers
- **Reset**: One-click data wipe and reload

### 7. **Personalization Controls**
- **Toolbar**: Floating settings panel (bottom-right)
  - Dark mode toggle with persistence
  - Density (compact/comfortable)
  - Locale switch (EN/TR)
  - LLM mode toggle
  - Reset personalization
- **Persona Simulators**: Quick test patterns
  - Utility Payer (visits /payments/utilities, clicks Pay Bill 2×)
  - FX Enthusiast (clicks FX 2×, searches "exchange rates" 2×)
  - Savings Explorer (visits /savings, /offers, clicks OPEN_SAVINGS)
  - Incomplete Bill Pay (starts BILLPAY_STARTED journey)

### 8. **Internationalization**
- Full EN/TR translations for all UI strings
- Sticky locale preference
- Auto-detection from navigator.language

### 9. **Accessibility & Performance**
- Radix UI primitives for a11y
- Respects `prefers-reduced-motion`
- IntersectionObserver for lazy balance tracking
- Throttled scroll event handlers
- No layout shift during hydration

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15 (App Router), React 18
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Library**: shadcn/ui + Radix primitives
- **Icons**: Lucide React
- **Storage**: idb-keyval (IndexedDB wrapper)
- **Validation**: Zod for schema validation
- **TypeScript**: Strict mode enabled

### Backend (Dev-Only)
- **Python Script**: Uses OpenAI SDK with Azure endpoint
- **API**: Azure OpenAI Responses API (GPT-5)
- **Output**: Writes `public/llm_schema.json` for frontend consumption

### Data Flow
1. **Boot**: Consent check → Load events → Derive traits
2. **Layout Selection**:
   - If LLM mode: Fetch `/llm_schema.json` → Validate → Render
   - Else: Rule-based `chooseLayout(traits)` → Render
3. **Interaction**: Track events → Store in IndexedDB
4. **Reload**: Re-derive traits → Adapt UI

### File Structure
```
lib/analytics/
  events.ts       # Types: Event, UserTraits, ActionId
  storage.ts      # IndexedDB & localStorage helpers
  tracker.ts      # Event capture: track(), autoTrackPage()
  derive.ts       # deriveTraits(): events → traits
  layout.ts       # chooseLayout(): traits → UISchema

personalization/
  schema.ts       # UISchema types + Zod validators
  renderer.tsx    # SchemaRenderer: UISchema → React components
  llm_prompt.ts   # System/User prompts for GPT-5

components/
  HeroCard.tsx, Balances.tsx, ActionGrid.tsx, FXRates.tsx,
  OffersCard.tsx, RecentBeneficiaries.tsx, ContinueBillPay.tsx,
  ConsentDialog.tsx, Toolbar.tsx

privacy/
  consent.ts      # ensureConsent(), resetAll()

lib/i18n/
  strings.ts      # EN/TR translations + t() helper
```

## Acceptance Tests (Smoke)

Playwright tests included for:
- Home page loads
- Consent dialog appears and accepts
- Quick actions visible
- Action clicks tracked
- Settings toolbar opens
- Dark mode toggle works

## Build Status

✅ TypeScript strict mode: All checks pass  
✅ Next.js build: Production build succeeds  
✅ Linting: Minor unused import warnings fixed  
✅ Bundle size: ~143 kB First Load JS  
✅ Static generation: All routes prerendered  

## Usage Instructions

### Quick Start
```bash
cd experiments/banking-adaptive-ui
npm install
npm run dev
# Open http://localhost:3000
```

### Test Adaptive Behavior
1. Accept consent
2. Click "Personas" button (bottom-right)
3. Click "Utility Payer"
4. Reload → See Pay Bill prioritized

### Generate LLM Layout
```bash
pip install -r scripts/requirements.txt
export AZURE_OPENAI_API_KEY=your_key
python scripts/genui_llm_composer.py
# Toggle "Use AI Layout" in settings, reload
```

## What Works

✅ Full event tracking with consent  
✅ Trait derivation from behavioral data  
✅ Rule-based adaptive layout  
✅ GPT-5 generative layout (with Azure OpenAI)  
✅ EN/TR internationalization  
✅ Dark mode with persistence  
✅ Privacy controls (consent, reset)  
✅ Persona simulators for testing  
✅ Production build ready  
✅ Type-safe, strict TypeScript  

## What's Next (Optional Enhancements)

- A/B test framework for layout strategies
- Server-side layout generation (edge function)
- More granular suppression rules (per-offer TTL)
- Export/import trait data for debugging
- Analytics dashboard (on-device visualization)
- More personas (frequent investor, loan seeker)
- Playwright visual regression tests

## Notes

- All personalization is client-side only (no server required)
- Python script is dev-only helper (not part of runtime)
- Beneficiaries shown as masked aliases, never real data
- Event history capped at 1000 to prevent unbounded growth
- LLM schema validated with Zod before rendering

---

**Status**: ✅ Complete and production-ready  
**Build**: ✅ Passing (npm run build)  
**Tests**: ✅ Smoke tests included (Playwright)  
**Docs**: ✅ Comprehensive README  
