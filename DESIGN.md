---
name: Trade Journal
description: A minimalist trading journal for retail traders
colors:
  primary: "#10B981"
  primary-dim: "oklch(54% 0.15 160 / 0.15)"
  profit: "#22C55E"
  profit-dim: "oklch(66% 0.18 145 / 0.15)"
  danger: "#EF4444"
  danger-dim: "oklch(55% 0.22 30 / 0.15)"
  bg: "#0B0F14"
  card-bg: "#121821"
  border: "#1E293B"
  border-hover: "oklch(100% 0 0 / 0.10)"
  text: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-dim: "#94A3B8"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.3px"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.3px"
    textTransform: "uppercase"
  mono:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 600
    fontVariantNumeric: "tabular-nums"
rounded:
  card: "16px"
  input: "8px"
  button: "100px"
  small: "6px"
  chip: "4px"
spacing:
  container: "32px 24px 64px"
  card: "28px"
  grid-gap: "24px"
  form-gap: "14px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.button}"
    padding: "12px 32px"
    typography: "{typography.display}"
  button-primary-hover:
    backgroundColor: "#059669"
    textColor: "#ffffff"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.input}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.small}"
    padding: "6px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.danger-dim}"
    borderColor: "{colors.danger}"
    textColor: "{colors.danger}"
  card-default:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  input-text:
    backgroundColor: "oklch(0% 0 0 / 0.30)"
    borderColor: "{colors.border}"
    rounded: "{rounded.input}"
    padding: "10px 14px"
    typography: "{typography.body}"
  input-focus:
    borderColor: "{colors.primary}"
  stat-item:
    backgroundColor: "oklch(0% 0 0 / 0.20)"
    rounded: "{rounded.input}"
    padding: "16px"
---

# Design System: Trade Journal

## 1. Overview

**Creative North Star: "The Lab Notebook"**

A calm, precise space for recording and reviewing trades — like a scientist's lab notebook where every entry is deliberate and nothing is decorative. The interface recedes so the data leads.

The system uses a deep dark background with subtle green radial glows that suggest the brand without announcing it. Cards use soft glassmorphism — transparent enough to see the background glow through, solid enough to read comfortably. Motion is restrained: only state changes and section entrances, no choreography.

**Key Characteristics:**
- Deep, quiet dark background with ambient green undertones
- Glassmorphism used with restraint — functional depth, not decoration
- Green accent is purposeful and sparing (≤10% of any screen)
- Calm, unhurried motion — ease-out-expo curves, no bounce or elastic
- Information density that rewards attention without overwhelming
- Soft, approachable corners (16px cards, 8px inputs)

## 2. Colors

A restrained nocturnal palette. The background is a near-black navy-slate (`#0B0F14`); the accent is a cool emerald that reads as signal, not decoration. Warmth is absent by design — this is a tool, not a lounge.

### Primary
- **Emerald** (`#10B981`): The single accent color. Used for Buy direction, positive profit, active tabs/toggles, focus rings, and the <1% of screen real estate that needs to say "active" or "positive."
- **Emerald Dim** (`oklch(54% 0.15 160 / 0.15)`): Soft tinted backgrounds for the accent — Buy badges, KPI wins, primary-dim hover areas.

### Profit & Loss
- **Leaf Green** (`#22C55E`): Profit values and profit indicators. Distinguishable from the primary emerald but harmonizes with it.
- **Signal Red** (`#EF4444`): Loss values, Sell direction, danger buttons, and destructive actions.
- **Leaf Dim / Signal Dim** (15% opacity variants): Tinted backgrounds for profit/loss badges, stat highlights, and hover danger zones.

### Neutral
- **Ink Well** (`#0B0F14`): The body background. Near-black with a subtle cool-blue tilt.
- **Deep Navy** (`#121821`): Card and surface backgrounds — one step above the body in the tonal stack.
- **Slate Border** (`#1E293B`): Borders, dividers, and separators. Visible but not loud.
- **Border Hover** (`oklch(100% 0 0 / 0.10)`): Ghost-white border on hover — barely perceptible lift.
- **Frost White** (`#F8FAFC`): Primary body text. High-contrast against the dark background.
- **Silver Mist** (`#94A3B8`): Secondary text, labels, placeholders, and muted UI.

