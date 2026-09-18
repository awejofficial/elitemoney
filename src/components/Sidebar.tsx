"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  CalendarIcon,
  ChartIcon,
  HandCoinsIcon,
  HomeIcon,
  LedgerIcon,
  LockIcon,
  LogOutIcon,
  LogoIcon,
  TagIcon,
  WalletIcon,
} from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: typeof HomeIcon;
  match: (p: string) => boolean;
};

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Home", icon: HomeIcon, match: (p) => p === "/dashboard" },
      { href: "/transactions", label: "Transactions", icon: LedgerIcon, match: (p) => p.startsWith("/transactions") },
      { href: "/people", label: "Lending", icon: HandCoinsIcon, match: (p) => p.startsWith("/people") },
      { href: "/reports", label: "Reports", icon: ChartIcon, match: (p) => p.startsWith("/reports") },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/accounts", label: "Accounts", icon: WalletIcon, match: (p) => p.startsWith("/accounts") },
      { href: "/categories", label: "Categories", icon: TagIcon, match: (p) => p.startsWith("/categories") },
      { href: "/recurring", label: "Recurring", icon: CalendarIcon, match: (p) => p.startsWith("/recurring") },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/notifications", label: "Notifications", icon: BellIcon, match: (p) => p.startsWith("/notifications") },
      { href: "/security", label: "Security", icon: LockIcon, match: (p) => p.startsWith("/security") },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="safe-top sticky top-0 hidden h-screen w-16 shrink-0 flex-col border-r border-border bg-surface py-4 md:flex lg:w-56">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-3 lg:px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-palm-strong text-paper">
          <LogoIcon size={18} />
        </span>
        <span className="hidden font-display text-base font-semibold text-palm-strong lg:block">
          PEIT
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2">
        {GROUPS.map((group, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="hidden px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted/70 lg:block">
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors lg:px-3 ${
                    active
                      ? "bg-sand-tint text-palm-strong"
                      : "text-muted hover:bg-surface-sunken hover:text-ink"
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  <span className={`hidden truncate text-sm lg:block ${active ? "font-medium" : ""}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        title="Log out"
        className="mx-2 mt-2 flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-muted transition-colors hover:bg-surface-sunken hover:text-ink lg:px-3"
      >
        <LogOutIcon size={19} className="shrink-0" />
        <span className="hidden text-sm lg:block">Log out</span>
      </button>
    </aside>
  );
}
