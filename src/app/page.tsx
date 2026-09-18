import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import {
  CalendarIcon,
  ChartIcon,
  FingerprintIcon,
  HandCoinsIcon,
  LogoIcon,
  PhoneIcon,
  TagIcon,
  WalletIcon,
} from "@/components/icons";

const FEATURES = [
  {
    icon: WalletIcon,
    title: "Accounts & total balance",
    description:
      "Bank, cash, and wallet accounts rolled into one running total on the home screen — with each account's own balance always a tap away.",
    screenshot: "/screenshots/accounts.png",
  },
  {
    icon: TagIcon,
    title: "Custom income & expense categories",
    description:
      "Salary, SIP, Chit Fund and more come built in — pick your own icon and color, or add categories of your own.",
    screenshot: "/screenshots/categories.png",
  },
  {
    icon: CalendarIcon,
    title: "Recurring transactions",
    description:
      "Set a SIP, EMI, or chit fund once and it logs itself every month, right on schedule — no manual re-entry.",
    screenshot: "/screenshots/recurring.png",
  },
  {
    icon: HandCoinsIcon,
    title: "Friends & family lending tracker",
    description:
      "Track money lent and borrowed per person, with a running net balance and partial or full settle-up.",
    screenshot: "/screenshots/lending.png",
  },
  {
    icon: ChartIcon,
    title: "Reports & calendar view",
    description:
      "Category breakdown, a 6-month income vs. expense trend, and a calendar you can tap to see or add any day's activity.",
    screenshot: "/screenshots/reports.png",
  },
  {
    icon: FingerprintIcon,
    title: "PIN & biometric lock",
    description:
      "An optional PIN or Face ID/Touch ID lock on top of your account login — off by default, on when you want it.",
    screenshot: "/screenshots/security.png",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="ledger-texture flex flex-col items-center gap-6 bg-palm-strong px-4 py-20 text-center text-paper sm:py-28">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palm-strong ring-2 ring-paper/50">
          <LogoIcon size={28} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">PEIT</h1>
          <p className="mx-auto max-w-md text-base text-paper/80 sm:text-lg">
            Track income, expenses, and money owed between friends and family — all in one
            place.
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-paper px-6 py-3 text-sm font-medium text-palm-strong transition hover:brightness-95 active:scale-95"
        >
          Sign In
        </Link>
        <p className="text-xs text-paper/60">
          No account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6">
        <ScrollReveal className="text-center">
          <h2 className="font-display text-2xl font-medium text-ink">Everything in one app</h2>
          <p className="mt-1 text-sm text-muted">
            Every screen below is the real app — not a mockup.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, screenshot }, i) => (
            <ScrollReveal key={title} delayMs={(i % 3) * 80}>
              <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-44 w-full overflow-hidden border-b border-border bg-surface-sunken">
                  <Image
                    src={screenshot}
                    alt={`${title} screen in PEIT`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand-tint text-palm-strong">
                    <Icon size={18} />
                  </span>
                  <h3 className="font-display text-base font-medium text-ink">{title}</h3>
                  <p className="text-sm text-muted">{description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}

          <ScrollReveal delayMs={0}>
            <div className="group flex h-full flex-col justify-center gap-3 rounded-xl border border-border bg-surface p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand-tint text-palm-strong">
                <PhoneIcon size={18} />
              </span>
              <h3 className="font-display text-base font-medium text-ink">
                Installs like a real app
              </h3>
              <p className="text-sm text-muted">
                Add PEIT to your phone&apos;s home screen straight from the browser — runs
                full-screen, works offline, and can send you due-date reminders. No app store
                needed.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
