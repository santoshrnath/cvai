// Tenant resolution. MVP uses a single "default" tenant. Hooked into the
// request so we can flip to real multi-tenancy (NextAuth + workspaces) later
// without touching every call site.

import type { NextRequest } from "next/server";

export function tenantFromRequest(_req: NextRequest): string {
  return "default";
}

export const DEFAULT_TENANT = "default";
