"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { INTERACTION_TYPES, PIPELINE_STATUSES, TYPE_INSCRIPTION_OPTIONS } from "@/lib/config";
import type { Interaction, Lead, StatutPipeline, TypeInscription, TypeInteraction } from "@/types/database";

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function waLink(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

interface InfoFormValues {
  nom_complet: string;
  entreprise: string;
  poste: string;
  telephone: string;
  email: string;
  type_inscription: TypeInscription;
}

export default function ProspectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoValues, setInfoValues] = useState<InfoFormValues | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);

  const [prochaineAction, setProchaineAction] = useState("");
  const [prochaineActionDate, setProchaineActionDate] = useState("");
  const [assigneA, setAssigneA] = useState("");
  const [notesGenerales, setNotesGenerales] = useState("");

  const [newInteraction, setNewInteraction] = useState<{
    type_interaction: TypeInteraction;
    resultat: string;
    commentaire: string;
    date_rdv: string;
    cree_par: string;
  }>({ type_interaction: "appel", resultat: "", commentaire: "", date_rdv: "", cree_par: "" });
  const [addingInteraction, setAddingInteraction] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: leadData }, { data: interactionsData }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", params.id).single(),
      supabase
        .from("interactions")
        .select("*")
        .eq("lead_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

    if (leadData) {
      setLead(leadData);
      setProchaineAction(leadData.prochaine_action ?? "");
      setProchaineActionDate(toDatetimeLocal(leadData.prochaine_action_date));
      setAssigneA(leadData.assigne_a ?? "");
      setNotesGenerales(leadData.notes_generales ?? "");
      setInfoValues({
        nom_complet: leadData.nom_complet,
        entreprise: leadData.entreprise,
        poste: leadData.poste ?? "",
        telephone: leadData.telephone,
        email: leadData.email,
        type_inscription: leadData.type_inscription,
      });
    }
    setInteractions(interactionsData ?? []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    // load() only sets state after its awaits resolve, so this doesn't
    // trigger a synchronous render loop despite the lint heuristic below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function updateStatus(newStatus: StatutPipeline) {
    if (!lead) return;
    setLead({ ...lead, statut_pipeline: newStatus });
    const supabase = createClient();
    await supabase.from("leads").update({ statut_pipeline: newStatus }).eq("id", lead.id);
    await supabase.from("interactions").insert({
      lead_id: lead.id,
      type_interaction: "note",
      commentaire: `Statut changé vers "${PIPELINE_STATUSES.find((s) => s.value === newStatus)?.label}"`,
    });
    load();
  }

  async function saveInfo() {
    if (!lead || !infoValues) return;
    setSavingInfo(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("leads")
      .update({
        nom_complet: infoValues.nom_complet.trim(),
        entreprise: infoValues.entreprise.trim(),
        poste: infoValues.poste.trim() || null,
        telephone: infoValues.telephone.trim(),
        email: infoValues.email.trim().toLowerCase(),
        type_inscription: infoValues.type_inscription,
      })
      .eq("id", lead.id);
    setSavingInfo(false);
    if (!error) {
      setEditingInfo(false);
      load();
    }
  }

  async function saveDetails() {
    if (!lead) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("leads")
      .update({
        prochaine_action: prochaineAction || null,
        prochaine_action_date: prochaineActionDate ? new Date(prochaineActionDate).toISOString() : null,
        assigne_a: assigneA || null,
        notes_generales: notesGenerales || null,
      })
      .eq("id", lead.id);
    setSaving(false);
    load();
  }

  async function deleteLead() {
    if (!lead) return;
    const confirmed = window.confirm(
      `Supprimer définitivement ${lead.nom_complet} et tout son historique d'interactions ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) {
      setDeleting(false);
      window.alert("La suppression a échoué. Merci de réessayer.");
      return;
    }
    router.push("/admin/prospects");
  }

  async function addInteraction(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;
    setAddingInteraction(true);
    const supabase = createClient();
    await supabase.from("interactions").insert({
      lead_id: lead.id,
      type_interaction: newInteraction.type_interaction,
      resultat: newInteraction.resultat || null,
      commentaire: newInteraction.commentaire || null,
      date_rdv:
        newInteraction.type_interaction === "rdv" && newInteraction.date_rdv
          ? new Date(newInteraction.date_rdv).toISOString()
          : null,
      cree_par: newInteraction.cree_par || null,
    });
    setNewInteraction({ type_interaction: "appel", resultat: "", commentaire: "", date_rdv: "", cree_par: "" });
    setAddingInteraction(false);
    load();
  }

  if (loading) {
    return <p className="text-sm text-app-text-muted">Chargement...</p>;
  }

  if (!lead || !infoValues) {
    return <p className="text-sm text-app-text-muted">Prospect introuvable.</p>;
  }

  return (
    <div>
      <Link href="/admin/prospects" className="text-sm text-app-text-muted hover:text-fuchsia">
        ← Retour aux prospects
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lead.nom_complet}</h1>
          <p className="text-sm text-app-text-muted">
            {lead.poste ? `${lead.poste} · ` : ""}
            {lead.entreprise}
          </p>
        </div>
        <select
          value={lead.statut_pipeline}
          onChange={(e) => updateStatus(e.target.value as StatutPipeline)}
          className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold outline-none focus:border-fuchsia"
        >
          {PIPELINE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`tel:${lead.telephone}`}
          className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-medium hover:opacity-80"
        >
          📞 Appeler
        </a>
        <a
          href={waLink(lead.telephone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-medium hover:opacity-80"
        >
          💬 WhatsApp
        </a>
        <a
          href={`mailto:${lead.email}`}
          className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-medium hover:opacity-80"
        >
          ✉️ Email
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Informations</h2>
              {!editingInfo && (
                <button
                  onClick={() => setEditingInfo(true)}
                  className="text-xs font-semibold text-fuchsia hover:underline"
                >
                  Modifier
                </button>
              )}
            </div>

            {!editingInfo ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-app-text-muted">Type</dt>
                  <dd className="font-medium">
                    {TYPE_INSCRIPTION_OPTIONS.find((t) => t.value === lead.type_inscription)?.label}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-app-text-muted">Téléphone</dt>
                  <dd className="font-medium">{lead.telephone}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-app-text-muted">Email</dt>
                  <dd className="break-all font-medium">{lead.email}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-app-text-muted">Source</dt>
                  <dd className="font-medium">{lead.source}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-app-text-muted">Inscrit le</dt>
                  <dd className="font-medium">{new Date(lead.created_at).toLocaleString("fr-FR")}</dd>
                </div>
              </dl>
            ) : (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-app-text-muted">Nom complet</label>
                  <input
                    value={infoValues.nom_complet}
                    onChange={(e) => setInfoValues({ ...infoValues, nom_complet: e.target.value })}
                    className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-app-text-muted">Entreprise</label>
                  <input
                    value={infoValues.entreprise}
                    onChange={(e) => setInfoValues({ ...infoValues, entreprise: e.target.value })}
                    className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-app-text-muted">Poste</label>
                  <input
                    value={infoValues.poste}
                    onChange={(e) => setInfoValues({ ...infoValues, poste: e.target.value })}
                    className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-app-text-muted">Type</label>
                  <select
                    value={infoValues.type_inscription}
                    onChange={(e) =>
                      setInfoValues({ ...infoValues, type_inscription: e.target.value as TypeInscription })
                    }
                    className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  >
                    {TYPE_INSCRIPTION_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-app-text-muted">Téléphone</label>
                  <input
                    value={infoValues.telephone}
                    onChange={(e) => setInfoValues({ ...infoValues, telephone: e.target.value })}
                    className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-app-text-muted">Email</label>
                  <input
                    value={infoValues.email}
                    onChange={(e) => setInfoValues({ ...infoValues, email: e.target.value })}
                    className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveInfo}
                    disabled={savingInfo}
                    className="flex-1 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-70"
                  >
                    {savingInfo ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingInfo(false);
                      setInfoValues({
                        nom_complet: lead.nom_complet,
                        entreprise: lead.entreprise,
                        poste: lead.poste ?? "",
                        telephone: lead.telephone,
                        email: lead.email,
                        type_inscription: lead.type_inscription,
                      });
                    }}
                    className="rounded-lg border border-app-border px-4 py-2 text-sm font-semibold hover:opacity-80"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <h2 className="text-sm font-semibold">Suivi commercial</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-app-text-muted">Assigné à</label>
                <input
                  value={assigneA}
                  onChange={(e) => setAssigneA(e.target.value)}
                  className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  placeholder="Nom du commercial"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-app-text-muted">Prochaine action</label>
                <input
                  value={prochaineAction}
                  onChange={(e) => setProchaineAction(e.target.value)}
                  className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                  placeholder="Ex : Appel de qualification"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-app-text-muted">
                  Date prochaine action
                </label>
                <input
                  type="datetime-local"
                  value={prochaineActionDate}
                  onChange={(e) => setProchaineActionDate(e.target.value)}
                  className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-app-text-muted">Notes générales</label>
                <textarea
                  value={notesGenerales}
                  onChange={(e) => setNotesGenerales(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                />
              </div>
              <button
                onClick={saveDetails}
                disabled={saving}
                className="w-full rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-70"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <h2 className="text-sm font-semibold text-rose-500">Zone dangereuse</h2>
            <p className="mt-1 text-xs text-app-text-muted">
              Supprime définitivement ce prospect et tout son historique d&apos;interactions.
            </p>
            <button
              onClick={deleteLead}
              disabled={deleting}
              className="mt-3 w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/20 disabled:opacity-70"
            >
              {deleting ? "Suppression..." : "Supprimer le prospect"}
            </button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <h2 className="text-sm font-semibold">Ajouter une interaction</h2>
            <form onSubmit={addInteraction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={newInteraction.type_interaction}
                onChange={(e) =>
                  setNewInteraction((v) => ({ ...v, type_interaction: e.target.value as TypeInteraction }))
                }
                className="rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
              >
                {INTERACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Résultat (ex : Intéressé, Injoignable...)"
                value={newInteraction.resultat}
                onChange={(e) => setNewInteraction((v) => ({ ...v, resultat: e.target.value }))}
                className="rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
              />
              {newInteraction.type_interaction === "rdv" && (
                <input
                  type="datetime-local"
                  value={newInteraction.date_rdv}
                  onChange={(e) => setNewInteraction((v) => ({ ...v, date_rdv: e.target.value }))}
                  className="rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
                />
              )}
              <input
                placeholder="Créé par"
                value={newInteraction.cree_par}
                onChange={(e) => setNewInteraction((v) => ({ ...v, cree_par: e.target.value }))}
                className="rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia"
              />
              <textarea
                placeholder="Commentaire"
                value={newInteraction.commentaire}
                onChange={(e) => setNewInteraction((v) => ({ ...v, commentaire: e.target.value }))}
                rows={2}
                className="rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm outline-none focus:border-fuchsia sm:col-span-2"
              />
              <button
                type="submit"
                disabled={addingInteraction}
                className="rounded-lg bg-fuchsia px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-dark disabled:opacity-70 sm:col-span-2"
              >
                {addingInteraction ? "Ajout..." : "Ajouter l'interaction"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <h2 className="text-sm font-semibold">Historique</h2>
            {interactions.length === 0 && (
              <p className="mt-3 text-sm text-app-text-muted">Aucune interaction enregistrée pour le moment.</p>
            )}
            <ol className="mt-4 space-y-4">
              {interactions.map((interaction) => (
                <li key={interaction.id} className="border-l-2 border-fuchsia/30 pl-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {INTERACTION_TYPES.find((t) => t.value === interaction.type_interaction)?.label}
                    </span>
                    {interaction.resultat && (
                      <span className="rounded-full bg-app-border px-2 py-0.5 text-xs text-app-text-muted">
                        {interaction.resultat}
                      </span>
                    )}
                    <span className="text-xs text-app-text-muted">
                      {new Date(interaction.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  {interaction.commentaire && <p className="mt-1 text-sm">{interaction.commentaire}</p>}
                  {interaction.date_rdv && (
                    <p className="mt-1 text-xs text-app-text-muted">
                      RDV : {new Date(interaction.date_rdv).toLocaleString("fr-FR")}
                    </p>
                  )}
                  {interaction.cree_par && (
                    <p className="mt-1 text-xs text-app-text-muted">Par {interaction.cree_par}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
