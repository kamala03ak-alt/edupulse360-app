import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();
  return <AppShell profile={profile}>{children}</AppShell>;
}
