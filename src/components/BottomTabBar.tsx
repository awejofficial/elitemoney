"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartIcon,
  HandCoinsIcon,
  HomeIcon,
  LedgerIcon,
  MoreIcon,
} from "@/components/icons";

const TABS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon, match: (p: string) => p === "/dashboard" },
  { href: "/transactions", label: "Transactions", icon: LedgerIcon, match: (p: string) => p.startsWith("/transactions") },
  { href: "/people", label: "Lending", icon: HandCoinsIcon, match: (p: string) => p.startsWith("/people") },
  { href: "/reports", label: "Reports", icon: ChartIcon, match: (p: string) => p.startsWith("/reports") },
  {
    href: "/more",
    label: "More",
    icon: MoreIcon,
    match: (p: string) =>
      p.startsWith("/more") ||
      p.startsWith("/accounts") ||
      p.startsWith("/categories") ||
      p.startsWith("/recurring") ||
      p.startsWith("/notifications") ||
      p.startsWith("/security"),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2"
          >
            <Icon
              size={22}
              className={`transition-[color,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                active ? "scale-110 text-palm-strong" : "scale-100 text-muted"
              }`}
            />
            <span
              className={`text-[11px] transition-colors duration-200 ${
                active ? "font-medium text-palm-strong" : "text-muted"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
