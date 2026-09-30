export const USER_ROLES = [
  "Admin",
  "Manager",
  "Sales",
  "Trainer",
  "Finance",
  "Student",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  "users.view",
  "users.manage",
  "profile.view",
  "profile.edit",
  "command_center.view",
  "crm.view",
  "training.view",
  "finance.view",
  "finance.sensitive",
  "actions.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type UserProfile = {
  id: string;
  auth_user_id: string;
  organization_id: string | null;
  display_name: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  Admin: PERMISSIONS,
  Manager: [
    "profile.view",
    "profile.edit",
    "command_center.view",
    "crm.view",
    "training.view",
    "finance.view",
    "actions.view",
  ],
  Sales: ["profile.view", "profile.edit", "crm.view", "actions.view"],
  Trainer: ["profile.view", "profile.edit", "training.view", "actions.view"],
  Finance: [
    "profile.view",
    "profile.edit",
    "finance.view",
    "finance.sensitive",
    "actions.view",
  ],
  Student: ["profile.view", "profile.edit"],
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function hasRole(profile: UserProfile, roles: readonly UserRole[]): boolean {
  return roles.includes(profile.role);
}

export function hasPermission(profile: UserProfile, permission: Permission): boolean {
  return ROLE_PERMISSIONS[profile.role].includes(permission);
}

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
