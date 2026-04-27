# Design System Direction: Smart Lottery Intelligence

## Product Mood

Lottery Intelligence Dashboard is a data-driven lottery analytics product. It should feel like an analytics platform, finance dashboard, and personal number notebook. The product must be trustworthy, clean, modern, and calm. It must not look like a gambling, hype, or scam-style lottery site.

The interface communicates analysis, signal strength, historical tendency, score, and uncertainty. It must never imply guaranteed winning.

## Palette

Use a warm stone base with minimal orange as the brand color. Teal, amber, purple, and semantic colors support insight states. Avoid red/gold-heavy casino themes, excessive gradients, or loud lottery styling.

### Core Light Theme

```css
:root {
  color-scheme: light;

  --background: #fafaf9;
  --foreground: #1c1917;

  --card: #ffffff;
  --card-foreground: #1c1917;

  --primary: #f97316;
  --primary-hover: #ea580c;
  --primary-soft: #fff7ed;
  --primary-foreground: #ffffff;

  --secondary: #0f766e;
  --secondary-soft: #ccfbf1;
  --secondary-foreground: #ffffff;

  --accent: #fb923c;
  --accent-soft: #ffedd5;
  --accent-foreground: #7c2d12;

  --border: #e7e5e4;
  --muted: #78716c;
  --muted-soft: #f5f5f4;
  --muted-foreground: #78716c;

  --success: #16a34a;
  --success-soft: #dcfce7;

  --warning: #d97706;
  --warning-soft: #fef3c7;

  --danger: #dc2626;
  --danger-soft: #fee2e2;

  --info: #2563eb;
  --info-soft: #dbeafe;
}
```

### Text Tokens

```css
--text-title: #1c1917;
--text-body: #44403c;
--text-muted: #78716c;
--text-subtle: #a8a29e;
--text-inverse: #ffffff;
```

### Semantic Product Tokens

```css
--hot: #ef4444;
--hot-soft: #fee2e2;

--cold: #38bdf8;
--cold-soft: #e0f2fe;

--overdue: #f97316;
--overdue-soft: #fff7ed;

--trend-up: #16a34a;
--trend-down: #dc2626;
--trend-flat: #78716c;

--prediction: #9333ea;
--prediction-soft: #faf5ff;

--backtest: #0f766e;
--backtest-soft: #ccfbf1;

--watchlist: #f97316;
--watchlist-soft: #ffedd5;

--methodology: #57534e;
--methodology-soft: #f5f5f4;
```

### App Alias Tokens

Use the app aliases in composed UI when they improve readability or match an existing component pattern.

```css
--color-bg-app: var(--background);
--color-bg-canvas: var(--card);
--color-bg-elevated: #ffffff;
--color-bg-subtle: var(--muted-soft);
--color-bg-frosted: rgba(255, 255, 255, 0.86);

--color-bg-dark: #1c1917;
--color-bg-dark-soft: rgba(255, 255, 255, 0.08);
--color-bg-dark-softer: rgba(255, 255, 255, 0.14);

--color-bg-brand-soft: var(--primary-soft);
--color-bg-brand-soft-strong: #ffedd5;
--color-bg-success-soft: var(--success-soft);

--color-bg-hero: linear-gradient(180deg, #ffffff 0%, #fff7ed 100%);
--color-bg-hero-accent: linear-gradient(
  90deg,
  rgba(249, 115, 22, 0.13),
  transparent 52%
);
--color-bg-hero-scrim: rgba(255, 255, 255, 0.9);
--color-bg-hero-scrim-soft: rgba(255, 255, 255, 0.68);

--color-bg-panel-brand: var(--primary-soft);
--color-bg-sidebar: linear-gradient(180deg, #1c1917 0%, #292524 100%);

--color-text-primary: var(--text-title);
--color-text-secondary: var(--text-body);
--color-text-muted: var(--text-muted);
--color-text-success: #166534;
--color-text-inverse: var(--text-inverse);
--color-text-inverse-muted: rgba(255, 255, 255, 0.78);
--color-text-inverse-soft: rgba(255, 255, 255, 0.66);

--color-border-default: var(--border);
--color-border-soft: #f0eeeb;
--color-border-inverse-soft: rgba(255, 255, 255, 0.12);
--color-border-inverse-softer: rgba(255, 255, 255, 0.18);

--color-brand: var(--primary);
--color-brand-strong: var(--primary-hover);
--color-brand-outline: #c2410c;
```

### Shape, Shadow, And Font Tokens

```css
--shadow-card: 0 12px 32px rgba(28, 25, 23, 0.06);
--shadow-micro: 0 1px 2px rgba(28, 25, 23, 0.06);
--shadow-float-strong: 0 18px 48px rgba(28, 25, 23, 0.14);

--radius: 0rem;

--font-display:
  "IBM Plex Sans", "Helvetica Neue", Helvetica, Arial, ui-sans-serif,
  system-ui, sans-serif;
--font-ui:
  "IBM Plex Sans", "Helvetica Neue", Helvetica, Arial, ui-sans-serif,
  system-ui, sans-serif;
```

### Dark Theme

