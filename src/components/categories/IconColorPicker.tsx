"use client";

import { useState } from "react";

const PRESET_ICONS = [
  "💰", "💼", "🎁", "📈", "💳", "🤝", "🛒", "🏠", "🚌", "💡",
  "🎬", "📦", "🍔", "🏥", "🎓", "✈️", "🐾", "🎉", "🧾", "⚡",
];

export default function IconColorPicker({
  defaultIcon = "💰",
  defaultColor = "#8b8262",
}: {
  defaultIcon?: string;
  defaultColor?: string;
}) {
  const [icon, setIcon] = useState(defaultIcon);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          name="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={4}
          required
          className="w-14 rounded-md border border-border bg-surface px-2 py-2 text-center text-lg outline-none focus:border-palm"
        />
        <input
          name="color"
          type="color"
          defaultValue={defaultColor}
          className="h-10 w-14 cursor-pointer rounded-md border border-border"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESET_ICONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setIcon(emoji)}
            className={`rounded-md border px-1.5 py-1 text-base ${
              icon === emoji ? "border-palm bg-sand-tint" : "border-border"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
