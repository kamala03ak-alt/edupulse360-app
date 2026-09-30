import { requireAuth } from "@/lib/auth/server";
import { permissionsForRole } from "@/lib/auth/roles";

export default async function ProfilePage() {
  const { user, profile } = await requireAuth();
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-indigo-600">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile & access</h1>
      <p className="mt-3 text-slate-500">This view is backed by the authenticated Supabase session and the server-side profile record.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Identity</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Display name</dt><dd className="mt-1 font-medium">{profile.display_name || "Not set"}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="mt-1 font-medium">{profile.email || user.email || "Not available"}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-emerald-700">{profile.is_active ? "Active" : "Inactive"}</dd></div></dl></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Access foundation</h2><div className="mt-5"><span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">{profile.role}</span></div><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Current role capabilities</p><ul className="mt-3 space-y-2 text-sm text-slate-600">{permissionsForRole(profile.role).map((permission) => <li key={permission} className="flex items-center gap-2"><span className="text-emerald-600">✓</span>{permission}</li>)}</ul></section>
      </div>
    </div>
  );
}
