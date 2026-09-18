# Design System — PEIT v1

## Philosophy

A professional, bank-like personal finance app that feels familiar, reliable, and trustworthy — like Apple Wallet or Health, but for money. It must look polished, not like a Bootstrap template with extra colors.

---

## Typography

| Element | Font | Size | Weight | Line height | Color |
|---|---|---|---|---|---|
| Heading (site title, modals, slide‑in forms) | Fraunces, variable `opsz` | `--text-xl` (clamp 20–28px) | 400–600 | 1.2 | `--color-ink` |
| Balance totals (dashboard, account cards) | Fraunces | `--text-5xl` (clamp 32–56px) | 600 | 1.1 | `--color-palm-strong` |
| Section titles (`Accounts`, `Categories`) | Fraunces | `--text-2xl` (clamp 24–32px) | 500 | 1.25 | `--color-ink` |
| Body text (lists, forms labels, links) | Manrope | `--text-base` (clamp 16–18px) | 400 | 1.5 | `--color-ink` |
| Caption / small labels (`Due today`, `Overdue`) | Manrope | `--text-sm` (clamp 14–15px) | 400 | 1.4 | `--color-muted` |
| Micro (`input` placeholder, helper text) | Manrope | `--text-xs` (12px) | 400 | 1.5 | `--color-muted` |

**Why?**:
- Fraunces provides a slightly wider baseline grid, which aids readability for balance figures.
- Manrope is a clean, modern sans that scales well on mobile.
- Scale uses clamp to fluidly adapt between narrow phone screens and larger desktop windows while respecting system‑font preferences.

---

## Color system

### Semantic colors (consistent across light and dark)

| Name | Tailwind class | Light hex | Dark hex | Usage |
|---|---|---|---|---|
| Primary palette | `bg-palm-strong`, `border-palm-strong`, `text-palm-strong` | `#6f6850` | `#c7be93` | Main UI accents: tabs, toggles, primary buttons, indicators |
| Accent sand | `bg-sand`, `border-sand`, `text-sand` | `#cbd081` | `#33351f` | Secondary actions, secondary button backgrounds |
| Supporting sage | `bg-sage-tint`, `border-sage`, `text-sage` | `#dcedb9` | `#dcedb9` | Success states, positive balances |
| Muted mist | `text-muted`, `bg-surface-sunken` | `#726c56` | `#a89f81` | Labels, disabled text, subtle backgrounds |
| Surface / Paper | `bg-surface`, `bg-paper` | `#ffffff` | `#1c1d16` | Backgrounds, cards, content blocks |
| Ink | `text-ink` | `#24261f` | `#ede9d8` | Primary copy, text on surfaces |
| Border / Divider | `border-border` | `#dcdac8` | `#3a3d2f` | Dividers, input borders, modal outlines |

### Functional states

| State | Border class | Text class | Background class | Live example |
|---|---|---|---|---|
| Positive / Success | `border-positive-tint` | `text-positive` | `bg-positive-tint` | `CategoryDonut` success slice highlight |
| Negative / Danger | `border-negative-tint` | `text-negative` | `bg-negative-tint` | Delete account confirmation, error fields |
| Warning / Caution | `border-warning-tint` | `text-warning` | `bg-warning-tint` | Overdue lending warning badge |
| Info / Neutral | `border-palm-strong` | `text-palm` | `bg-sand-tint` | Upcoming recurring rule note |

**Do NOT**
- Use raw Tailwind colors like `bg-blue-500` or `bg-gray-100` — always use the semantic tokens above.
- Introduce color trends (e.g., pink for balance, orange for cash). Keep the palette intentional and consistent.

**Do**
- Use semantic colors for UI states (positive/negative/warning) in reports, error messages, and success toasts.
- Define contrast ratios with the current design tokens — do not rely on defaults.

---

## Iconography

### Main icon set
- **Provider**: default emoji icons are used for categories (e.g., `💼 Salary`, `📈 SIP`)
- **Custom icons**: users can replace any icon by uploading a PNG and storing its path in Supabase
- **UI icons**: `lucide-react` (imported `/@/components/icons.tsx` mapping) for navigation (Home, Wallet, Calendar, Chart, Bell, Lock, etc.)
- **SVG shape guidelines**:
  - Stroke width: `1.75` (consistent with design)
  - Stroke-linecap: round, stroke-linejoin: round
  - Size tokens: `w-5` (20px) for list items, `w-6` (24px) for buttons, `w-8` (32px) for avatars
  - Color: inherit from semantic `text-*` tokens
  - No gradients, no fill-only icons

