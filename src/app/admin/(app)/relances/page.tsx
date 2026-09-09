"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STATUSES, TYPE_INSCRIPTION_OPTIONS } from "@/lib/config";
import type { Lead } from "@/types/database";

function daysLate(dateStr: string): number {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function RelancesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select("*")
      .not("prochaine_action_date", "is", null)
      .not("statut_pipeline", "in", "(converti,perdu)")
      .lte("prochaine_action_date", new Date().toISOString())
      .order("prochaine_action_date", { ascending: true })
      .then(({ data }) => {
        setLeads(data ?? []);
        setLoading(false);
      });
  }, []);

  const sorted = useMemo(
    () =>
      [...leads].sort(
        (a, b) =>
          new Date(a.prochaine_action_date!).getTime() - new Date(b.prochaine_action_date!).getTime(),
      ),
    [leads],
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-navy">Relances du jour</h1>
      <p className="mt-1 text-sm text-slate-500">
        Prospects à contacter aujourd&apos;hui, triés par urgence — {sorted.length} au total.
      </p>

      {loading && <p className="mt-6 text-sm text-slate-400">Chargement...</p>}

      {!loading && sorted.length === 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">
          Aucune relance en retard. Tout est à jour ✅
        </div>
      )}

      <div className="mt-6 space-y-3">
        {sorted.map((lead) => {
          const late = daysLate(lead.prochaine_action_date!);
          return (
            <Link
              key={lead.id}
              href={`/admin/prospects/${lead.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-fuchsia/40 hover:bg-fuchsia/5"
            >
              <div>
                <p className="font-semibold text-navy">{lead.nom_complet}</p>
                <p className="text-sm text-slate-500">
                  {lead.entreprise} ·{" "}
                  {TYPE_INSCRIPTION_OPTIONS.find((t) => t.value === lead.type_inscription)?.label}
                </p>
                {lead.prochaine_action && (
                  <p className="mt-1 text-sm text-slate-600">{lead.prochaine_action}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  {late <= 0 ? "Aujourd'hui" : `En retard de ${late} j`}
                </span>
                <span className="text-xs text-slate-400">
                  {PIPELINE_STATUSES.find((s) => s.value === lead.statut_pipeline)?.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
