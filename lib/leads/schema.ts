import { z } from "zod";

// Target customer per SPEC.md: UK SMEs and mid-market, 50-2,000 employees.
// The two edge bands are kept so the form doesn't reject a visitor outright
// - they still get captured as a lead, just outside the core ICP.
export const COMPANY_SIZE_BANDS = [
  { id: "under_50", label: "Under 50" },
  { id: "50_200", label: "50–200" },
  { id: "201_500", label: "201–500" },
  { id: "501_1000", label: "501–1,000" },
  { id: "1001_2000", label: "1,001–2,000" },
  { id: "over_2000", label: "Over 2,000" },
] as const;

export type CompanySizeBand = (typeof COMPANY_SIZE_BANDS)[number]["id"];

const companySizeIds = COMPANY_SIZE_BANDS.map((band) => band.id) as [
  CompanySizeBand,
  ...CompanySizeBand[],
];

export const leadSchema = z.object({
  workEmail: z.string().trim().toLowerCase().email(),
  companySize: z.enum(companySizeIds),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type ValidateLeadResult =
  | { success: true; data: LeadInput }
  | { success: false; error: string };

export function validateLead(input: unknown): ValidateLeadResult {
  const result = leadSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: "Enter a valid work email and company size." };
  }
  return { success: true, data: result.data };
}
