import { createClient } from "@/lib/supabase/server";

function startOfDayISO(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfWeekISO(): string {
  const start = new Date(startOfWeekISO());
  start.setUTCDate(start.getUTCDate() + 7);
  return start.toISOString();
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const todayStart = startOfDayISO();
  const weekStart = startOfWeekISO();
  const weekEnd = endOfWeekISO();

  const [
    { count: total },
    { count: totalExposant },
    { count: totalPartenaire },
    { count: totalVisiteur },
    { count: newToday },
    { count: newThisWeek },
    { count: converted },
    { count: rdvThisWeek },
    { count: overdue },
    { count: urgent },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("type_inscription", "exposant"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("type_inscription", "partenaire_officiel"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("type_inscription", "visiteur"),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("statut_pipeline", "converti"),
    supabase
      .from("interactions")
      .select("*", { count: "exact", head: true })
      .eq("type_interaction", "rdv")
      .gte("date_rdv", weekStart)
      .lt("date_rdv", weekEnd),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .lt("prochaine_action_date", new Date().toISOString())
      .not("prochaine_action_date", "is", null)
      .not("statut_pipeline", "in", "(converti,perdu)"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("statut_pipeline", "urgent_a_contacter"),
  ]);

  const totalCount = total ?? 0;
  const conversionRate = totalCount > 0 ? Math.round(((converted ?? 0) / totalCount) * 100) : 0;

  const kpis = [
    {
      label: "Total inscrits",
      value: totalCount,
      sub: `${totalExposant ?? 0} exposants · ${totalPartenaire ?? 0} partenaires · ${totalVisiteur ?? 0} visiteurs`,
    },
    { label: "Nouveaux aujourd'hui", value: newToday ?? 0, sub: `${newThisWeek ?? 0} cette semaine` },
    { label: "Taux de conversion", value: `${conversionRate}%`, sub: `${converted ?? 0} convertis` },
    { label: "RDV cette semaine", value: rdvThisWeek ?? 0, sub: "Rendez-vous programmés" },
    {
      label: "Urgent à contacter",
      value: urgent ?? 0,
      sub: "Non contactés depuis 3h",
      alert: (urgent ?? 0) > 0,
    },
    { label: "Relances en retard", value: overdue ?? 0, sub: "Action requise", alert: (overdue ?? 0) > 0 },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-app-text-muted">Vue d&apos;ensemble de la campagne Sérénité 2026.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border p-4 ${
              kpi.alert ? "border-rose-500/30 bg-rose-500/10" : "border-app-border bg-app-surface"
            }`}
          >
            <p className="text-xs font-medium uppercase text-app-text-muted">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold ${kpi.alert ? "text-rose-500" : ""}`}>{kpi.value}</p>
            <p className="mt-1 text-xs text-app-text-muted">{kpi.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
