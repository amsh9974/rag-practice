import {
  CORE_SUITE_SKUS,
  E3_EQUIVALENT,
  LICENSE_CATALOG,
  transitiveIncludes,
  type SkuId,
} from "./licenseCatalog";
import type { UserRecord } from "./parseUsageReport";

export type FindingType = "inactive" | "duplicate" | "downgrade";

export interface Finding {
  id: string;
  type: FindingType;
  upn: string;
  displayName: string;
  department: string | null;
  currentSkus: SkuId[];
  recommendedAction: string;
  evidence: string;
  monthlySavingGbp: number;
}

export interface EngineOptions {
  /** A user with no activity for this many days (or ever) is flagged for full reclaim. Default 90. */
  inactivityThresholdDays: number;
  /** Lookback window used for the E5-downgrade proxy signal. Default 60. */
  downgradeLookbackDays: number;
  /** Per-SKU price overrides (GBP/user/month) to replace the catalog list price. */
  priceOverrides: Partial<Record<SkuId, number>>;
  /** Reference "today" for age calculations. Defaults to now; pass explicitly for reproducible reports. */
  asOfDate?: Date;
}

export const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
  inactivityThresholdDays: 90,
  downgradeLookbackDays: 60,
  priceOverrides: {},
};

export interface EngineSummary {
  usersAnalyzed: number;
  usersWithLicenses: number;
  totalMonthlySpendGbp: number;
  totalMonthlySavingsGbp: number;
  totalAnnualSavingsGbp: number;
  countByType: Record<FindingType, number>;
  savingsByType: Record<FindingType, number>;
  unrecognizedProductTokens: string[];
  hasWorkloadDetail: boolean;
}

export interface EngineResult {
  findings: Finding[];
  summary: EngineSummary;
}

