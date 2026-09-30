import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

import {
  hasPermission,
  hasRole,
  type Permission,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type AuthContext = {
  user: User;
  profile: UserProfile;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(
      "id, auth_user_id, organization_id, display_name, email, role, is_active, created_at, updated_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !profile || !profile.is_active) {
    return null;
  }

  return { user, profile: profile as UserProfile };
}

export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }
  return context;
}

export async function requireRole(roles: readonly UserRole[]): Promise<AuthContext> {
  const context = await requireAuth();
  if (!hasRole(context.profile, roles)) {
    redirect("/app?error=forbidden");
  }
  return context;
}

export async function requirePermission(permission: Permission): Promise<AuthContext> {
  const context = await requireAuth();
  if (!hasPermission(context.profile, permission)) {
    redirect("/app?error=forbidden");
  }
  return context;
}
