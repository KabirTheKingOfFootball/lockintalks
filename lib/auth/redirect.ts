export type AppRole = "user" | "admin";

export function getRoleRedirect(role: AppRole) {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function getPostAuthRedirect(role: AppRole, nextPath?: string | null) {
  const savedFlow = getSavedFlowRedirect(nextPath);
  return savedFlow || getRoleRedirect(role);
}

export function getSavedFlowRedirect(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) return null;
  if (nextPath.startsWith("/register/") || nextPath.startsWith("/competitions/") || nextPath.startsWith("/payment")) return nextPath;
  return null;
}