### Icon styling per component

| Component | Icon color | Background / border | Sizing |
|---|---|---|---|
| Tab bar icons (selected) | `text-palm-strong` (primary) | N/A | `size={22}` |
| Tab bar icons (inactive) | `text-muted` | N/A | `size={22}` |
| List items (Accounts, Categories) | `text-palm-strong` | `bg-sand-tint` border | `size={17}` |
| Action buttons (Save, Add) | `text-paper` | `bg-palm-strong` border | `size={20}` |
| Lock / biometrics icons | `text-palm` | `bg-sand-tint` border | `size={18}` |

### Accessibility / contrast
- Ensure icon strokes visible on both `--color-paper` and `--color-ink` backgrounds.
- Icons used as status indicators should match the semantic color (positive/negative/warning).

---

## Layout & Grid

Base responsive layout is `flex` and `gap` driven (no `space-x-*` or `space-y-*`).

### Spacing scale (4px tokens)

| Name | Value | Use |
|---|---|---|
| `--space-0` | `0px` | No spacing |
| `--space-1` | `4px` | Inline text tight |
| `--space-2` | `8px` | Tiny gaps |
| `--space-3` | `12px` | Small gaps |
| `--space-4` | `16px` | Standard components (card padding) |
| `--space-5` | `20px` | Larger gaps (list items) |
| `--space-6` | `24px` | Section spacing |
| `--space-7` | `28px` | Title + content blocks |
| `--space-8` | `32px` | Major sections (cards in list) |
| `--space-9` | `36px` | Wide screens, navigation bars |
| `--space-10` | `40px` | Headers, footers |
| `--space-12` | `48px` | Page top padding (safe-area) |

### Container widths

| Breakpoint | Max width |
|---|---|
| `--breakpoint-md` (≥768px) | `max-w-2xl` (672px) |
| `--breakpoint-sm` (≥640px) | `max-w-xl` (600px) |
| Default (mobile) | `w-full` (full-width) |

### Visual hierarchy

1. Balance total (dashboard) stands out via larger font + color; all other elements use consistent spacing.
2. Cards / list items use a `border` with subtle background, never elevation (no box-shadow except interactive states).
3. Call-to-action (CTA) buttons (e.g., Add Category, Save Transaction) use `bg-palm-strong` with `text-paper` contrast.
4. Secondary actions use `bg-sand-tint` or `border-palm` for subtle emphasis.

---

## Components — Core library

All UI components below are built with Tailwind classes, strictly using semantic colors and the defined type scale. Do not replace with generic `shadcn/ui` unless you migrate the token values accordingly.

### 1. Card
```tsx
<div className="rounded-xl border border-border bg-surface p-4">
  {/* content */}
</div>
```

**Padding**: `--space-4` (16px) for inner spacing, `--space-5` (20px) for lists.
**Border**: `--color-border` always, no shadows.

### 2. Button
```tsx
<button className="inline-flex items-center justify-center rounded-lg border border-palm-strong bg-palm-strong px-4 py-2 text-base font-medium text-paper transition-colors hover:bg-sand active:bg-sand-tint">
  {/* content */}
</button>
```

**Secondary button**:
```tsx
<button className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-base font-medium text-ink hover:bg-surface-sunken">
  {/* content */}
</button>
```

### 3. Input
```tsx
<input className="w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus:outline-none focus:border-palm" />
```

### 4. Label
```tsx
<label className="block text-sm font-medium text-ink">
  {/* label text */}
</label>
```

### 5. Badge (status pill)
```tsx
<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-positive-tint text-positive">
  {/* status text */}
</span>
```

### 6. Avatar / Icon wrapper
```tsx
<div className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-tint text-palm-strong">
  {/* icon */}
</div>
```

### 7. Sheet / Modal backdrop
```tsx
<div className="fixed inset-0 z-40 bg-paper/80 backdrop-blur-sm" /> // only when needed
```

