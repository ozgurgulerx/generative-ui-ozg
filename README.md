# Generative UI Lab

![Status](https://img.shields.io/badge/status-working%20repo-orange?labelColor=1f2328)
![Focus](https://img.shields.io/badge/focus-generative%20UI-2f81f7?labelColor=1f2328)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?labelColor=1f2328)
![License](https://img.shields.io/badge/license-TBD-lightgrey?labelColor=1f2328)

A working repo to tidy up experiments with Generative UI — patterns, prototypes, and notes in one place.

> Heads‑up: this is an active, evolving workspace. Expect frequent, breaking changes while experiments are consolidated.

---

## Table of Contents
- [Overview](#overview)
- [Status](#status)
- [Suggested Repository Structure](#suggested-repository-structure)
- [Quickstart](#quickstart)
- [Conventions](#conventions)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview
This repository collects small, self‑contained experiments exploring Generative UI: interaction patterns, component behaviors, UX flows, and orchestration ideas. Each experiment should document its goal, minimal setup, and how to run it.

## Status
- This is a working repo focused on tidying up and iterating on experiments.
- Structure and tooling may change as patterns stabilize.
- PRs and suggestions are welcome, especially around reproducibility and docs.

## Experiments

### 🏦 Banking Adaptive UI
**Location**: `experiments/banking-adaptive-ui/`  
**Status**: ✅ Complete

A production-ready banking demo that removes UX friction via runtime adaptive UI. The app learns from user behavior (with consent) and dynamically adjusts the interface based on derived traits like FX affinity, transfer patterns, and exploration behavior.

**Key Features**:
- Client-side mini-CDP with behavioral event tracking
- Rule-based adaptive layout engine
- Optional GPT-5 generative UI (Azure OpenAI integration)
- Privacy-first: all data stays on device with consent gates
- Full EN/TR internationalization
- Persona simulators for testing adaptive scenarios

**Tech Stack**: Next.js 15, React 18, Tailwind CSS, shadcn/ui, IndexedDB, Zod, Python (GPT-5 integration)

[→ View full documentation](experiments/banking-adaptive-ui/README.md)

## Suggested Repository Structure
While the layout may evolve, the following structure is recommended for clarity and scale:

```
.
├─ experiments/
│  ├─ <experiment-slug>/
│  │  ├─ README.md        # what/why/how to run
│  │  ├─ src/             # code for the experiment
│  │  └─ assets/          # images, small data, etc. (avoid large files)
├─ docs/                  # shared notes, diagrams, references
└─ README.md
```

## Quickstart
1) Clone the repository

```bash
git clone <repo-url>
cd generative-ui-ozg
```

2) Explore or create an experiment

```bash
# browse existing experiments
ls experiments/

# or create a new one
mkdir -p experiments/<your-experiment>/src
printf "# <Your Experiment>\n\nWhat it does, why it exists, how to run.\n" > experiments/<your-experiment>/README.md
```

3) Run instructions live inside each experiment’s `README.md`
- Dependencies, commands, environment variables, and notes should be documented per experiment.
- Keep experiments decoupled so they can be moved or archived independently.

## Conventions
- **Experiments**
  - One folder per experiment: `experiments/<kebab-case-slug>`
  - Each folder must include a `README.md` covering: purpose, setup, run, and notes.
- **Docs & artifacts**
  - Prefer lightweight text, images, and small assets. Avoid committing large binaries.
  - Use `.gitignore` for any generated files or local data.
- **Commit style**
  - Aim for small, focused commits with clear messages.
  - Conventional Commits are encouraged: https://www.conventionalcommits.org
- **PRs**
  - Keep PRs tight and scoped to a single experiment or concern.
  - Include screenshots or short clips for UI‑centric changes when helpful.

## Roadmap
- Establish a stable experiment template and checklist.
- Consolidate shared utilities/components when duplication emerges.
- Add demos and lightweight docs for notable patterns.
- Set up CI for basic checks (format, type, lint) when the stack stabilizes.

## Contributing
- Open an issue to propose a new experiment or improvement.
- For PRs:
  - Fork/branch with a descriptive name (e.g., `feat/<slug>` or `chore/<slug>`).
  - Update the experiment’s `README.md` so changes are reproducible.
  - Keep diffs small and focused; link related discussions if any.

## License
No license has been selected yet. If you plan to use or share this code, consider adding a license. Helpful guide: https://choosealicense.com
