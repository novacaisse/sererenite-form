"use client";

import type { TypeInscription } from "@/types/database";

const ICONS: Record<string, React.ReactNode> = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M9 8h.01M9 12h.01M9 16h.01M13 8h.01M13 12h.01M13 16h.01M15 21v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4"
      />
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11 17 2 2a1.5 1.5 0 0 0 2-2l-2-2M9 15l2 2a1.5 1.5 0 0 0 2-2l-3-3M6 12l2.5 2.5M2 9l4-4a2 2 0 0 1 2.5-.5l1 .5M22 9l-4-4a2 2 0 0 0-2.5-.5L9 8 6 11l6 6 3-3"
      />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9ZM10 6v12"
      />
    </svg>
  ),
};

interface TypeCardProps {
  value: TypeInscription;
  label: string;
  icon: "building" | "handshake" | "ticket";
  selected: boolean;
  onSelect: (value: TypeInscription) => void;
}

export function TypeCard({ value, label, icon, selected, onSelect }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={`flex min-h-[68px] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-center transition-colors ${
        selected
          ? "border-fuchsia bg-fuchsia text-white"
          : "border-slate-300 bg-white text-navy hover:border-navy/40 hover:bg-slate-50"
      }`}
    >
      {ICONS[icon]}
      <span className="text-[11px] font-semibold leading-tight break-words sm:text-xs">{label}</span>
    </button>
  );
}
