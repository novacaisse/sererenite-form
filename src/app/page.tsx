import { RegistrationForm } from "@/components/form/RegistrationForm";
import { EVENT } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="bg-navy px-4 py-4 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-base font-bold sm:text-lg">{EVENT.name}</h1>
          <p className="mt-0.5 text-xs text-white/70 sm:text-sm">
            {EVENT.dates} — {EVENT.venue}, {EVENT.city}
          </p>
        </div>
      </header>

      <section className="flex-1 px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <RegistrationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
