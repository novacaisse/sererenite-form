"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STATUSES, TYPE_INSCRIPTION_OPTIONS } from "@/lib/config";
import type { Lead, TypeInscription } from "@/types/database";

function statusLabel(value: string) {
  return PIPELINE_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export default function ContactsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select("*")
      .order("nom_complet", { ascending: true })
      .then(({ data }) => {
        setLeads(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter(
      (l) =>
        l.nom_complet.toLowerCase().includes(term) ||
        l.entreprise.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.telephone.toLowerCase().includes(term),
    );
  }, [leads, search]);

  const groups: { type: TypeInscription; label: string; rows: Lead[] }[] = useMemo(
    () =>
      TYPE_INSCRIPTION_OPTIONS.map((option) => ({
        type: option.value,
        label: option.label,
        rows: filtered.filter((l) => l.type_inscription === option.value),
      })),
    [filtered],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold">Contacts</h1>
          <p className="mt-1 text-sm text-app-text-muted">
            Répertoire complet des inscrits, {filtered.length} résultat(s).
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm font-semibold hover:opacity-80"
        >
          Télécharger en PDF
        </button>
      </div>

      <div className="mt-4 print:hidden">
        <input
          type="text"
          placeholder="Rechercher (nom, entreprise, email, téléphone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-sm outline-none focus:border-fuchsia focus:ring-2 focus:ring-fuchsia/15"
        />
      </div>

      {/* Print-only header: window.print() has no access to the admin chrome
          around this page, so the PDF needs its own title and date. */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Sérénité 2026 — Répertoire des contacts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Exporté le {new Date().toLocaleDateString("fr-FR")} — {filtered.length} contact(s)
          {search ? ` — recherche : "${search}"` : ""}
        </p>
      </div>

      {loading && <p className="mt-8 text-sm text-app-text-muted">Chargement...</p>}

      {!loading && (
        <div className="mt-6 space-y-8">
          {groups.map(
            (group) =>
              group.rows.length > 0 && (
                <section key={group.type} className="break-inside-avoid">
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-fuchsia print:text-navy">
                    {group.label} <span className="text-app-text-muted">({group.rows.length})</span>
                  </h2>
                  <div className="overflow-x-auto rounded-2xl border border-app-border bg-app-surface print:overflow-visible print:rounded-none print:border-slate-300 print:bg-white">
                    <table className="w-full min-w-[700px] text-left text-sm print:min-w-0 print:text-xs">
                      <thead className="border-b border-app-border bg-app-surface-2 text-xs uppercase text-app-text-muted print:bg-slate-100 print:text-slate-600">
                        <tr>
                          <th className="px-3 py-2">Nom</th>
                          <th className="px-3 py-2">Entreprise</th>
                          <th className="px-3 py-2">Poste</th>
                          <th className="px-3 py-2">Téléphone</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2 print:hidden">Statut</th>
                          <th className="px-3 py-2">Inscrit le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((lead) => (
                          <tr key={lead.id} className="border-b border-app-border last:border-0 print:border-slate-200">
                            <td className="px-3 py-2 font-medium">
                              <Link
                                href={`/admin/prospects/${lead.id}`}
                                className="hover:text-fuchsia hover:underline print:pointer-events-none print:text-inherit print:no-underline"
                              >
                                {lead.nom_complet}
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-app-text-muted print:text-slate-700">{lead.entreprise}</td>
                            <td className="px-3 py-2 text-app-text-muted print:text-slate-700">{lead.poste || "—"}</td>
                            <td className="px-3 py-2 text-app-text-muted print:text-slate-700">{lead.telephone}</td>
                            <td className="px-3 py-2 text-app-text-muted print:text-slate-700">{lead.email}</td>
                            <td className="px-3 py-2 print:hidden">{statusLabel(lead.statut_pipeline)}</td>
                            <td className="px-3 py-2 text-app-text-muted print:text-slate-700">
                              {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ),
          )}
          {filtered.length === 0 && (
            <p className="text-sm text-app-text-muted">Aucun contact ne correspond à cette recherche.</p>
          )}
        </div>
      )}
    </div>
  );
}
