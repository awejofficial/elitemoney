LANDING / HOME PAGE — pre-login feature showcase

GOAL: Before login, show a proper landing page that explains what the app
does and what's in it — not a bare login form, and not a generic SaaS
template with stock "features grid" copy. Use the same font pairing, color
system, and custom icon set already established in earlier modules — this
page must look like it belongs to the same app, not a separate marketing
site bolted on.

DO NOT include a public contact email or "report an issue" link on this
page — this is a single-user personal app, not a public product. Skip that
section entirely.

STRUCTURE:
1. Hero — app name/mark, one clear sentence on what it does (not generic
   "manage your finances effortlessly" copy — be specific: track income,
   expenses, and money owed between friends/family, in one place). A single
   "Sign In" call to action, not multiple competing buttons.
2. Feature showcase — one card/section per real module that's actually
   built, not aspirational features:
   - Accounts & Total Balance
   - Custom Income/Expense Categories
   - Recurring Transactions (SIP/EMI/Chit Fund auto-tracking)
   - Friends & Family Lending Tracker (net balance, settle-up)
   - Reports (pie chart, trend, calendar view)
   - PWA — install to home screen, works offline
   - PIN/biometric lock
   Each card: icon (from the custom set — do not introduce new icon styles
   here), a short specific description, and where relevant a real UI
   screenshot/mock of that feature rather than an abstract illustration.
3. No pricing section, no testimonials, no "trusted by" logos — none of
   that applies to a personal app and including it would look fake, not
   premium.

ANIMATION (subtle, not showy):
- Sections fade/slide in on scroll, once, not repeatedly on every scroll
  direction change.
- Feature cards get a gentle hover lift on desktop (translateY + shadow),
  no hover effect needed on mobile (touch has no hover).
- Respect prefers-reduced-motion — disable scroll animations entirely for
  users with that OS setting on.
- Keep total page weight light — this is a PWA, first paint speed matters
  more than motion polish here.

RESPONSIVE:
- Feature cards: single column on mobile, 2-column on tablet, 3-column
  grid on desktop — reuse the same breakpoint logic already established
  (768px / 1024px).

DELIVERABLE: Screenshot at 375px and 1280px before I test. I'll check it
against the real modules built so far to confirm nothing listed is
aspirational/not-yet-built.