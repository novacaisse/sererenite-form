"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Tableau de bord",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/prospects",
    label: "Prospects",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
        <circle cx="9" cy="8" r="3.5" />
        <path strokeLinecap="round" d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path strokeLinecap="round" d="M16.5 5.5a3.5 3.5 0 0 1 0 7M21.5 20a6 6 0 0 0-5-6" />
      </svg>
    ),
  },
  {
    href: "/admin/relances",
    label: "Relances",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path strokeLinecap="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/admin/contacts",
    label: "Contacts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M7 9h10M7 13h10M7 17h6" />
      </svg>
    ),
  },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-admin.js", { scope: "/admin/" }).catch(() => {
        // Installability is a nice-to-have, not required for the CRM to work.
      });
    }
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text print:bg-white print:text-black">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-app-border bg-app-surface px-4 py-3 print:hidden">
        <div>
          <p className="text-sm font-bold">Sérénité 2026</p>
          <p className="text-xs text-app-text-muted">Espace commercial</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia text-sm font-semibold text-white"
          >
            {email.slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4 print:p-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-app-border bg-app-surface pb-[env(safe-area-inset-bottom)] print:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  active ? "text-fuchsia" : "text-app-text-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-app-text-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
            Plus
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50" onClick={() => setMenuOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-2xl border-t border-app-border bg-app-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-app-text-muted">Connecté en tant que</p>
                <p className="font-medium">{email}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-app-surface-2 text-app-text-muted"
              >
                ✕
              </button>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-500"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
