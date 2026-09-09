"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STATUSES, TYPE_INSCRIPTION_OPTIONS } from "@/lib/config";
import type { Lead, StatutPipeline } from "@/types/database";

function isOverdue(lead: Lead): boolean {
  if (!lead.prochaine_action_date) return false;
  if (lead.statut_pipeline === "converti" || lead.statut_pipeline === "perdu") return false;
  return new Date(lead.prochaine_action_date).getTime() < Date.now();
}

function toCsvValue(value: string | null | undefined) {
  const v = (value ?? "").replace(/"/g, '""');
  return `"${v}"`;
}

function exportCsv(leads: Lead[]) {
  const headers = [
    "Nom complet",
    "Entreprise",
    "Poste",
    "Téléphone",
    "Email",
    "Type",
    "Statut pipeline",
    "Assigné à",
    "Prochaine action",
    "Date prochaine action",
    "Date d'inscription",
  ];
  const rows = leads.map((l) =>
    [
      l.nom_complet,
      l.entreprise,
      l.poste,
      l.telephone,
      l.email,
      l.type_inscription,
      l.statut_pipeline,
      l.assigne_a,
      l.prochaine_action,
      l.prochaine_action_date,
      l.created_at,
    ]
      .map(toCsvValue)
      .join(","),
  );
  const csv = [headers.map(toCsvValue).join(","), ...rows].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prospects-serenite-2026-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProspectsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatutPipeline | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLeads(data ?? []);
        setLoading(false);
      });
  }, []);

  const assignees = useMemo(
    () => Array.from(new Set(leads.map((l) => l.assigne_a).filter((v): v is string => Boolean(v)))),
    [leads],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesSearch =
        !term ||
        l.nom_complet.toLowerCase().includes(term) ||
        l.entreprise.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.telephone.toLowerCase().includes(term);
      const matchesType = typeFilter === "all" || l.type_inscription === typeFilter;
      const matchesAssignee = assigneeFilter === "all" || l.assigne_a === assigneeFilter;
      return matchesSearch && matchesType && matchesAssignee;
    });
  }, [leads, search, typeFilter, assigneeFilter]);

  const columns = useMemo(
    () =>
      PIPELINE_STATUSES.map((status) => ({
        ...status,
        leads: filtered.filter((l) => l.statut_pipeline === status.value),
      })),
    [filtered],
  );

  async function moveLead(leadId: string, newStatus: StatutPipeline) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.statut_pipeline === newStatus) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, statut_pipeline: newStatus } : l)));

    const supabase = createClient();
    await supabase.from("leads").update({ statut_pipeline: newStatus }).eq("id", leadId);
    await supabase.from("interactions").insert({
      lead_id: leadId,
      type_interaction: "note",
      commentaire: `Statut changé vers "${PIPELINE_STATUSES.find((s) => s.value === newStatus)?.label}" (pipeline)`,
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Prospects</h1>
          <p className="mt-1 text-sm text-app-text-muted">{filtered.length} résultat(s)</p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="rounded-lg border border-app-border bg-app-surface px-4 py-2 text-sm font-semibold hover:opacity-80"
        >
          Exporter en CSV
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Rechercher (nom, entreprise, email, téléphone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-fuchsia focus:ring-2 focus:ring-fuchsia/15"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-fuchsia"
        >
          <option value="all">Tous les types</option>
          {TYPE_INSCRIPTION_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-fuchsia"
        >
          <option value="all">Tous les commerciaux</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mt-8 text-sm text-app-text-muted">Chargement...</p>}

      {!loading && (
        <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.value}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(column.value);
              }}
              onDragLeave={() => setDragOverColumn((c) => (c === column.value ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveLead(id, column.value);
                setDraggingId(null);
                setDragOverColumn(null);
              }}
              className={`flex w-[82vw] shrink-0 snap-start flex-col rounded-2xl border bg-app-surface-2 sm:w-72 ${
                dragOverColumn === column.value ? "border-fuchsia" : "border-app-border"
              }`}
            >
              <div className="flex items-center gap-2 border-b border-app-border px-3 py-3">
                <span className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                <p className="text-sm font-semibold">{column.label}</p>
                <span className="ml-auto rounded-full bg-app-border px-2 py-0.5 text-xs font-semibold text-app-text-muted">
                  {column.leads.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 p-2">
                {column.leads.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-app-text-muted">Aucun prospect</p>
                )}
                {column.leads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", lead.id);
                      setDraggingId(lead.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`rounded-xl border border-app-border bg-app-surface p-3 shadow-sm transition-opacity ${
                      draggingId === lead.id ? "opacity-40" : "opacity-100"
                    } ${isOverdue(lead) ? "ring-1 ring-rose-500/40" : ""}`}
                  >
                    <Link href={`/admin/prospects/${lead.id}`} className="block">
                      <p className="text-sm font-semibold">{lead.nom_complet}</p>
                      <p className="text-xs text-app-text-muted">{lead.entreprise}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-app-border px-2 py-0.5 text-[11px] text-app-text-muted">
                          {TYPE_INSCRIPTION_OPTIONS.find((t) => t.value === lead.type_inscription)?.label}
                        </span>
                        {isOverdue(lead) && (
                          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
                            En retard
                          </span>
                        )}
                      </div>
                      {lead.assigne_a && (
                        <p className="mt-1.5 text-[11px] text-app-text-muted">👤 {lead.assigne_a}</p>
                      )}
                    </Link>
                    {/* Native drag-and-drop doesn't fire from touch, so this
                        select is the mobile-friendly way to move a card. */}
                    <select
                      value={lead.statut_pipeline}
                      onChange={(e) => moveLead(lead.id, e.target.value as StatutPipeline)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full rounded-lg border border-app-border bg-app-surface-2 px-2 py-1.5 text-[11px] outline-none focus:border-fuchsia"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
