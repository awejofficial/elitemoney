import { LogoIcon } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center gap-1">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-palm-strong text-paper">
          <LogoIcon size={22} />
        </span>
        <span className="font-display text-lg font-medium text-ink">PEIT</span>
        <span className="text-xs text-muted">Personal Expense &amp; Income Tracker</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