### Named Rules
**The Signal Rule.** Emerald is the only accent. It appears on ≤10% of any screen. When everything is highlighted, nothing is.

## 3. Typography

**Body Font:** Inter (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)

A single sans-serif family at multiple weights. No pairing, no display font — the content is prose and numbers, not headlines.

**Character:** Clean, technical, unhurried. Inter's open counters and generous x-height keep dense data readable at small sizes.

### Hierarchy
- **Display** (700, 20px, 1.3): Logo text only. Never used for body content.
- **Headline** (600, 16px, 1.3): Modal titles, card section headers.
- **Title** (600, 14px, 1.3): Card `h2` labels (uppercase, 0.5px letter-spacing).
- **Body** (400, 14px, 1.5): Form inputs, entry values, general reading.
- **Label** (500, 12px, 1.3, 0.3px uppercase): Form labels, stat labels, field headers.
- **Caption** (500, 10px, 1.2, 0.3px uppercase): Sub-labels, small metadata.
- **Mono-adjacent numbers** (600, tabular-nums): KPI values, profit/loss, calendar results — numbers that need alignment.

### Named Rules
**The One Family Rule.** No font pairings. Inter at every weight is the entire system. A second font family would signal a change in content mode.

## 4. Elevation

The system uses a **hybrid approach**: static surfaces are flat (tonal layering with `--bg` → `--card-bg`), while interactive elements lift on hover via shadows and transform.

No surface casts a shadow at rest. Depth is conveyed by the tonal difference between body (`#0B0F14`) and card (`#121821`). Shadows only appear as a response to state — hover, focus, active.

### Shadow Vocabulary
- **Card Rest:** `none`. Flat by default.
- **Card Hover** (`0 8px 40px rgba(0, 0, 0, 0.5)`): Appears on card hover alongside a 2px upward translate. The shadow is deep and wide — the card feels like it lifts off the surface.
- **Modal Backdrop** (`0 16px 64px rgba(0, 0, 0, 0.6)`): The deepest shadow in the system, used only for the modal dialog.
- **Toast** (`0 8px 32px rgba(0, 0, 0, 0.5)`, with `0 0 0 1px rgba(255, 255, 255, 0.04)`): Elevated notification that sits above all content.

### Named Rules
**The Flat-By-Default Rule.** No surface casts a shadow at rest. Shadows communicate interactivity; a static card has nothing to say.

## 5. Components

### Buttons

- **Shape:** Primary button uses a full pill shape (`rounded: 100px`). Ghost and danger buttons use 8px radius.
- **Primary (`#save-btn`)**: Emerald background (`#10B981`), white text, 14px 600 weight. Pill-shaped (`100px`), centered below forms.
  - Hover: Darker emerald (`#059669`), green glow shadow, 1px lift.
  - Active: Scale down to 0.98.
- **Ghost (`.history-delete`, `.modal-trade-delete`)**: Transparent background, `--text-secondary` color, 6px radius thin border.
  - Hover: Signal red tinted background, red border, red text.
- **Danger (`.confirm-btn.danger-btn`)**: Signal Red (`#EF4444`) background, white text, 8px radius.
  - Hover: Darker red (`#DC2626`), red glow shadow.

### Tabs

- **Style (`.tabs`)**: Segmented control with `--border` outline. Dark semi-transparent background.
- **Inactive tab**: `--text-secondary` color, transparent background.
- **Active tab**: Emerald background, white text, 600 weight.
- **Mobile variant (`.mobile-tabs`)**: Fixed bottom bar, 56px height, frosted glass background. Active tab is emerald text, no bg pill.

### Toggle (Buy/Sell)

- **Style (`.toggle-group`)**: Segmented inside a bordered container.
- **Buy active**: Emerald fill with green glow.
- **Sell active**: Signal Red fill with red glow.
- **Inactive**: Dim text, transparent.

### Inputs

