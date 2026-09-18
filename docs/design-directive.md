DESIGN & POLISH DIRECTIVE — insert as Module 4.5, before Module 5

Before building Reports & Analytics, stop and do a full visual design pass on
everything built so far (Auth, Accounts, Categories, Transactions). This is
not a cosmetic afterthought — treat it as its own module with the same
test-and-approve gate as the others.

GOAL: This should look like a paid, professionally designed product —
something that could sit next to Apple's own first-party apps (Wallet,
Health) without looking out of place. Not a Bootstrap/shadcn template with
different colors.

AVOID THESE — they're the tells of an unstyled AI-generated app:
- Default Inter/system-ui font with no type hierarchy beyond bold/not-bold
- Default Tailwind indigo/violet/blue as the primary accent color
- Generic purple-to-blue gradient hero sections or buttons
- Centered white cards with a soft drop-shadow as the only layout idea
- Stock icon libraries used exactly as downloaded (Lucide/Heroicons) with no
  customization — every AI-built app uses these at default weight and size
- Rounded-full pill badges/buttons scattered everywhere without hierarchy
- Uniform 16px padding on everything instead of a deliberate spacing scale
- Empty states that are just gray text saying "No data yet"

DO THIS INSTEAD:
1. Typography — pick a distinctive font pairing (e.g. a characterful
   display face for headings/balances, a clean workhorse for body text).
   Define a real type scale (not just text-sm/base/lg) and use it
   consistently for hierarchy.
2. Color system — define an intentional custom palette (primary, accent,
   semantic success/danger/warning, neutrals) with proper light AND dark
   mode variants. No default Tailwind palette used as-is.
3. Iconography — do not use a generic icon set at default settings. Either
   customize weight/style consistently across the whole app, or hand-pick a
   more distinctive icon library, or generate/commission a small custom set
   for the core actions (add transaction, lending, accounts, categories).
   Every icon in the app should feel like it belongs to the same family.
4. Spacing & layout — use a consistent spacing scale (4/8px grid), generous
   whitespace, and real layout variety (not everything as a centered
   shadow-card). Money amounts should have clear visual weight/hierarchy.
5. Motion — subtle, purposeful micro-interactions: smooth screen
   transitions, button press feedback, skeleton loaders instead of spinners,
   numbers that count up/down on change. Nothing gratuitous.
6. Custom empty/zero states — designed, not just gray placeholder text.
7. Responsive correctness — verify actual rendering (not just "should work")
   on iPhone SE, iPhone 15/16 Pro, iPad, and a standard desktop width. Fix
   real layout breaks, not just add more media queries reactively.

You have full latitude to pull in whatever you need to hit this bar —
additional npm packages, an animation library (e.g. Framer Motion), a better
icon library, design tooling, sub-agents for design review — your call.
Just keep the dependency footprint sane for a personal PWA (no huge unused
libraries).

After this pass: give me a summary of the design decisions you made (fonts,
palette, icon approach) and screenshots/description of key screens before I
test manually. I will approve or send it back with specific feedback before
Module 5 starts.