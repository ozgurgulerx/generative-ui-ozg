# Live Debug Panel - Implementation Guide

## 🎬 Overview

The **Live Debug Panel** is a real-time activity stream that shows exactly what's happening in the adaptive UI system. It's always visible on the right side of the screen and uses **Framer Motion** for smooth, professional animations.

## ✨ Key Features

### **1. Always-On Visibility**
- Fixed right panel (320px wide)
- Never hides or collapses
- Main content automatically adjusts with `pr-80` padding
- Dark-themed for minimal distraction

### **2. Real-Time Activity Stream**
- Polls every **500ms** for new events
- Automatically scrolls to latest activity
- Shows last **50 activities** (auto-truncates)
- Smooth enter/exit animations with Framer Motion

### **3. Four Activity Types**

#### 🔵 **Events** (Blue)
- Tracks: ACTION, VIEW, SEARCH, JOURNEY
- Shows timestamp, event type, and details
- Examples:
  - `ACTION: TRANSFER`
  - `VIEW: /payments/utilities`
  - `SEARCH: "exchange rates"`
  - `JOURNEY: BILLPAY_STARTED`

#### 🟢 **Traits** (Green)
- Appears when significant behavioral changes detected
- Shows derived intelligence:
  - FX Interest Detected
  - Transfer Pattern Detected
  - Top actions updated

#### 🟣 **Layout Changes** (Purple)
- Triggered when UI adapts
- Shows:
  - AI vs Rule-based indicator
  - Number of sections
  - Section flow (e.g., "HeroCard → AccountCard → ActionGrid")

#### 🟡 **LLM Thinking** (Amber)
- Shows GPT-5 processing stages:
  - `Loading`: Fetching AI-generated layout
  - `Parsing`: Validating AI schema
  - `Success`: AI layout loaded with N sections
  - `Fallback`: AI not available, using rules
  - `Error`: Failed to load AI layout

### **4. Live Stats Bar**
- **Events**: Total count
- **FX Affinity**: Real-time percentage
- **Transfer Affinity**: Real-time percentage

### **5. Smooth Animations**
- **Enter**: Slide from right + scale up + fade in
- **Exit**: Slide to left + scale down + fade out
- **Spring physics**: `stiffness: 300, damping: 30`
- **Auto-scroll**: Smooth scroll to newest activity

## 🎨 Visual Design

### Color Coding
```
🔵 Blue   → Events (user interactions)
🟢 Green  → Traits (behavioral insights)
🟣 Purple → Layout (UI adaptations)
🟡 Amber  → LLM (AI thinking)
```

### Card Structure
```
┌─────────────────────────────────┐
│ 🔵  ACTION        just now      │
│     Transfer                     │
└─────────────────────────────────┘
```

### Time Display
- `just now` (< 5 seconds)
- `15s ago` (< 1 minute)
- `5m ago` (< 1 hour)
- `2h ago` (≥ 1 hour)

## 🔧 Technical Implementation

### Dependencies
```json
{
  "framer-motion": "^11.0.0"
}
```

### Component Architecture
```typescript
LiveDebugPanel
├── Header (Activity title + AI/Rules indicator)
├── Stats Bar (Events, FX%, Transfer%)
├── Activity Stream (scrollable with AnimatePresence)
│   ├── ActivityCard (motion.div with spring animations)
│   │   ├── EventCard (blue)
│   │   ├── TraitCard (green)
│   │   ├── LayoutCard (purple)
│   │   └── LLMCard (amber)
└── Footer (Update frequency info)
```

### Data Flow
```
User Action → Event Tracking → IndexedDB
                ↓
         Poll every 500ms
                ↓
   Detect new events/traits
                ↓
      Add to activity stream
                ↓
    Animate in with Framer Motion
                ↓
         Auto-scroll to bottom
```

### Key Props
```typescript
interface LiveDebugPanelProps {
  schema: UISchema | null          // Current layout
  useLLM: boolean                 // AI mode enabled?
  llmThinking?: {                 // GPT-5 status
    stage: string                  // Loading, Parsing, Success, etc.
    message: string                // Human-readable status
  } | null
}
```

## 📊 Activity Examples

### Event Activity
```
🔵 ACTION                    just now
   TRANSFER
```

### Trait Activity
```
🟢 Trait Updated             5s ago
   Top: TRANSFER, PAY_BILL
   FX Interest Detected
```

