import Link from "next/link";

import type { UserProfile } from "@/lib/auth/roles";
import { LogoutButton } from "@/components/logout-button";

const navigation = [
  { href: "/app", label: "Command Center", hint: "Overview" },
  { href: "/app/crm", label: "CRM", hint: "Coming next" },
  { href: "/app/training", label: "Training", hint: "Coming next" },
  { href: "/app/finance", label: "Finance", hint: "Coming next" },
  { href: "/app/actions", label: "Actions", hint: "Coming next" },
];

export function AppShell({ profile, children }: { profile: UserProfile; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:flex lg:min-h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-7">
          <Link href="/app" className="text-lg font-bold tracking-tight text-slate-950">EduPulse <span className="text-indigo-600">360</span></Link>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Foundation</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-4">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="min-w-max rounded-xl px-3 py-3 transition hover:bg-slate-100 lg:flex lg:items-center lg:justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="ml-2 hidden text-[11px] text-slate-400 lg:inline">{item.hint}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-slate-100 p-5 lg:block">
          <Link href="/app/settings/profile" className="block rounded-xl p-3 transition hover:bg-slate-50">
            <p className="truncate text-sm font-semibold">{profile.display_name || profile.email || "Workspace user"}</p>
            <p className="mt-1 text-xs text-slate-500">{profile.role} · Profile</p>
          </Link>
          <div className="mt-2"><LogoutButton /></div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Operations workspace</p><p className="mt-1 text-sm text-slate-500">Secure foundation · Server-enforced access</p></div>
          <div className="flex items-center gap-2 lg:hidden"><span className="hidden text-right text-xs sm:block"><strong className="block text-slate-900">{profile.display_name || profile.email}</strong><span className="text-slate-500">{profile.role}</span></span><LogoutButton /></div>
        </header>
        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
