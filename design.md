# Design System Direction: Sharp Signal

## 1. Visual Theme & Atmosphere

Lottery Intelligence Dashboard now uses a sharp, high-contrast product style. The new direction is sexy and straightforward: square edges, direct hierarchy, clean surfaces, dark editorial contrast, and a confident signal-red brand accent. The interface should feel analytical, composed, and decisive rather than soft, playful, or decorative.

**Key Characteristics:**

- Square geometry by default: no rounded cards, buttons, inputs, tabs, menus, or badges.
- Signal Red (`#e50914`) as the main action and data accent.
- Obsidian (`#101114`) for dark panels and high-contrast framing.
- White and cool off-white surfaces with precise gray dividers.
- Minimal shadows with sharper offsets; rely on border, contrast, and spacing first.
- Dense but readable dashboard composition with clear labels and strong numbers.
- No decorative blobs, orbs, pill shapes, or soft mascot-like styling.

## 2. Color Palette & Roles

### Primary

- **Signal Red** (`#e50914`): Primary CTA, active state, key data signal, links.
- **Signal Red Deep** (`#b90710`): Hover and pressed state.
- **Signal Red Ink** (`#7a0610`): Outlines, serious emphasis, dark-on-light accents.
- **Signal Red Soft** (`rgba(229,9,20,0.1)`): Subtle active backgrounds and badges.
- **Obsidian** (`#101114`): Primary dark surface and near-black text.

### Neutral

- **Canvas** (`#ffffff`): Primary surface.
- **App Background** (`#f4f5f7`): Quiet dashboard background.
- **Elevated Surface** (`#fbfbfc`): Secondary panels.
- **Steel Text** (`#555a64`): Secondary text.
- **Muted Text** (`#858b98`): Captions and helper copy.
- **Divider** (`#d7dae0`): Default borders and table rules.

### Semantic

- **Green** (`#149e61`): Success/positive states only.
- **Green Dark** (`#026b3f`): Success text.
- **Danger Red** (`#dc2626`): Destructive actions and validation errors.

## 3. Typography Rules

### Font Families

- **Display**: `IBM Plex Sans`, `Helvetica Neue`, Helvetica, Arial, system UI.
- **UI / Body**: `IBM Plex Sans`, `Helvetica Neue`, Helvetica, Arial, system UI.

### Hierarchy

| Role            | Size | Weight  | Line Height | Letter Spacing |
| --------------- | ---- | ------- | ----------- | -------------- |
| Display Hero    | 48px | 750     | 1.08        | 0              |
| Section Heading | 36px | 750     | 1.14        | 0              |
| Sub-heading     | 28px | 700     | 1.20        | 0              |
| Feature Title   | 22px | 650     | 1.20        | 0              |
| Body            | 16px | 400     | 1.50        | 0              |
| Body Medium     | 16px | 550     | 1.50        | 0              |
| Button          | 14px | 700     | 1.20        | 0              |
| Caption         | 14px | 400-700 | 1.45        | 0              |
| Small           | 12px | 500-700 | 1.35        | 0              |
| Micro           | 11px | 700     | 1.00        | 0.08em         |

## 4. Component Styling

### Geometry

- Controls, cards, badges, tabs, dropdowns, tables, preview panels, and sidebars use `0px` radius.
- Use square corners even for icon buttons and compact chips.
- Avoid pill buttons and rounded status chips.
- Preserve circular geometry only when representing a literal avatar, radial data point, or chart marker.

### Buttons

**Primary Signal**

- Background: `#e50914`
- Text: `#ffffff`
- Border: `1px solid #e50914`
- Padding: `12px 16px`
- Radius: `0px`

**Outlined**

- Background: `#ffffff`
- Text: `#7a0610`
- Border: `1px solid #7a0610`
- Radius: `0px`

**Subtle**

- Background: `rgba(229,9,20,0.1)`
- Text: `#b90710`
- Border: `1px solid transparent`
- Radius: `0px`

**Secondary**

- Background: `#f0f1f4`
- Text: `#101114`
- Border: `1px solid #d7dae0`
- Radius: `0px`

### Cards And Panels

- Background: `#ffffff` or `#fbfbfc`
- Border: `1px solid #d7dae0`
- Radius: `0px`
- Shadow: keep minimal; prefer `rgba(16,17,20,0.08) 0px 8px 18px -14px`.

### Badges

- Success: `rgba(20,158,97,0.14)` background, `#026b3f` text, `0px` radius.
- Neutral: `#eceef2` background, `#555a64` text, `0px` radius.
- Brand: `rgba(229,9,20,0.1)` background, `#7a0610` text, `0px` radius.

## 5. Layout Principles

### Spacing

Use compact, deliberate spacing: `1px`, `2px`, `4px`, `6px`, `8px`, `10px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`.

### Border Radius

Default radius is `0px`. Do not introduce rounded corners for product UI unless a specific data visualization requires a circular marker.

## 6. Depth & Elevation

- Card: `rgba(16,17,20,0.08) 0px 8px 18px -14px`
- Micro: `rgba(16,17,20,0.08) 0px 1px 0px`
- Floating: `rgba(16,17,20,0.22) 0px 18px 36px -24px`

## 7. Do's And Don'ts

### Do

- Use square edges everywhere.
- Use Signal Red for clear action and emphasis.
- Use strong type, clean tables, and tight visual rhythm.
- Let borders and contrast define structure.
- Keep UI copy direct and practical.

### Don't

- Do not use rounded cards, pill buttons, bubble chips, or soft decorative panels.
- Do not use purple as the primary brand color.
- Do not use decorative gradient orbs, bokeh, or overly soft shadows.
- Do not make the interface feel like a marketing landing page when the task is dashboard/workflow UI.

## 8. Responsive Behavior

Breakpoints: `375px`, `425px`, `640px`, `768px`, `1024px`, `1280px`, `1536px`.

On mobile, keep square controls full-width when needed, preserve readable spacing, and avoid stacking dense panels in ways that hide primary actions.

## 9. Agent Prompt Guide

### Quick Color Reference

- Brand: Signal Red (`#e50914`)
- Brand Hover: Signal Red Deep (`#b90710`)
- Brand Outline: Signal Red Ink (`#7a0610`)
- Text: Obsidian (`#101114`)
- Secondary Text: Steel (`#555a64`)
- Background: App Gray (`#f4f5f7`)
- Surface: White (`#ffffff`)

### Example Component Prompt

- "Create a sharp dashboard panel: white background, 1px #d7dae0 border, 0px radius, direct heading, Signal Red CTA, no decorative rounding."
