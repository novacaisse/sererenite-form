"use client";

import type { TypeInscription } from "@/types/database";

const ICONS: Record<string, React.ReactNode> = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M9 8h.01M9 12h.01M9 16h.01M13 8h.01M13 12h.01M13 16h.01M15 21v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4"
      />
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11 17 2 2a1.5 1.5 0 0 0 2-2l-2-2M9 15l2 2a1.5 1.5 0 0 0 2-2l-3-3M6 12l2.5 2.5M2 9l4-4a2 2 0 0 1 2.5-.5l1 .5M22 9l-4-4a2 2 0 0 0-2.5-.5L9 8 6 11l6 6 3-3"
      />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
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
  description: string;
  icon: "building" | "handshake" | "ticket";
  selected: boolean;
  onSelect: (value: TypeInscription) => void;
}

export function TypeCard({ value, label, description, icon, selected, onSelect }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={`group flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-150 sm:p-5 ${
        selected
          ? "border-fuchsia bg-fuchsia/5 shadow-[0_0_0_4px_rgba(233,30,140,0.12)]"
          : "border-slate-200 bg-white hover:border-navy/30 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          selected ? "bg-fuchsia text-white" : "bg-navy/5 text-navy group-hover:bg-navy/10"
        }`}
      >
        {ICONS[icon]}
      </span>
      <span className="text-base font-semibold text-navy">{label}</span>
      <span className="text-sm leading-snug text-slate-500">{description}</span>
    </button>
  );
}
