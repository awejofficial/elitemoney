import Link from "next/link";
import AppLockOverlay from "@/components/AppLockOverlay";
import LogoutButton from "@/components/LogoutButton";
import BottomTabBar from "@/components/BottomTabBar";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";
import { BellIcon, LockIcon, LogoIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { runDueRecurringRules } from "@/lib/recurring";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await runDueRecurringRules(supabase, user.id);
  }

  return (
    <AppLockOverlay>
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <div className="flex min-h-full flex-1 flex-col">
          <header className="safe-top flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 md:hidden">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-palm-strong text-paper">
                <LogoIcon size={16} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-base font-semibold text-palm-strong">PEIT</span>
                <span className="hidden text-[10px] text-muted sm:block">
                  Personal Expense &amp; Income Tracker
                </span>
              </span>
            </span>
            <div className="flex items-center gap-1">
              <Link
                href="/notifications"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-sunken hover:text-ink"
                title="Notifications"
              >
                <BellIcon size={16} />
              </Link>
              <Link
                href="/security"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-sunken hover:text-ink"
                title="Security"
              >
                <LockIcon size={16} />
              </Link>
              <LogoutButton />
            </div>
          </header>
          <div className="flex flex-1 flex-col pb-24 md:pb-0">
            <PageTransition>{children}</PageTransition>
          </div>
          <BottomTabBar />
        </div>
      </div>
    </AppLockOverlay>
  );
}
