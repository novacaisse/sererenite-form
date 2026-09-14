"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STATUSES } from "@/lib/config";
import type { Lead, StatutPipeline } from "@/types/database";

export default function VisiteursPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select("*")
      .eq("type_inscription", "visiteur")
      .order("created_at", { ascending: false })
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

  async function updateStatus(leadId: string, newStatus: StatutPipeline) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, statut_pipeline: newStatus } : l)));
    const supabase = createClient();
    await supabase.from("leads").update({ statut_pipeline: newStatus }).eq("id", leadId);
  }

  return (
    <div>
      <div>
        <h1 className="text-xl font-bold">Visiteurs</h1>
        <p className="mt-1 text-sm text-app-text-muted">
          Inscrits à titre individuel — {filtered.length} résultat(s). Les exposants et partenaires sont
          dans l&apos;onglet Prospects.
        </p>
      </div>

      <div className="mt-4">
        <input
          type="text"
          placeholder="Rechercher (nom, entreprise, email, téléphone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2.5 text-sm outline-none focus:border-fuchsia focus:ring-2 focus:ring-fuchsia/15 sm:max-w-sm"
        />
      </div>

      {loading && <p className="mt-8 text-sm text-app-text-muted">Chargement...</p>}

      {!loading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-app-text-muted">Aucun visiteur ne correspond à cette recherche.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-5 space-y-2">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface p-3"
            >
              <Link href={`/admin/prospects/${lead.id}`} className="min-w-[160px] flex-1">
                <p className="text-sm font-semibold">{lead.nom_complet}</p>
                <p className="text-xs text-app-text-muted">
                  {lead.entreprise || "Individuel"} · {lead.telephone}
                </p>
              </Link>
              <select
                value={lead.statut_pipeline}
                onChange={(e) => updateStatus(lead.id, e.target.value as StatutPipeline)}
                className="rounded-lg border border-app-border bg-app-surface-2 px-2 py-1.5 text-xs outline-none focus:border-fuchsia"
              >
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
