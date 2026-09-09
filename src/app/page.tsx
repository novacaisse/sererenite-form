import Image from "next/image";
import { RegistrationForm } from "@/components/form/RegistrationForm";
import { EVENT } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-navy px-4 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 flex justify-center">
            <Image
              src="/logo-serenite.png"
              alt="Sérénité 2026"
              width={180}
              height={64}
              priority
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-balance text-2xl font-bold sm:text-3xl">{EVENT.name}</h1>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            {EVENT.dates} — {EVENT.venue}, {EVENT.city}
          </p>
        </div>
      </header>

      <section className="flex-1 bg-slate-50 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-navy sm:text-2xl">Inscrivez-vous</h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Réservez votre place en moins de deux minutes.
            </p>
          </div>

          <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <RegistrationForm />
          </div>
        </div>
      </section>
    </main>
  );
}
