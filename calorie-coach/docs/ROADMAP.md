# Roadmap

Following the brief's staged build plan (section 23).

## V1 — shipped in this repository

User profile & onboarding · calorie target calculation · camera food
scanning · AI food recognition (mocked) · estimated calories with a
confidence range · portion adjustment · daily calorie dashboard · meal
diary · AI meal modification · daily calorie remaining calculation ·
subscription paywall UI (mocked entitlement).

## V2 — next

- **Barcode scanner** — `NutritionDatabase.lookupByBarcode()` already
  exists as the seam; wire a camera barcode reader (e.g.
  `expo-barcode-scanner`) and a real barcode/UPC nutrition provider.
- **Health integrations** — Apple Health, Google Health Connect, Fitbit,
  Garmin, Samsung Health, Strava. Feed steps/exercise/active calories into
  `ExerciseEntry` records already consumed by `calculateDailyBudget()`;
  let the user choose the `ignore`/`full`/`partial` exercise-calorie
  method already implemented, rather than defaulting silently.
- **Restaurant mode accuracy** — the portion-size hint UI exists in
  `ScanScreen`; connect it to a real restaurant-menu-aware recognition
  path (chain restaurant nutrition databases where available) rather than
  a flat portion multiplier.
- **Weekly analytics** — `weeklyInsights.ts` and the Insights screen's
  premium gate exist; extend the summary with the fuller pattern
  detection from section 15 (meal timing, most calorie-dense meals,
  best-performing days) once enough real usage data exists to validate
  the heuristics.
- **Full AI Coach** — `coachReply.ts` currently answers three intents
  deterministically; route anything else to an LLM with the user's
  `DailyBudget` and recent diary as context (see
  [AI_INTEGRATION.md](AI_INTEGRATION.md)).
- **Weight tracking** — a `WeightEntry` type + trend view, feeding into
  the weekly dashboard.

## V3 — later

Advanced personalised nutrition (learning meal-timing/portion patterns
per section 8) · family/multi-user accounts · deeper wearable
integrations · restaurant/database partnerships · predictive meal
planning · advanced AI insights.

## Safety & privacy (section 17, 22) — required before real users

This MVP is a demonstrable prototype, not a compliant production system.
Before onboarding real users with real health data, production needs:

- A real backend with encryption at rest/in transit, RBAC, audit logging,
  and UK GDPR-compliant data minimisation, consent and deletion flows —
  none of this exists yet; state is on-device only (see
  `src/services/storage.ts`).
- Server-side verified subscription entitlement (see
  [AI_INTEGRATION.md](AI_INTEGRATION.md) §6) — the current mock grants
  premium for free with no purchase.
- The app must keep, not soften, the existing safety language as it
  grows: no medical diagnosis, no eating-disorder detection, and
  `calculateCalorieTarget()`'s safe-pace cap and minimum-calorie floor
  (already implemented) must never be bypassable from the UI.

## Success metrics (section 24)

The product metric that matters more than any other, per the brief:
**does the app help users consistently manage their daily calorie
budget?** Everything else (DAU, scans/user, trial-to-paid conversion,
MRR, retention, AI-suggestion acceptance rate) is instrumentation to
answer that question, not the goal itself. This MVP has no analytics
wired up yet — that's a V2 concern once there are real users to measure.
