# Design Review: SetupVault

**Date**: 2026-05-14  
**URL**: file:///C:/Users/vfcar/Documents/GitHub/Sumativa-2_SetupVault/index.html  
**Framework**: Vanilla JS + CSS3  
**Theme**: Midnight Forest (Dark Mode)

---

## Overall Impression

SetupVault presents a **clean, professional dark-themed interface** with excellent colour contrast and visual hierarchy. The "Midnight Forest" palette (deep emerald/teal accents on dark background) creates a premium, tactical feel. However, **responsive design has gaps at certain breakpoints** and the **form layout doesn't adapt properly at larger screens**. Typography and spacing are solid, but component consistency could be refined in a few places.

**Verdict:** Polished foundation with responsive implementation issues. ~7/10

---

## Findings

### High

- **Form layout stuck in vertical mode at desktop widths** — The form section ("Añadir Nuevo Artículo") remains in a single-column vertical layout even at 1440px width, where it should transform into a 4-column grid (name | price | priority | button). Media query `@media (min-width: 1280px)` appears to not trigger. **Fix:** Verify media query is loading correctly and test in real browser (Chrome DevTools). May be environment-specific.

- **Summary cards not responsive at tablet** — The `.summary-grid` uses `flex-direction: column` (stacking) at ALL viewport sizes. On tablets (768px+), both cards should display side-by-side. **Fix:** Add `@media (min-width: 768px) { .summary-grid { flex-direction: row; } }` to split summary cards horizontally.

- **Missing focus ring on inputs** — While inputs have a `:focus` state with border color + glow, the glow is subtle (`0 0 0 3px rgba(...)`) and may not be visible at all zoom levels or in all browsers. **Fix:** Increase glow opacity from 0.2 to 0.3+, or add a visible outline as fallback.

### Medium

- **Button height inconsistency** — Primary button (Agregar) is `padding: 0.8rem 1.5rem` (~48px), but secondary buttons (Exportar, Guardar) are `padding: 0.6rem 1rem` (~36-40px). Inline buttons look misaligned. **Fix:** Standardize all buttons to 44px minimum height (accessible) or 48px for consistency.

- **Placeholder text colour too muted** — Input placeholders inherit `color: #e0e6ed` (very light grey) but are intended to be `placeholder-shown`, making them nearly indistinguishable from empty state. **Fix:** Add explicit `input::placeholder { color: #8b95a5; opacity: 0.7; }` CSS rule.

- **Modal "Hard Reset" button uses different red** — The modal's destructive button uses the same `--color-urgente` (red) as the header's "Hard Reset", but in the modal context it's redundant (user already clicked the red button). **Fix:** Use a lighter/muted red in the modal, or label it "Confirm" in a neutral colour since the warning is already clear.

- **Header button spacing too tight on mobile** — At 375px width, "Exportar" and "Hard Reset" buttons appear close together. Touch target should be ≥44×44px. Current gap is only `0.75rem` (12px). **Fix:** Stack buttons vertically or use icon-only mode on mobile.

- **Cards have no visual feedback on mobile** — Item cards (when populated) won't show `:hover` state on touch devices. **Fix:** Add `@media (hover: none)` to remove hover states, or use active/focus states for touch.

### Low

- **Section padding could be more consistent** — Panels use `padding: 2rem`, but the page uses variable padding at different breakpoints (1.5rem at 640px, 2rem at 768px). The rhythm is slightly irregular. **Fix:** Consider a stricter 8/16/24/32px scale.

- **Icon size in summary cards is 3rem (48px)** — This is large and takes up significant real estate. Could be 2rem (32px) for a more refined look. **Fix:** Reduce `.summary-card i { font-size: 2rem; }`.

- **Border radius uses custom values instead of scale** — Borders are `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 16px`. This is good, but 6px inputs + 16px cards feel slightly inconsistent. **Fix:** Could unify to 8px/12px/16px (more standard).

- **"Tu bóveda está vacía" empty state text is small** — At 0.9rem in a large card, it feels lost. **Fix:** Increase to 1rem and add more breathing room around the icon.

---

## What Looks Good ✅

1. **Dark Mode Contrast** — Text (#e0e6ed) on dark background meets WCAG AA standards easily. No straining reading the UI.

2. **Colour Token System** — Consistent use of CSS variables (`--color-urgente`, `--color-planificada`, `--color-deseo`) creates semantic meaning. No raw colour values in component CSS.

3. **Icon Integration** — Phosphor Icons are clean, consistent stroke weight, and appropriately sized. Icons complement text without overwhelming it.

4. **Visual Hierarchy** — The primary CTA ("Agregar al Presupuesto") is unmissable: wide, emerald, prominent placement. Secondary actions (Exportar, Guardar) are correctly de-emphasised.

5. **Form Labels** — Small, uppercase, muted colour creates clear distinction between instruction and input area. Good UX signal.

6. **Spacing Rhythm** — Sections are generously spaced with consistent gaps (1.5-2rem). Feels airy, not cramped.

7. **Mobile-First Base** — Form defaults to vertical layout, improving mobile UX before media queries kick in.

---

## Top 3 Fixes (Highest Impact)

1. **Fix form layout at desktop (1280px+)** — Form should be 4-column grid, not vertical. This is the most visually jarring issue when the app is at full width. Test media query in real browser environment.

2. **Make summary cards side-by-side on tablets (768px+)** — Currently stacked at all sizes. Add responsive flex direction to .summary-grid.

3. **Standardize button heights** — Primary (48px) vs secondary (36-40px) looks unpolished when inline. Pick one size for all buttons (recommend 44px minimum for accessibility, 48px preferred).

---

## Responsive Breakdown

| Viewport | Form | Summary | Items Grid | Mobile Nav | Notes |
|----------|------|---------|------------|------------|-------|
| **375px (mobile)** | ✅ Vertical | ✅ Stacked | ✅ 1-col | ✅ Clean | Good UX |
| **768px (tablet)** | ❌ Should be 2-col | ❌ Should be 2-col | ✅ 2-col | ✅ OK | Form/summary need update |
| **1024px (laptop)** | ❌ Should be 4-col | ❌ Should be 2-col | ✅ 4-col | ✅ OK | Media queries not triggering |
| **1440px (desktop)** | ❌ Should be 4-col | ❌ Should be 2-col | ✅ 4-col | ✅ OK | Same as 1024px |

---

## Screenshots

- Desktop (current) — Form vertical instead of grid
- Mobile — Good layout, tight button spacing
- Summary section — Always stacked, should be 2-col on tablet+

---

## Recommendations for Next Sprint

1. **Debug media queries** — Test in Chrome DevTools (real browser) to confirm `@media (min-width: 1280px)` works. Current environment may have rendering limitations.

2. **Add tablet breakpoint** — Introduce `@media (min-width: 768px)` rules for form (2-col layout) and summary (2-col flex).

3. **Accessibility pass** — Ensure focus rings are visible, button tap targets are 44×44px minimum, colour contrast passes all WCAG checks.

4. **Component refinement** — Standardize button sizing, reduce icon sizes in summary, improve placeholder visibility.

5. **Test on real devices** — Chrome DevTools mobile simulation may not reflect actual touch interactions and pointer hover limitations.

