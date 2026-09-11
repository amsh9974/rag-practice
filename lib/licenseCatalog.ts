// Reference catalog of common Microsoft 365 commercial SKUs.
// Prices are indicative UK list prices (GBP/user/month, ex VAT) and are meant
// to be edited by the operator to match the client's actual CSP rate card
// before a report is used for a gain-share invoice.

export type SkuId =
  | "M365_BUSINESS_BASIC"
  | "M365_BUSINESS_STANDARD"
  | "M365_BUSINESS_PREMIUM"
  | "O365_E1"
  | "O365_E3"
  | "O365_E5"
  | "M365_E3"
  | "M365_E5"
  | "M365_F3"
  | "EMS_E3"
  | "EMS_E5";

export interface SkuDefinition {
  id: SkuId;
  displayName: string;
  /** Strings found in Microsoft usage-report "Assigned Products" / license exports that map to this SKU. */
  aliases: string[];
  listPriceGbpPerMonth: number;
  /** SKUs whose functionality is already fully contained in this one (direct edges only; resolved transitively). */
  includes: SkuId[];
}

export const LICENSE_CATALOG: Record<SkuId, SkuDefinition> = {
  M365_BUSINESS_BASIC: {
    id: "M365_BUSINESS_BASIC",
    displayName: "Microsoft 365 Business Basic",
    aliases: ["BUSINESS BASIC", "O365_BUSINESS_ESSENTIALS", "MICROSOFT 365 BUSINESS BASIC"],
    listPriceGbpPerMonth: 4.9,
    includes: [],
  },
  M365_BUSINESS_STANDARD: {
    id: "M365_BUSINESS_STANDARD",
    displayName: "Microsoft 365 Business Standard",
    aliases: ["BUSINESS STANDARD", "O365_BUSINESS_PREMIUM", "MICROSOFT 365 BUSINESS STANDARD"],
    listPriceGbpPerMonth: 10.9,
    includes: ["M365_BUSINESS_BASIC"],
  },
  M365_BUSINESS_PREMIUM: {
    id: "M365_BUSINESS_PREMIUM",
    displayName: "Microsoft 365 Business Premium",
    aliases: ["SPB", "MICROSOFT 365 BUSINESS PREMIUM"],
    listPriceGbpPerMonth: 19.7,
    includes: ["M365_BUSINESS_STANDARD"],
  },
  M365_F3: {
    id: "M365_F3",
    displayName: "Microsoft 365 F3",
    aliases: ["SPE_F1", "M365_F3", "MICROSOFT 365 F3"],
    listPriceGbpPerMonth: 6.6,
    includes: [],
  },
  O365_E1: {
    id: "O365_E1",
    displayName: "Office 365 E1",
    aliases: ["STANDARDPACK", "OFFICE 365 E1"],
    listPriceGbpPerMonth: 7.0,
    includes: [],
  },
  O365_E3: {
    id: "O365_E3",
    displayName: "Office 365 E3",
    aliases: ["ENTERPRISEPACK", "OFFICE 365 E3"],
    listPriceGbpPerMonth: 19.7,
    includes: ["O365_E1"],
  },
  O365_E5: {
    id: "O365_E5",
    displayName: "Office 365 E5",
    aliases: ["ENTERPRISEPREMIUM", "OFFICE 365 E5"],
    listPriceGbpPerMonth: 34.0,
    includes: ["O365_E3"],
  },
  EMS_E3: {
    id: "EMS_E3",
    displayName: "Enterprise Mobility + Security E3",
    aliases: ["EMS", "EMSPREMIUM_NOEMSE5", "ENTERPRISE MOBILITY + SECURITY E3"],
    listPriceGbpPerMonth: 8.3,
    includes: [],
  },
  EMS_E5: {
    id: "EMS_E5",
    displayName: "Enterprise Mobility + Security E5",
    aliases: ["EMSPREMIUM", "ENTERPRISE MOBILITY + SECURITY E5"],
    listPriceGbpPerMonth: 13.2,
    includes: ["EMS_E3"],
  },
  M365_E3: {
    id: "M365_E3",
    displayName: "Microsoft 365 E3",
    aliases: ["SPE_E3", "MICROSOFT 365 E3"],
    listPriceGbpPerMonth: 32.5,
    includes: ["O365_E3", "EMS_E3"],
  },
  M365_E5: {
    id: "M365_E5",
    displayName: "Microsoft 365 E5",
    aliases: ["SPE_E5", "MICROSOFT 365 E5"],
    listPriceGbpPerMonth: 52.5,
    includes: ["M365_E3", "O365_E5", "EMS_E5"],
  },
};

export const CORE_SUITE_SKUS: SkuId[] = [
  "M365_BUSINESS_BASIC",
  "M365_BUSINESS_STANDARD",
  "M365_BUSINESS_PREMIUM",
  "M365_F3",
  "O365_E1",
  "O365_E3",
  "O365_E5",
  "M365_E3",
  "M365_E5",
];

/** SKUs that represent the entry-level "E3-equivalent" tier a downgrade lands on. */
export const E3_EQUIVALENT: Record<"M365_E5" | "O365_E5", SkuId> = {
  M365_E5: "M365_E3",
  O365_E5: "O365_E3",
};

const ALIAS_INDEX: Map<string, SkuId> = (() => {
  const map = new Map<string, SkuId>();
  for (const sku of Object.values(LICENSE_CATALOG)) {
    map.set(sku.id.toUpperCase(), sku.id);
    for (const alias of sku.aliases) {
      map.set(alias.toUpperCase(), sku.id);
    }
  }
  return map;
})();

/** Resolve a free-text product/SKU token (from a CSV export) to a catalog SkuId, if recognised. */
export function resolveSkuToken(token: string): SkuId | null {
  const cleaned = token.trim().toUpperCase();
  if (!cleaned) return null;
  if (ALIAS_INDEX.has(cleaned)) return ALIAS_INDEX.get(cleaned)!;
  // Loose contains-match fallback for messy exports (e.g. "Microsoft 365 E3 (No Teams)").
  for (const [alias, id] of ALIAS_INDEX) {
    if (cleaned.includes(alias)) return id;
  }
  return null;
}

/** All SKUs (transitively) included in the given SKU's functionality. */
export function transitiveIncludes(id: SkuId): Set<SkuId> {
  const result = new Set<SkuId>();
  const stack = [...LICENSE_CATALOG[id].includes];
  while (stack.length) {
    const next = stack.pop()!;
    if (result.has(next)) continue;
    result.add(next);
    stack.push(...LICENSE_CATALOG[next].includes);
  }
  return result;
}
