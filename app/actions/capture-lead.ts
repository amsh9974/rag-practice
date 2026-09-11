"use server";

import { validateLead } from "@/lib/leads/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CaptureLeadState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function captureLead(
  _prevState: CaptureLeadState,
  formData: FormData,
): Promise<CaptureLeadState> {
  const validated = validateLead({
    workEmail: formData.get("workEmail"),
    companySize: formData.get("companySize"),
  });

  if (!validated.success) {
    return { status: "error", message: validated.error };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("leads").insert({
    work_email: validated.data.workEmail,
    company_size: validated.data.companySize,
  });

  if (error) {
    // Never log the email itself alongside the failure.
    console.error("lead insert failed", { code: error.code, message: error.message });
    return {
      status: "error",
      message: "Something went wrong on our end - please try again.",
    };
  }

  return { status: "success" };
}
