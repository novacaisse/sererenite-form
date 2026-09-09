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
      .not("statut_pipeline", "in", "(converti,perdu)")
      .or(`prochaine_action_date.lte.${new Date().toISOString()},statut_pipeline.eq.urgent_a_contacter`)
      .then(({ data }) => {
        setLeads(data ?? []);
        setLoading(false);
      });
  }, []);

  const sorted = useMemo(
    () =>
      [...leads].sort((a, b) => {
        const aUrgent = a.statut_pipeline === "urgent_a_contacter" ? 0 : 1;
        const bUrgent = b.statut_pipeline === "urgent_a_contacter" ? 0 : 1;
        if (aUrgent !== bUrgent) return aUrgent - bUrgent;
        const aDate = a.prochaine_action_date ? new Date(a.prochaine_action_date).getTime() : 0;
        const bDate = b.prochaine_action_date ? new Date(b.prochaine_action_date).getTime() : 0;
        return aDate - bDate;
      }),
    [leads],
  );

  return (
    <div>
      <h1 className="text-xl font-bold">Relances du jour</h1>
      <p className="mt-1 text-sm text-app-text-muted">
        Prospects à contacter aujourd&apos;hui, triés par urgence — {sorted.length} au total.
      </p>

      {loading && <p className="mt-6 text-sm text-app-text-muted">Chargement...</p>}

      {!loading && sorted.length === 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-500">
          Aucune relance en retard. Tout est à jour ✅
        </div>
      )}

      <div className="mt-6 space-y-3">
        {sorted.map((lead) => {
          const urgent = lead.statut_pipeline === "urgent_a_contacter";
          const late = lead.prochaine_action_date ? daysLate(lead.prochaine_action_date) : 0;
          return (
            <Link
              key={lead.id}
              href={`/admin/prospects/${lead.id}`}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-app-surface p-4 transition-colors hover:border-fuchsia/40 ${
                urgent ? "border-rose-500/40" : "border-app-border"
              }`}
            >
              <div>
                <p className="font-semibold">{lead.nom_complet}</p>
                <p className="text-sm text-app-text-muted">
                  {lead.entreprise} ·{" "}
                  {TYPE_INSCRIPTION_OPTIONS.find((t) => t.value === lead.type_inscription)?.label}
                </p>
                {lead.prochaine_action && <p className="mt-1 text-sm">{lead.prochaine_action}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    urgent ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-500"
                  }`}
                >
                  {urgent
                    ? "Urgent — non contacté depuis 3h"
                    : late <= 0
                      ? "Aujourd'hui"
                      : `En retard de ${late} j`}
                </span>
                <span className="text-xs text-app-text-muted">
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
