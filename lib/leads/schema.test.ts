import { describe, expect, it } from "vitest";
import { validateLead } from "./schema";

describe("validateLead", () => {
  it("accepts a valid work email and company size", () => {
    const result = validateLead({
      workEmail: "finance.director@example.co.uk",
      companySize: "201_500",
    });
    expect(result).toEqual({
      success: true,
      data: {
        workEmail: "finance.director@example.co.uk",
        companySize: "201_500",
      },
    });
  });

  it("lowercases and trims the email", () => {
    const result = validateLead({
      workEmail: "  Someone@Example.COM  ",
      companySize: "50_200",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.workEmail).toBe("someone@example.com");
  });

  it("rejects a malformed email", () => {
    const result = validateLead({
      workEmail: "not-an-email",
      companySize: "50_200",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a company size outside the fixed bands", () => {
    const result = validateLead({
      workEmail: "someone@example.com",
      companySize: "5000_plus",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const result = validateLead({ workEmail: "someone@example.com" });
    expect(result.success).toBe(false);
  });
});