- **Style (`.form-input`)**: Near-black background at 30% opacity, `--border` stroke, 8px radius. Inter, 14px, white text.
- **Hover**: Border fades to `--border-hover`.
- **Focus**: Emerald border, emerald glow ring at 3px + 20px blur.
- **Error**: Signal Red border, red glow, shake animation.
- **Placeholder**: `--text-secondary` (`#94A3B8`).
- **Select**: Custom chevron icon inlined as SVG. Same styling as text input.

### Cards

- **Shape**: 16px radius. Background is a subtle gradient (`rgba(255, 255, 255, 0.06)` → `rgba(255, 255, 255, 0.015)` → `rgba(16, 185, 129, 0.03)`), frosted with `backdrop-filter: blur(26px)`. 1px faint white border at 6% opacity.
- **Header accent**: A 1px white gradient line across the top edge.
- **Hover**: Border brightens to 12% white, card lifts 2px + 5% scale, deep shadow appears.
- **Internal padding**: 28px (20px on mobile).

### Stat Items

- **Shape**: 8px radius. Near-black background at 20% opacity, 6px blur. bordered.
- **Content**: Uppercase label (11px, 500, secondary text) + value (24px, 700, tight letter-spacing). Color-coded via `.green` / `.red` classes.
- **Hover**: Background darkens, border brightens.

### Calendar

- **Grid**: 7-column CSS grid, bordered cells.
- **Header cells**: 13px, 600 weight, secondary text.
- **Day cells**: 82px min-height. Hover adds faint white glow. Today cell has emerald inset border.
- **Profit/Loss**: Background tinted green/red at 4% opacity. Day number in secondary text. Result value in profit/loss color with tabular-nums.
- **Interactive days** (`.has-trades`): Pointer cursor, emerald glow on hover.

### Badges & Chips

- **Shape**: 4px radius, 10px 600 weight semibold.
- **Buy / Profit**: `--primary-dim` background, `--primary` text.
- **Sell / Loss**: `--red-dim` background, `--red` text.

### Modal

- **Overlay**: Fixed full-screen, 60% black, 8px blur backdrop.
- **Dialog**: `#0F172A` at 96% opacity, 24px blur, 1px border, 16px radius. 480px max-width. Deepest shadow in system.
- **Entrance**: Fade + slide up 20px, ease-out-expo 250ms.
- **Header**: Title right-aligned with close button (icon, 32x32 hit target).

### Toast

- **Position**: Fixed, bottom-right, z-index 1000.
- **Style**: `--card-bg` at 95% opacity, 16px blur, 1px border at 8% white, 12px radius. Left 3px colored border (emerald for success, red for error, dim for info).
- **Entrance**: Slide right 40px + fade, ease-out-expo 350ms.
- **Exit**: Slide right 40px + fade, ease 250ms.

## 6. Do's and Don'ts

### Do:
- **Do** use emerald sparingly — as a signal, not a theme.
- **Do** let the dark background breathe. Cards are transparent; the glow should show through.
- **Do** use Inter at every weight. No second font family.
- **Do** use ease-out-expo curves for motion (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Do** use tabular-nums (`font-variant-numeric: tabular-nums`) for all numerical data.
- **Do** respect `prefers-reduced-motion`: replace enter animations with instant appearance.
- **Do** use the tonal layering (bg → card-bg) for depth at rest; shadows only for interaction.

### Don't:
- **Don't** use gradient text or any `background-clip: text` effect.
- **Don't** add glassmorphism decoratively — every frosted surface has a functional reason.
- **Don't** use a second accent color. Emerald is the single signal.
- **Don't** add side-stripe borders (left/right colored bars on cards or alerts).
- **Don't** use bounce or elastic easing. Never.
- **Don't** use numbered section markers (01 / 02 / 03) as decorative scaffolding.
- **Don't** animate layout properties (width, height, top, left) if transform/opacity can do the job.
- **Don't** use the hero-metric template (big number + small label + gradient accent).
- **Don't** make the UI feel childish or gamified — no badges, rewards, bright neons, or playful illustrations.
- **Don't** sacrifice contrast for "elegance" — body text must hit 4.5:1 against its background.