function priceOf(sku: SkuId, overrides: Partial<Record<SkuId, number>>): number {
  return overrides[sku] ?? LICENSE_CATALOG[sku].listPriceGbpPerMonth;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDate(d: Date | null): string {
  if (!d) return "never";
  return d.toISOString().slice(0, 10);
}

export function runEngine(users: UserRecord[], opts: Partial<EngineOptions> = {}): EngineResult {
  const options: EngineOptions = { ...DEFAULT_ENGINE_OPTIONS, ...opts };
  const asOf = options.asOfDate ?? new Date();
  const findings: Finding[] = [];
  const unrecognizedSet = new Set<string>();
  let hasWorkloadDetail = false;
  let totalMonthlySpend = 0;
  let usersWithLicenses = 0;

  for (const user of users) {
    for (const token of user.unrecognizedProducts) unrecognizedSet.add(token);
    if (Object.values(user.workloadActivity).length > 0) hasWorkloadDetail = true;

    const licensedSkus = user.assignedSkus.filter((s) => CORE_SUITE_SKUS.includes(s));
    const allAssignedSkus = user.assignedSkus;
    if (allAssignedSkus.length > 0) usersWithLicenses += 1;
    totalMonthlySpend += allAssignedSkus.reduce((sum, s) => sum + priceOf(s, options.priceOverrides), 0);

    if (allAssignedSkus.length === 0) continue;

    // Rule 1: inactive user still holding a paid license -> full reclaim.
    const daysInactive = user.lastActivityDate ? daysBetween(asOf, user.lastActivityDate) : null;
    const isInactive = daysInactive === null || daysInactive >= options.inactivityThresholdDays;
    if (isInactive) {
      const saving = allAssignedSkus.reduce((sum, s) => sum + priceOf(s, options.priceOverrides), 0);
      findings.push({
        id: `${user.upn}-inactive`,
        type: "inactive",
        upn: user.upn,
        displayName: user.displayName,
        department: user.department,
        currentSkus: allAssignedSkus,
        recommendedAction: "Remove all licenses assigned to this user (no recorded activity).",
        evidence:
          user.lastActivityDate === null
            ? `No activity recorded across any tracked workload; ${allAssignedSkus.length} paid SKU(s) assigned.`
            : `Last activity ${fmtDate(user.lastActivityDate)} (${daysInactive} days ago), exceeding the ${options.inactivityThresholdDays}-day threshold.`,
        monthlySavingGbp: round2(saving),
      });
      continue; // Don't double-count duplicate/downgrade savings on a user already fully reclaimed.
    }

    // Rule 2: duplicate / overlapping suite licenses.
    const assignedSet = new Set(allAssignedSkus);
    const redundant = new Set<SkuId>();
    for (const sku of allAssignedSkus) {
      const includes = transitiveIncludes(sku);
      for (const included of includes) {
        if (assignedSet.has(included)) redundant.add(included);
      }
    }
    // Fallback: two core-suite SKUs assigned from different product lines, neither containing the
    // other (e.g. Microsoft 365 E3 + Business Premium on the same user) — redundant.size === 0 here
    // already proves no containment relationship exists among any assigned SKU.
    const coreAssigned = licensedSkus;
    if (redundant.size === 0 && coreAssigned.length > 1) {
      const cheapest = [...coreAssigned].sort(
        (a, b) => priceOf(a, options.priceOverrides) - priceOf(b, options.priceOverrides)
      )[0];
      if (cheapest) redundant.add(cheapest);
    }

    if (redundant.size > 0) {
      const saving = [...redundant].reduce((sum, s) => sum + priceOf(s, options.priceOverrides), 0);
      const keep = allAssignedSkus.filter((s) => !redundant.has(s));
      findings.push({
        id: `${user.upn}-duplicate`,
        type: "duplicate",
        upn: user.upn,
        displayName: user.displayName,
        department: user.department,
        currentSkus: allAssignedSkus,
        recommendedAction: `Remove ${[...redundant].map((s) => LICENSE_CATALOG[s].displayName).join(", ")} — already covered by ${keep
          .map((s) => LICENSE_CATALOG[s].displayName)
          .join(", ")}.`,
        evidence: `User holds ${allAssignedSkus.length} overlapping licenses; functionality of the redundant SKU(s) is already included in another assigned SKU.`,
        monthlySavingGbp: round2(saving),
      });
      continue;
    }

    // Rule 3: E5-tier license with usage confined to core workloads (proxy for over-specification).
    if (hasWorkloadDetailFor(user)) {
      const e5Sku = (["M365_E5", "O365_E5"] as const).find((s) => assignedSet.has(s));
      if (e5Sku) {
        const yammerActive = withinLookback(user.workloadActivity.Yammer ?? null, asOf, options.downgradeLookbackDays);
        const skypeActive = withinLookback(
          user.workloadActivity["Skype For Business"] ?? null,
          asOf,
          options.downgradeLookbackDays
        );
        if (!yammerActive && !skypeActive) {
          const e3Equivalent = E3_EQUIVALENT[e5Sku];
          const saving = priceOf(e5Sku, options.priceOverrides) - priceOf(e3Equivalent, options.priceOverrides);
          if (saving > 0) {
            findings.push({
              id: `${user.upn}-downgrade`,
              type: "downgrade",
              upn: user.upn,
              displayName: user.displayName,
              department: user.department,
              currentSkus: allAssignedSkus,
              recommendedAction: `Downgrade ${LICENSE_CATALOG[e5Sku].displayName} to ${LICENSE_CATALOG[e3Equivalent].displayName}.`,
              evidence: `Activity in the last ${options.downgradeLookbackDays} days is limited to core workloads (Exchange/OneDrive/SharePoint/Teams); no Yammer or Skype for Business usage seen. This is a proxy signal — confirm no Purview, Defender for Office 365, or Power BI Pro dependency before downgrading.`,
              monthlySavingGbp: round2(saving),
            });
          }
        }
      }
    }
  }

  const countByType: Record<FindingType, number> = { inactive: 0, duplicate: 0, downgrade: 0 };
  const savingsByType: Record<FindingType, number> = { inactive: 0, duplicate: 0, downgrade: 0 };
  for (const f of findings) {
    countByType[f.type] += 1;
    savingsByType[f.type] += f.monthlySavingGbp;
  }

  const totalMonthlySavings = findings.reduce((sum, f) => sum + f.monthlySavingGbp, 0);

  return {
    findings: findings.sort((a, b) => b.monthlySavingGbp - a.monthlySavingGbp),
    summary: {
      usersAnalyzed: users.length,
      usersWithLicenses,
      totalMonthlySpendGbp: round2(totalMonthlySpend),
      totalMonthlySavingsGbp: round2(totalMonthlySavings),
      totalAnnualSavingsGbp: round2(totalMonthlySavings * 12),
      countByType,
      savingsByType: {
        inactive: round2(savingsByType.inactive),
        duplicate: round2(savingsByType.duplicate),
        downgrade: round2(savingsByType.downgrade),
      },
      unrecognizedProductTokens: Array.from(unrecognizedSet),
      hasWorkloadDetail,
    },
  };
}

function hasWorkloadDetailFor(user: UserRecord): boolean {
  return Object.keys(user.workloadActivity).length > 0;
}

function withinLookback(date: Date | null, asOf: Date, lookbackDays: number): boolean {
  if (!date) return false;
  return daysBetween(asOf, date) < lookbackDays;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
