export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["ALL"],
  ADMIN: ["CMS", "USERS", "MEDIA", "SETTINGS", "AUDIT", "PROFILE"],
  EDITOR: ["PAGES", "BLOG", "DOCS", "FAQ", "SERVICES", "TESTIMONIALS", "PROFILE"],
  AUTHOR: ["BLOG", "PROFILE"],
  VIEWER: ["PROFILE"],
} as const;

export function passwordMeetsRequirements(password: string) {
  return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { label: "Good", color: "bg-yellow-500" };
  return { label: "Strong", color: "bg-emerald-500" };
}

export function canManageUsers(role: string | null | undefined) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canPublish(role: string | null | undefined) {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR";
}
