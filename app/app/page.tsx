import Link from "next/link";

import { requireAuth } from "@/lib/auth/server";

const foundationCards = [
  { title: "Authentication", detail: "Supabase Auth session handling and protected routes are active." },
  { title: "Profiles & roles", detail: "Role-aware profile data is resolved on the server." },
  { title: "Database security", detail: "RLS migration foundation protects profile and audit data." },
];

export default async function AppHomePage() {
  const { profile } = await requireAuth();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-indigo-600">Command Center foundation</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Good to see you, {profile.display_name || "there"}.</h1><p className="mt-3 max-w-2xl text-slate-500">Your workspace is ready for the action-first modules planned in the implementation blueprint.</p></div>
        <Link href="/app/settings/profile" className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">View profile</Link>
      </div>
      <section className="mt-9 grid gap-4 md:grid-cols-3">{foundationCards.map((card) => <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><h2 className="font-semibold">{card.title}</h2></div><p className="mt-3 text-sm leading-6 text-slate-500">{card.detail}</p></article>)}</section>
      <section className="mt-8 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6"><p className="text-sm font-semibold text-indigo-800">Next implementation phase</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Build the operational spine</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">CRM, training, finance, lifecycle, actions, and reporting routes are intentionally placeholders until their domain contracts and permission rules are implemented.</p></section>
    </div>
  );
}