### Layout Activity
```
🟣 Layout Changed            just now
   🤖 AI Generated • 6 sections
   HeroCard → AccountCard → ActionGrid → FXRates → Balances → OffersCard
```

### LLM Activity
```
🟡 Loading                   just now
   Fetching AI-generated layout...

🟡 Parsing                   2s ago
   Validating AI schema...

🟡 Success                   3s ago
   AI layout loaded: 6 sections
```

## 🎯 User Experience

### **Onboarding Flow**
1. User opens app → Panel shows "Waiting for activity..."
2. User accepts consent → `EVENT: VIEW /`
3. User clicks Transfer → `EVENT: ACTION TRANSFER`
4. User submits form → `JOURNEY: TRANSFER_COMPLETED`
5. Panel shows all activities in real-time with smooth animations

### **Personalization Flow**
1. User interacts multiple times
2. `Trait Updated` appears showing behavioral changes
3. User reloads page
4. `Layout Changed` shows new UI structure
5. If LLM enabled: Shows `Loading → Parsing → Success` sequence

### **Developer Experience**
- **Instant feedback**: See events as they happen
- **Debugging**: Understand why UI changed
- **Testing**: Verify persona simulators work
- **Transparency**: Full visibility into adaptation logic

## 🚀 How to Use

### **1. Run the App**
```bash
cd experiments/banking-adaptive-ui
npm install  # Installs framer-motion
npm run dev
```

### **2. Interact & Watch**
- Click action buttons → See `ACTION` events flow in
- Use persona simulators → Watch multiple events stream
- Reload page → See `Layout Changed` with reasoning

### **3. Enable GPT-5 (Optional)**
```bash
# Set Azure OpenAI credentials
cp .env.example .env
# Edit .env with API key

# Generate schema
python scripts/genui_llm_composer.py

# Toggle "Use AI Layout" in settings
# Watch the panel show:
# 🟡 Loading → Parsing → Success
```

### **4. Test Scenarios**

**FX Enthusiast:**
```
1. Click Users → "FX Enthusiast"
2. Watch panel show:
   - Multiple ACTION: FX events
   - SEARCH: "exchange rates" events
   - Trait Updated: FX Interest Detected
3. Reload
4. Watch panel show:
   - Layout Changed: FXRates moved to top
```

**Transfer Flow:**
```
1. Click "Transfer" button
2. Watch: JOURNEY: TRANSFER_STARTED
3. Fill form → Submit
4. Watch: JOURNEY: TRANSFER_COMPLETED
5. Watch: EVENT: ACTION TRANSFER
```

## 🎨 Customization

### Adjust Poll Frequency
```typescript
// LiveDebugPanel.tsx line 39
const interval = setInterval(loadData, 500) // Change to 1000 for 1s updates
```

### Change Activity Limit
```typescript
// LiveDebugPanel.tsx line 110
return updated.slice(-50) // Change to -100 for more history
```

### Modify Animations
```typescript
// LiveDebugPanel.tsx line 159
<motion.div
  initial={{ opacity: 0, x: 20, scale: 0.9 }}  // Adjust values
  animate={{ opacity: 1, x: 0, scale: 1 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}  // Tune physics
>
```

## 📈 Performance

- **Memory**: ~10KB for 50 activities
- **CPU**: Minimal (500ms polling is lightweight)
- **Animations**: GPU-accelerated via Framer Motion
- **Auto-cleanup**: Old activities automatically removed

## 🎉 Benefits

✅ **Real-time visibility** - See every interaction as it happens  
✅ **Beautiful animations** - Professional spring physics  
✅ **Always accessible** - No need to toggle panel  
✅ **Color-coded** - Instant understanding of activity types  
✅ **Self-documenting** - Shows why UI adapts  
✅ **Developer-friendly** - Perfect for debugging  
✅ **Production-ready** - Can be toggled off for end users  

## 🔮 Future Enhancements

- **Filtering**: Show only events/traits/layouts
- **Search**: Find specific activities by keyword
- **Export**: Download activity log as JSON
- **Playback**: Replay activity sequence
- **Graph view**: Visualize trait changes over time
- **Performance metrics**: Show render times, API latency

---

**The Live Debug Panel transforms the "black box" of adaptive UI into a transparent, real-time activity stream with beautiful animations!** 🎬✨
