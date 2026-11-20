---
name: ResolvAI
description: Autonomous, Runbook-Grounded Incident Triage & Customer Support Platform
colors:
  primary: "#22c55e"
  primary-hover: "#16a34a"
  canvas: "#09090b"
  surface: "#141416"
  surface-sub: "#18181b"
  surface-elevated: "#27272a"
  border: "#27272a"
  border-hover: "#3f3f46"
  text-white: "#ffffff"
  text-muted: "#a1a1aa"
  text-subtle: "#71717a"
  accent-blue: "#3b82f6"
  accent-purple: "#8b5cf6"
  accent-amber: "#f59e0b"
  accent-red: "#ef4444"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.text-white}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.text-muted}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: ResolvAI

## Overview

**Creative North Star: "The Mission Control Runbook"**

ResolvAI embodies calm, disciplined engineering precision. Modeled after high-reliability operational command centers (Linear, Datadog, Stripe, and AWS Console), the visual world rejects superficial marketing decoration in favor of high-density clarity, strict tabular scannability, and deterministic safety feedback.

The interface treats automated triage not as a magic black box, but as an auditable multi-step agent workflow. Where consumer AI apps rely on shimmering gradients, pulsing halos, and whimsical sparkles, ResolvAI projects mature infrastructure tooling: razor-sharp 1px neutral borders, monolithic obsidian surfaces, high-contrast monospace metrics, and functional semantic accents that only speak when status changes.

**Key Characteristics:**
- **Zero AI Slop**: Absolutely no fairy-dust sparkles (`✨`), pulsing dots, radiant purple-pink mesh gradients, or vague marketing percentages.
- **Obsidian Bento Architecture**: Asymmetric modular command cards (`bg-[#141416]` on `bg-[#09090b]`) defined by crisp `border-neutral-800` lines.
- **Tabular Data Grounding**: Monospace numerals (`tabular-nums`), exact runbook citations, latency timestamps, and audit traces.
- **Restrained Semantic Accents**: Emerald (`#22c55e`) is reserved for verified autonomous completions and live uptime; Amber (`#f59e0b`) flags latency or fallback mode; Red (`#ef4444`) isolates security/outage anomalies.

## Colors

The ResolvAI palette is built on deep neutral values with laser-targeted semantic highlights.

### Primary
- **Signal Emerald** (`#22c55e`): Used solely for verified system success, online agents, runbook match confirmation, and resolved tickets.

### Secondary
- **Engine Blue** (`#3b82f6`): Interactive primary selection, thread chronology, and infrastructure ticket category tags.
- **RAG Purple** (`#8b5cf6`): Semantic vector search playground, runbook clauses, and ReAct agent loop step headers.
- **Warning Amber** (`#f59e0b`): High-severity tickets, offline telemetry alerts, busy employee states, and rate limits.
- **Incident Red** (`#ef4444`): Critical P0/P1 outages, benchmark failure flags, and destructive deletion actions.

### Neutral
- **Obsidian Canvas** (`#09090b`): Root viewport backdrop. Deep, true black that maximizes contrast and reduces eye fatigue.
- **Bento Surface** (`#141416`): Primary container and card background. Distinct from canvas via subtle tonal elevation.
- **Sub-Surface** (`#18181b`): Inner nested code blocks, tabular cells, and secondary input controls.
- **Border Muted** (`#27272a`): 1px structural separator across cards, dividers, and modal headers.
- **Border Active** (`#3f3f46`): Interactive hover and focus boundary.
- **Pure White** (`#ffffff`): Primary titles, metrics, and key table headings.
- **Zinc Muted** (`#a1a1aa`): Secondary labels, body copy, and descriptive sub-headers.

### Named Rules
**The 10% Signal Rule.** Accent colors (`#22c55e`, `#3b82f6`, `#8b5cf6`) must occupy ≤10% of any view. Their power stems from extreme restraint against the obsidian canvas.
**The No-Gradient Rule.** Gradients are strictly forbidden on buttons, text, and card backgrounds. Color shifts are communicated through solid tokens and precise border changes.

## Typography

**Display & Body Font:** Inter (`system-ui, -apple-system, sans-serif`)  
**Tabular & Code Font:** JetBrains Mono (`Menlo, monospace`)

**Character:** Utilitarian, crisp, and authoritative. Inter delivers geometric legibility at small sizes, while JetBrains Mono ensures numbers never jitter during real-time streaming updates.

### Hierarchy
- **Display** (`font-extrabold`, `text-3xl` to `text-5xl` [2.25rem - 3rem], `tracking-tight`): Top-level hero titles and primary KPI bento numbers.
- **Headline** (`font-bold`, `text-lg` to `text-xl` [1.125rem - 1.25rem]): Major section and matrix headers (`A/B Prompt Strategy Evaluation Matrix`).
- **Title** (`font-semibold`, `text-sm` [0.875rem], `tracking-wide`): Sub-section titles, table column headers, and stat card labels.
- **Body** (`font-normal`, `text-xs` to `text-sm` [0.75rem - 0.875rem], `leading-relaxed`): Descriptive runbook copy, ticket descriptions, and reasoning notes. Max line length: 65–75ch.
- **Label / Metric** (`font-mono font-medium`, `text-xs` [0.75rem], `tabular-nums`): Test IDs, latencies (`ms`), timestamps, PII masks, and percentage deltas.

