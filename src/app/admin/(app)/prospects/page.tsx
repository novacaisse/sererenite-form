"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PIPELINE_STATUSES, TYPE_INSCRIPTION_OPTIONS } from "@/lib/config";
import type { Lead } from "@/types/database";

type SortKey = "created_at" | "prochaine_action_date";

function isOverdue(lead: Lead): boolean {
  if (!lead.prochaine_action_date) return false;
  if (lead.statut_pipeline === "converti" || lead.statut_pipeline === "perdu") return false;
  return new Date(lead.prochaine_action_date).getTime() < Date.now();
}

function statusLabel(value: string) {
  return PIPELINE_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function statusColor(value: string) {
  return PIPELINE_STATUSES.find((s) => s.value === value)?.color ?? "bg-slate-200 text-slate-700";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("leads")
      .select("*")
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
    let rows = leads.filter((l) => {
      const matchesSearch =
        !term ||
        l.nom_complet.toLowerCase().includes(term) ||
        l.entreprise.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.telephone.toLowerCase().includes(term);
      const matchesType = typeFilter === "all" || l.type_inscription === typeFilter;
      const matchesStatus = statusFilter === "all" || l.statut_pipeline === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || l.assigne_a === assigneeFilter;
      return matchesSearch && matchesType && matchesStatus && matchesAssignee;
    });

    rows = [...rows].sort((a, b) => {
      const aVal = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
      const bVal = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return rows;
  }, [leads, search, typeFilter, statusFilter, assigneeFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy">Prospects</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} résultat(s)</p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          Exporter en CSV
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Rechercher (nom, entreprise, email, téléphone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-fuchsia focus:ring-2 focus:ring-fuchsia/15"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-fuchsia"
        >
          <option value="all">Tous les types</option>
          {TYPE_INSCRIPTION_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-fuchsia"
        >
          <option value="all">Tous les statuts</option>
          {PIPELINE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-fuchsia"
        >
          <option value="all">Tous les commerciaux</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Assigné à</th>
              <th
                className="cursor-pointer select-none px-4 py-3"
                onClick={() => toggleSort("prochaine_action_date")}
              >
                Prochaine action {sortKey === "prochaine_action_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort("created_at")}>
                Inscrit le {sortKey === "created_at" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Aucun prospect ne correspond à ces critères.
                </td>
              </tr>
            )}
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                  isOverdue(lead) ? "bg-rose-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link href={`/admin/prospects/${lead.id}`} className="font-medium text-navy hover:underline">
                    {lead.nom_complet}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.entreprise}</td>
                <td className="px-4 py-3 text-slate-600">
                  {TYPE_INSCRIPTION_OPTIONS.find((t) => t.value === lead.type_inscription)?.label}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(lead.statut_pipeline)}`}>
                    {statusLabel(lead.statut_pipeline)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.assigne_a || "—"}</td>
                <td className={`px-4 py-3 ${isOverdue(lead) ? "font-semibold text-rose-600" : "text-slate-600"}`}>
                  {lead.prochaine_action_date
                    ? new Date(lead.prochaine_action_date).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
