"use client";

import { useState } from "react";

export type CategorySlice = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryDonut({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const [active, setActive] = useState<string | null>(null);

  if (total === 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <div
          className="rounded-full border-[14px] border-border"
          style={{ width: SIZE, height: SIZE }}
        />
        <p className="text-sm text-muted">Nothing this month</p>
      </div>
    );
  }

  const activeSlice = slices.find((s) => s.categoryId === active);

  const { segments } = slices.reduce<{
    segments: { slice: CategorySlice; dasharray: string; offset: number }[];
    cumulative: number;
  }>(
    (acc, slice) => {
      const length = (slice.amount / total) * CIRCUMFERENCE;
      const gap = 2;
      const dasharray = `${Math.max(length - gap, 0)} ${CIRCUMFERENCE - Math.max(length - gap, 0)}`;
      acc.segments.push({ slice, dasharray, offset: -acc.cumulative });
      return { segments: acc.segments, cumulative: acc.cumulative + length };
    },
    { segments: [], cumulative: 0 },
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          {segments.map(({ slice, dasharray, offset }) => {
            const isActive = active === slice.categoryId;

            return (
              <circle
                key={slice.categoryId}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={isActive ? STROKE + 4 : STROKE}
                strokeDasharray={dasharray}
                strokeDashoffset={offset}
                strokeLinecap="round"
                opacity={active && !isActive ? 0.35 : 1}
                onClick={() => setActive(isActive ? null : slice.categoryId)}
                className="cursor-pointer transition-all"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
          {activeSlice ? (
            <>
              <span className="text-lg">{activeSlice.icon}</span>
              <span className="font-amount text-base font-semibold text-ink">
                {currency.format(activeSlice.amount)}
              </span>
              <span className="max-w-[8rem] truncate text-xs text-muted">{activeSlice.name}</span>
            </>
          ) : (
            <>
              <span className="text-xs text-muted">Total</span>
              <span className="font-amount text-lg font-semibold text-ink">
                {currency.format(total)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        {slices
          .slice()
          .sort((a, b) => b.amount - a.amount)
          .map((slice) => (
            <button
              key={slice.categoryId}
              onClick={() => setActive(active === slice.categoryId ? null : slice.categoryId)}
              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left transition ${
                active === slice.categoryId ? "bg-surface-sunken" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-sm text-ink">
                  {slice.icon} {slice.name}
                </span>
              </span>
              <span className="shrink-0 font-amount text-sm font-medium text-ink">
                {currency.format(slice.amount)}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
