import Papa from "papaparse";
import { resolveSkuToken, type SkuId } from "./licenseCatalog";

export const TRACKED_WORKLOADS = [
  "Exchange",
  "OneDrive",
  "SharePoint",
  "Skype For Business",
  "Yammer",
  "Teams",
] as const;

export type TrackedWorkload = (typeof TRACKED_WORKLOADS)[number];

export interface UserRecord {
  upn: string;
  displayName: string;
  department: string | null;
  assignedSkus: SkuId[];
  /** Raw product tokens from the export that weren't recognised against the catalog. */
  unrecognizedProducts: string[];
  /** Most recent activity across every signal available for this user, or null if never active. */
  lastActivityDate: Date | null;
  /** Per-workload last-activity, only populated when parsed from the native M365 usage report. */
  workloadActivity: Partial<Record<TrackedWorkload, Date | null>>;
}

export interface ParseResult {
  users: UserRecord[];
  format: "m365-active-user-detail" | "simplified" | "unknown";
  warnings: string[];
}

export function parseDateCell(raw: string | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

// A handful of real Microsoft product display names (e.g. "Enterprise Mobility + Security")
// contain a literal "+", which collides with "+" used as the multi-SKU separator in the
// "Assigned Products" export column. Protect those known names before splitting, using a
// placeholder token that can't otherwise appear in the source text.
const PLUS_TOKEN = "__PLUS__";
const NAMES_CONTAINING_PLUS = [/enterprise mobility\s*\+\s*security/gi];

function splitProductList(raw: string | undefined): string[] {
  if (!raw) return [];
  let protectedRaw = raw;
  for (const pattern of NAMES_CONTAINING_PLUS) {
    protectedRaw = protectedRaw.replace(pattern, (m) => m.split("+").join(PLUS_TOKEN));
  }
  return protectedRaw
    .split(/[+;,|]/)
    .map((s) => s.trim().split(PLUS_TOKEN).join("+"))
    .filter(Boolean);
}

export function resolveProducts(raw: string | undefined): { skus: SkuId[]; unrecognized: string[] } {
  const tokens = splitProductList(raw);
  const skus = new Set<SkuId>();
  const unrecognized: string[] = [];
  for (const token of tokens) {
    const sku = resolveSkuToken(token);
    if (sku) skus.add(sku);
    else unrecognized.push(token);
  }
  return { skus: Array.from(skus), unrecognized };
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseUsageReportCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const warnings: string[] = [];
  if (parsed.errors?.length) {
    for (const err of parsed.errors.slice(0, 5)) {
      warnings.push(`Row ${err.row ?? "?"}: ${err.message}`);
    }
  }

  const rows = parsed.data ?? [];
  if (rows.length === 0) {
    return { users: [], format: "unknown", warnings: ["No data rows found in the file."] };
  }

  const headers = new Set(Object.keys(rows[0] ?? {}).map(normalizeHeader));
  const isM365Format = headers.has("user principal name") && headers.has("assigned products");
  const isSimplifiedFormat = headers.has("userprincipalname") && headers.has("assignedlicenses");

  if (isM365Format) {
    const users: UserRecord[] = [];
    for (const row of rows) {
      const get = (key: string) => row[Object.keys(row).find((k) => normalizeHeader(k) === key) ?? ""];
      const isDeleted = (get("is deleted") ?? "").trim().toUpperCase() === "TRUE";
      if (isDeleted) continue;

      const upn = (get("user principal name") ?? "").trim();
      if (!upn) continue;

      const workloadActivity: Partial<Record<TrackedWorkload, Date | null>> = {};
      let lastActivityDate: Date | null = null;
      for (const workload of TRACKED_WORKLOADS) {
        const cell = get(`${workload.toLowerCase()} last activity date`);
        const date = parseDateCell(cell);
        workloadActivity[workload] = date;
        if (date && (!lastActivityDate || date > lastActivityDate)) lastActivityDate = date;
      }

      const { skus, unrecognized } = resolveProducts(get("assigned products"));

      users.push({
        upn,
        displayName: (get("display name") ?? upn).trim(),
        department: null,
        assignedSkus: skus,
        unrecognizedProducts: unrecognized,
        lastActivityDate,
        workloadActivity,
      });
    }
    return { users, format: "m365-active-user-detail", warnings };
  }

  if (isSimplifiedFormat) {
    const users: UserRecord[] = [];
    for (const row of rows) {
      const get = (key: string) => row[Object.keys(row).find((k) => normalizeHeader(k) === key) ?? ""];
      const upn = (get("userprincipalname") ?? "").trim();
      if (!upn) continue;

      const { skus, unrecognized } = resolveProducts(get("assignedlicenses"));
      const lastActivityDate = parseDateCell(get("lastactivitydate"));

      users.push({
        upn,
        displayName: (get("displayname") ?? upn).trim(),
        department: (get("department") ?? "").trim() || null,
        assignedSkus: skus,
        unrecognizedProducts: unrecognized,
        lastActivityDate,
        workloadActivity: {},
      });
    }
    return { users, format: "simplified", warnings };
  }

  return {
    users: [],
    format: "unknown",
    warnings: [
      "Unrecognised CSV format. Expected either the Microsoft 365 admin center 'Active users' export " +
        "(columns include 'User Principal Name' and 'Assigned Products'), or the simplified template " +
        "(columns: UserPrincipalName, DisplayName, Department, AssignedLicenses, LastActivityDate).",
    ],
  };
}
