"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // OS motion preference can't be known during SSR/first paint, so
      // reading it in an effect is correct here, not a case this rule targets.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // Generous rootMargin + threshold 0: a fast fling, scrollbar drag, or
    // End-key jump can move the viewport past an element in one frame
    // without ever satisfying a narrow threshold, permanently stranding
    // it at opacity-0. Triggering well before/after the element is
    // strictly in view makes that effectively impossible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "200px 0px" },
    );
    observer.observe(el);

    // Belt-and-suspenders: never leave content permanently invisible even
    // if the observer somehow misses it entirely.
    const fallback = setTimeout(() => setVisible(true), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
