import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole = "trader" | "customer" | "admin";
export type SessionUser = { userId: string; email: string; name: string; role: UserRole; businessId: string };
const COOKIE = "rs_session";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to a random secret of at least 32 characters.");
  return new TextEncoder().encode(value);
}
export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string" || typeof payload.businessId !== "string" || !["trader","customer","admin"].includes(String(payload.role))) return null;
    return { userId: payload.userId, email: payload.email, name: payload.name, businessId: payload.businessId, role: payload.role as UserRole };
  } catch { return null; }
}
export async function destroySession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
export async function requireUser(roles?: UserRole[]) {
  const user = await getSession();
  if (!user) return { user: null, response: apiError("Please sign in to continue.", 401) };
  if (roles && !roles.includes(user.role)) return { user: null, response: apiError("You do not have permission to perform this action.", 403) };
  return { user, response: null };
}