### 8. BottomTabBar
- Fixed at bottom with border-top `border-border`.
- Active tab uses `text-palm-strong` background contrast.
- Inactive: `text-muted`.

### 9. Skeleton
```tsx
<div className="animate-pulse rounded-md bg-surface-sunken h-4 w-full" />
```

---

## Motion / Interaction

| Interaction | Duration | Easing | Example |
|---|---|---|---|
| Button press | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Ripple feedback, press down |
| Tab selection (BottomTabBar) | 300ms | `ease-[cubic-bezier(0.4,0,0.2,1)]` | Icon color + underline |
| Modal slide-in (accounts, categories) | 250ms | `cubic-bezier(0.4, 0, 0, 1)` | Slide from bottom (mobile) |
| Recurring rule animation | 400ms | `ease-out` | Auto-posting notification toast |
| Push notification | Immediate + fade-in | `ease-in` | Browser notification |

No CSS animations beyond transitions; use `transition-all` with `duration-300` for most state changes.

---

## State guidelines

### Loading
- Use a `Skeleton` component with same width/height as final.
- Show spinner inside buttons with `disabled` while async operation in-flight.

### Error / Validation
- Error text color: `text-negative`
- Error border: `border-negative-tint`
- Form field error message: `text-xs text-negative mt-1`

### Empty states
- Always include a small illustration (SVG or Lottie) and a clear CTA: `+ Add first transaction`
- Use muted text color and centered layout.

---

## Mobile-first responsive patterns

| Breakpoint | Layout change |
|---|---|
| Mobile (< 640px) | BottomTabBar hidden, sidebar on the left (collapsible) |
| Tablet (640–1023px) | Sidebar fixed left, content area margin-left for sidebar |
| Desktop (≥1024px) | Sidebar always visible, max-width `max-w-2xl` for lists |

---

## Accessibility (A11y)

- Use semantic HTML where possible (`button`, `input`, `label`, `nav`).
- Color contrast ratios meet WCAG 2.1 AA against `--color-ink`/`--color-paper`.
- Icons have `aria-label` or `role` text when used as buttons.
- Focus outlines: `focus:outline-none focus:ring-2 focus:ring-palm-strong focus:ring-offset-2` for interactive elements.
- Form validation messages announced via `aria-live="polite"`.
- PIN entry uses native `input type="password"`; biometric registration triggers native WebAuthn UI.
- Push notifications have a user-visible title + body; clicking opens the app.

---

## Testing checklist (Component readiness)

| Component | Test scenario |
|---|---|
| `Card` | Renders with border & background, no extra elevation |
| `Button` | Primary & secondary variants contrast correctly; hover/active states visible |
| `Input` | Placeholder color `--color-muted`; focus ring matches `--color-palm-strong` |
| `BottomTabBar` | Active vs. inactive tab uses proper semantic colors, no flicker |
| `Skeleton` | Pulse animation active, matches component shape |
| `Avatar/Icon wrapper` | Icon size and color contrast against background tokens |
| Empty state | Illustration present, CTA clearly labeled |
| Notifications page | Subscribe/unsubscribe works, test notification arrives |
| AppLockOverlay | PIN lock triggers on app background, biometric falls back |
| Recurring rule form | Day-of-month validation (1–31) respects month lengths |
| Reports | Donut and trend charts render with `--color-positive` and `--color-negative` slices |
| Calendar | Dates align correctly; tap opens add form; selected date highlights |

---

## Guideline enforcement

- Any new UI file must import `tailwindcss` and adhere to the `--color-*` semantic palette.
- Do not use `className="..."` without a semantic token unless the token is truly unnecessary (rare).
- All components must be fully keyboard accessible (Tab order, Enter/Space activation).
- Component names (e.g., `Card`) match the export name in `src/components/`.
- Component variants (primary/secondary) should not introduce new colors; reuse `--color-palm-strong` or `--color-sand`.

---

## References

- Apple Wallet & Health UI inspection (real screens) – motivation for balance typography, color harmony.
- Existing `src/components/` implementation (e.g., `NewTransactionForm`) – migration guide when updating to shadcn (preserving current token values).