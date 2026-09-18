import Link from "next/link";
import {
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  LockIcon,
  TagIcon,
  WalletIcon,
} from "@/components/icons";

const ITEMS = [
  { href: "/accounts", icon: WalletIcon, label: "Accounts", desc: "Bank, cash, wallet balances" },
  { href: "/categories", icon: TagIcon, label: "Categories", desc: "Income & expense categories" },
  { href: "/recurring", icon: CalendarIcon, label: "Recurring", desc: "SIPs, EMIs, chit funds" },
  { href: "/notifications", icon: BellIcon, label: "Notifications", desc: "Due-date reminders" },
  { href: "/security", icon: LockIcon, label: "Security", desc: "PIN & biometric lock" },
];

export default function MorePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="font-display text-xl font-medium text-ink">More</h1>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-sunken"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-tint text-palm-strong">
                <Icon size={17} />
              </span>
              <div>
                <p className="font-medium text-ink">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            </div>
            <ChevronRightIcon size={16} className="text-muted" />
          </Link>
        ))}
      </div>
    </main>
  );
}
