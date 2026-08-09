import { NextResponse } from "next/server";
import { requireModuleFeature } from "@/services/billing/module-guard";
import { getModuleFeature } from "@/services/modules/module-config";

const MODULES = [
  "crm", "analytics", "reminders", "followups", "marketing", "segments", "loyalty",
  "reports", "team", "notifications", "locations", "global", "permissions", "commissions",
  "inventory", "pos", "enterpriseReports",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("module");

  if (requested) {
    if (!MODULES.includes(requested as (typeof MODULES)[number])) {
      return NextResponse.json({ error: "MODULE_NOT_FOUND" }, { status: 404 });
    }

    const feature = getModuleFeature(requested);
    if (!feature) return NextResponse.json({ error: "MODULE_NOT_FOUND" }, { status: 404 });

    const access = await requireModuleFeature(feature);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error ?? "UNAUTHORIZED", feature, plan: "plan" in access ? access.plan : undefined },
        { status: access.status ?? 401 },
      );
    }

    return NextResponse.json({ module: requested, feature, enabled: true, plan: access.plan });
  }

  const result: Record<string, boolean> = {};
  let plan: string | null = null;

  for (const moduleName of MODULES) {
    const feature = getModuleFeature(moduleName);
    if (!feature) continue;
    const access = await requireModuleFeature(feature);
    result[moduleName] = access.ok;
    if (access.ok) plan = access.plan;
    else if ("plan" in access && access.plan) plan = access.plan;
  }

  return NextResponse.json({ plan, modules: result });
}