### Named Rules
**The Zero-Kicker Rule.** Do not place floating uppercase eyebrow labels above main headings. Headings must carry their own structural weight.
**The Tabular Numerals Rule.** Any dynamic count, latency value, percentage, or currency figure must use `tabular-nums` or `font-mono` to prevent layout reflow during updates.

## Layout

ResolvAI uses an asymmetric Bento Grid command layout. The canvas is structured on a 12-column responsive grid system (`grid-cols-1 md:grid-cols-2 lg:grid-cols-12`) with consistent `gap-4` to `gap-6`.

- **Asymmetric Command Layout**: High-priority metrics (e.g. RAG Groundedness) receive `lg:col-span-5`, secondary throughput metrics receive `lg:col-span-4`, and supporting safety pairs receive `lg:col-span-3`.
- **Responsive Table-to-Card Adaptation**:
  - Desktop (≥ 768px): High-density horizontal data tables with sticky headers and `scope="col"`.
  - Mobile (< 768px): Seamlessly converts into stacked micro-cards with key-value pills, ensuring zero horizontal panning.
- **Touch Affirmation**: All interactive controls, tab buttons, and modal dismiss actions carry a minimum target dimension of 44x44px.

## Elevation & Depth

ResolvAI strictly employs **Tonal Layering** rather than blur shadows. Surfaces are flat at rest, achieving depth through contrast steps:
- **Layer 0 (Canvas)**: `#09090b`
- **Layer 1 (Card Container)**: `#141416` with `1px solid #27272a`
- **Layer 2 (Inner Panel / Table Row)**: `#18181b` or `#0a0a0a` with `1px solid #27272a`
- **Layer 3 (Modal / Floating Menu)**: `#111111` with `border border-[#2a2a2a]` and a deep neutral ambient shadow (`box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7)`).

### Named Rules
**The No-Colored-Halo Rule.** Zero-offset colored glow halos (e.g., `shadow-[0_0_20px_#22c55e]`) are strictly banned. Elevation is structural, never decorative.

## Shapes

- **Base Radii**:
  - Cards & Bento Containers: `rounded-2xl` (16px)
  - Interactive Buttons & Inputs: `rounded-lg` (8px)
  - Micro Badges & Filter Pills: `rounded-full` (9999px)
- **Borders**: Exactly 1px width (`border border-neutral-800` or `border-white/[0.08]`). No thick or double borders.
- **Form Geometry**: Rectilinear with soft corners. No skewed angles, circular card cuts, or organic blob contours.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px radius) with `min-h-[44px]` touch target floor on primary controls.
- **Primary:** Crisp solid white background (`bg-white text-black font-semibold hover:bg-neutral-200 active:scale-95`).
- **Secondary:** Transparent with muted border (`bg-transparent text-neutral-300 border border-neutral-700 hover:bg-white/5`).
- **Danger:** Subtle red tint (`bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20`).

### Cards / Bento Containers
- **Corner Style:** `rounded-2xl` (16px)
- **Background:** `#141416` (Obsidian surface)
- **Border:** 1px `border-neutral-800`
- **Padding:** Uniform `p-5 sm:p-6`

### Inputs / Search Bars
- **Style:** Deep neutral surface (`bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-2.5`).
- **Focus:** Crisp border highlight (`focus:border-neutral-500 focus:outline-none`).

### Status Badges & Pills
- **Style:** Monospace micro-badges (`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border`).
  - Active / Pass: `bg-emerald-500/15 text-emerald-400 border-emerald-500/30`
  - Staged / Offline: `bg-neutral-800 text-neutral-400 border-neutral-700`
  - Warning / Busy: `bg-amber-500/15 text-amber-400 border-amber-500/30`
  - Critical / Fail: `bg-red-500/15 text-red-400 border-red-500/30`

### Tables
- **Header:** Uppercase or medium weight `text-neutral-400 border-b border-white/10 py-2.5 px-3`.
- **Row:** `divide-y divide-white/[0.04] hover:bg-white/[0.02] transition-colors`.

## Do's and Don'ts

### Do:
- **Do** format all latency metrics in milliseconds (`54ms`, `380ms`) and percentages with `tabular-nums`.
- **Do** render an explicit "Offline Telemetry" alert with a "Reconnect" retry button when backend telemetry is unavailable.
- **Do** transform 5+ column tables into responsive stacked cards on mobile viewports (< 768px).
- **Do** use semantic engineering icons (`<Cpu />`, `<Activity />`, `<Bot />`, `<ShieldCheck />`, `<Terminal />`).
- **Do** truncate long strings in table cells with `max-w-[...] truncate` and native `title={...}` tooltips.

### Don't:
- **Don't** use sparkle emojis (`✨`) or `<Sparkles />` icons anywhere in the application.
- **Don't** use glowing neon box shadows or animated pulsating rings around buttons.
- **Don't** claim unverified 99.99% SLAs or use marketing exaggeration in place of empirical telemetry.
- **Don't** dump tech stack badges (FastAPI, PyTorch, React, SQLite) on landing hero sections.
- **Don't** use sub-12px microtext (`text-[10px]`) for critical operational labels.