```css
.dark {
  color-scheme: dark;

  --background: #0c0a09;
  --foreground: #fafaf9;

  --card: #1c1917;
  --card-foreground: #fafaf9;

  --primary: #fb923c;
  --primary-hover: #fdba74;
  --primary-soft: #431407;
  --primary-foreground: #1c1917;

  --secondary: #2dd4bf;
  --secondary-soft: #134e4a;

  --accent: #fbbf24;
  --accent-soft: #451a03;
  --accent-foreground: #fef3c7;

  --border: #292524;
  --muted: #a8a29e;
  --muted-soft: #1c1917;
  --muted-foreground: #a8a29e;

  --success: #22c55e;
  --success-soft: #052e16;

  --warning: #f59e0b;
  --warning-soft: #451a03;

  --danger: #f87171;
  --danger-soft: #450a0a;

  --info: #60a5fa;
  --info-soft: #172554;

  --text-title: #fafaf9;
  --text-body: #d6d3d1;
  --text-muted: #a8a29e;
  --text-subtle: #78716c;

  --hot: #f87171;
  --hot-soft: #450a0a;

  --cold: #7dd3fc;
  --cold-soft: #082f49;

  --overdue: #fb923c;
  --overdue-soft: #431407;

  --trend-up: #22c55e;
  --trend-down: #f87171;
  --trend-flat: #a8a29e;

  --prediction: #c084fc;
  --prediction-soft: #3b0764;

  --backtest: #2dd4bf;
  --backtest-soft: #134e4a;

  --watchlist: #fb923c;
  --watchlist-soft: #431407;

  --methodology: #a8a29e;
  --methodology-soft: #1c1917;
}
```

## Typography

- Use `IBM Plex Sans`, `Helvetica Neue`, Helvetica, Arial, and system UI fallbacks.
- Use strong but not sensational headings.
- Use normal letter spacing. Do not use negative tracking.
- Labels should be concise and scannable.
- Prize numbers may use monospace where clarity helps.
- Avoid oversized marketing type inside dashboard panels.

## Component Direction

### Cards

- Use white cards on the warm stone app background in light mode.
- Use square corners with `rounded-none`, subtle stone borders, and `--shadow-card`.
- Prefer structured, calm panels over decorative cards.
- Metric cards should show label, value, optional hint/trend, and optional semantic accent.

### Buttons

- Primary CTA uses minimal orange.
- Secondary actions use teal when tied to analysis workflow.
- Ghost and outline variants stay neutral.
- Danger is reserved for destructive actions only.
- Buttons should be clear, medium-density, and square.

### Badges

Support semantic variants:

- `hot`, `cold`, `overdue`
- `prediction`, `backtest`, `watchlist`
- `success`, `warning`, `danger`, `muted`

Badges should be square soft labels with readable contrast. Avoid loud casino-like colors.

### Inputs And Filters

- Inputs are clean and large enough for search/filter workflows.
- Use stone borders, white surfaces, and orange focus rings.
- Filters should wrap or collapse cleanly on mobile.

### Tabs And Segmented Controls

- Use muted-soft backgrounds.
- Active tab uses white surface, brand text, subtle shadow or border.
- Keep tab labels concise.

### Tables

- Use readable spacing.
- Headers use muted text and muted-soft background.
- Rows may use subtle hover.
- Numeric columns should align clearly.

### Skeletons

- Use soft muted blocks with square corners.
- Do not use plain "Loading..." text as the only loading state.

### Empty States

- Use friendly, product-like copy.
- Explain what is missing and provide one clear next action.
- Avoid blame or dead-end states.

## Page Usage Rules

### Dashboard

- Use white cards on the warm stone background.
- Main CTA uses primary orange.
- Latest draw card may use primary-soft.
- Hot, cold, and overdue cards use their semantic colors.

### Results

- Should feel like the source of truth.
- Use mostly neutral cards.
- Verified badge uses success.
- Partial or imported badge uses warning.
- Prize numbers should be clear, large, and may use monospace.

### Analytics

- Bar charts use primary.
- Heatmaps use a primary-soft to primary scale.
- Labels use muted text.

### Patterns

- Slightly more playful than Analytics, but still trustworthy.
- Odd/even, high/low, double, and sequence patterns should use chips or badges.
- Pattern insight is descriptive, not predictive.

### Prediction Lab

- Use prediction purple as the feature accent.
- Avoid wording like "guaranteed", "sure win", or "AI knows".
- Use wording like "signal", "score", "historical tendency", and "reason".
- Score breakdown colors:
  - Hot: hot red
  - Overdue: overdue amber
  - Position: primary orange
  - Pattern: prediction purple
  - Pair: secondary teal
- Every prediction result must have explanation space.

### Backtest

- Use backtest teal as accent.
- Hit uses success.
- Miss uses danger.
- Random baseline uses muted.
- Longest miss streak uses warning.
- Layout should feel serious and audit-friendly.

### Watchlist

- Use watchlist orange as accent.
- Tags use soft chips.
- Notes use muted-soft backgrounds.
- Archived items should appear muted and low-emphasis.

### Compare

- Use neutral table/card bases.
- Use colored metric bars.
- Strongest signal can have a soft success border.
- Avoid aggressive "winner/loser" language.

### Calendar

- Countdown card uses primary and accent.
- Next draw should be visually highlighted.
- Past draws are muted.
- Monthly insights use teal and orange soft colors.
- Always show sample-size or uncertainty copy for monthly insights.

### Methodology

- Prioritize readability.
- Use warning-soft callouts for "not a guarantee".
- Use muted-soft formula and example blocks.
- Links use primary.

## Copywriting Rules

Prefer:

- analysis
- signal
- score
- historical data
- trend
- confidence
- reason

Avoid:

- guaranteed
- แม่นแน่นอน
- เลขล็อก
- ต้องซื้อ
- sure win

Thai/English mixed copy is okay, but keep it clear, calm, and product-like.

## Responsive Rules

- Cards stack cleanly on mobile.
- Filters wrap or collapse instead of overflowing.
- Text must fit inside controls and metric cards.
- Preserve chart/table readability with horizontal scrolling when needed.
