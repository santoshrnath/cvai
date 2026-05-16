// Auth context + tenant resolution + super-admin check.
//
// Privacy model:
//   - Anonymous visitor:      reads from the "default" demo pool (read-only;
//                             upload/search/interview-kit endpoints 401)
//   - Authenticated user:     reads + writes scoped to their Clerk user id
//                             (their tenantId == userId)
//   - Super admin (env list): bypasses tenant scoping for READS — sees every
//                             candidate across every tenant. Writes still go
//                             to the admin's own tenant.

import { auth, currentUser } from "@clerk/nextjs/server";

export const DEFAULT_TENANT = "default";

export interface AuthContext {
  userId: string | null;
  email: string | null;
  isSuperAdmin: boolean;
  /** Tenant id to use for writes + as the default read scope. */
  tenantId: string;
  /** True iff this caller can READ across all tenants (admin only). */
  canSeeAllTenants: boolean;
}

function adminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      email: null,
      isSuperAdmin: false,
      tenantId: DEFAULT_TENANT,
      canSeeAllTenants: false,
    };
  }
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const isSuperAdmin =
    !!email && adminEmails().includes(email.toLowerCase());
  return {
    userId,
    email,
    isSuperAdmin,
    tenantId: userId,
    canSeeAllTenants: isSuperAdmin,
  };
}

/**
 * Prisma `where` clause that scopes a query by tenant — UNLESS the caller is
 * a super admin, in which case it returns `{}` (no scoping) so they see all.
 *
 *   const where = { ...tenantWhere(ctx), processingStatus: "READY" };
 */
export function tenantWhere(ctx: AuthContext): { tenantId?: string } {
  if (ctx.canSeeAllTenants) return {};
  return { tenantId: ctx.tenantId };
}

/**
 * Tenant filter for the vector search service. Returns the tenantId to pin,
 * or `undefined` for super admins (search across all tenants).
 */
export function tenantForVectorSearch(ctx: AuthContext): string | undefined {
  if (ctx.canSeeAllTenants) return undefined;
  return ctx.tenantId;
}
