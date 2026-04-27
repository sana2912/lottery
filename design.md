# Design System Direction: Smart Lottery Intelligence

## Product Mood

Lottery Intelligence Dashboard is a data-driven lottery analytics product. It should feel like an analytics platform, finance dashboard, and personal number notebook. The product must be trustworthy, clean, modern, and calm. It must not look like a gambling, hype, or scam-style lottery site.

The interface communicates analysis, signal strength, historical tendency, score, and uncertainty. It must never imply guaranteed winning.

## Palette

Use indigo and slate as the base. Use teal, amber, purple, and semantic colors for insight states. Avoid red/gold-heavy themes.

### Core Light Theme

```css
:root {
  --background: #f8fafc;
  --foreground: #0f172a;

  --card: #ffffff;
  --card-foreground: #0f172a;

  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-soft: #eef2ff;

  --secondary: #0f766e;
  --secondary-soft: #ccfbf1;

  --accent: #f59e0b;
  --accent-soft: #fef3c7;

  --border: #e2e8f0;
  --muted: #64748b;
  --muted-soft: #f1f5f9;

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
--text-title: #0f172a;
--text-body: #334155;
--text-muted: #64748b;
--text-subtle: #94a3b8;
--text-inverse: #ffffff;
```

### Semantic Product Tokens

```css
--hot: #ef4444;
--hot-soft: #fee2e2;

--cold: #38bdf8;
--cold-soft: #e0f2fe;

--overdue: #f59e0b;
--overdue-soft: #fef3c7;

--trend-up: #16a34a;
--trend-down: #dc2626;
--trend-flat: #64748b;

--prediction: #7c3aed;
--prediction-soft: #f3e8ff;

--backtest: #0f766e;
--backtest-soft: #ccfbf1;

--watchlist: #f97316;
--watchlist-soft: #ffedd5;

--methodology: #475569;
--methodology-soft: #f1f5f9;
```

### Dark Theme Draft

```css
.dark {
  --background: #020617;
  --foreground: #f8fafc;

  --card: #0f172a;
  --card-foreground: #f8fafc;

  --primary: #818cf8;
  --primary-hover: #a5b4fc;
  --primary-soft: #1e1b4b;

  --secondary: #2dd4bf;
  --secondary-soft: #134e4a;

  --accent: #fbbf24;
  --accent-soft: #451a03;

  --border: #1e293b;
  --muted: #94a3b8;
  --muted-soft: #1e293b;
}
```

## Typography

- Use `IBM Plex Sans`, `Helvetica Neue`, Helvetica, Arial, and system UI fallbacks.
- Use strong but not sensational headings.
- Labels should be concise and scannable.
- Prize numbers may use monospace where clarity helps.
- Avoid oversized marketing type inside dashboard panels.

## Component Direction

### Cards

- Use white cards on the slate app background.
- Use no border radius, subtle border, and soft shadow.
- Prefer structured, calm panels over decorative cards.
- Metric cards should show label, value, optional hint/trend, and optional semantic accent.

### Buttons

- Primary CTA uses indigo.
- Secondary actions use teal when tied to analysis workflow.
- Ghost and outline variants stay neutral.
- Danger is reserved for destructive actions only.
- Buttons should be clear and medium-density with square corners.

### Badges

Support semantic variants:

- `hot`, `cold`, `overdue`
- `prediction`, `backtest`, `watchlist`
- `success`, `warning`, `danger`, `muted`

Badges should be soft chips with readable contrast. Avoid loud casino-like colors.

### Inputs And Filters

- Inputs are clean and large enough for search/filter workflows.
- Use slate borders, white surfaces, and clear focus rings.
- Filters should wrap or collapse cleanly on mobile.

### Tabs And Segmented Controls

- Use muted-soft backgrounds.
- Active tab uses white surface, indigo text, subtle shadow or border.
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

- Use white cards on slate background.
- Main CTA uses primary indigo.
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
  - Position: primary indigo
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
- Monthly insights use teal and indigo soft colors.
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
