# Innoligo AI Calorie & Nutrition Coach

*Take a photo. Know what you're eating. Know what's left. Make a smarter choice.*

A subscription-based AI calorie and nutrition coach mobile app (Expo /
React Native / TypeScript). Positioned as an **AI calorie budget
manager**, not a calorie database: it tells you what you have left today,
whether a specific meal fits, and how to adjust it if it doesn't — never
a falsely precise single-number calorie count from a photo.

This is the **V1 MVP** per the product brief's staged build plan (section
23): profile + calorie target, camera scanning with AI food recognition,
portion adjustment, the daily dashboard, meal diary, AI meal
modification, and a subscription paywall. Barcode scanning, health
integrations, weekly analytics access-gating and the full AI coach are
scaffolded as premium-gated stubs for V2.

## What's real vs mocked

| Capability | Status |
|---|---|
| Calorie target (BMR/TDEE), macro targets, daily budget, meal modification suggestions, weekly aggregation | **Real** — deterministic TypeScript, unit tested (`src/engine/`) |
| Food recognition from a photo | **Mocked** — `MockFoodRecognitionService` returns one of 3 fixed demo meals (deterministic per photo). Real integration = vision LLM + nutrition DB; see [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) |
| Nutrition database | **Mocked** — ~14 seed foods in `MockNutritionDatabase`. Real integration = USDA/Nutritionix/Open Food Facts |
| AI Coach ("can I eat X", "calories left", "why am I over") | **Real logic, templated text** — answers are numerically correct (computed from your actual data), phrasing is fixed rather than LLM-generated; see [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) |
| Subscription payment | **Mocked** — Paywall screen grants "premium" locally with no real purchase. Real integration = RevenueCat / StoreKit / Play Billing with server-side receipt verification |
| Auth / backend / cross-device sync | **Not implemented** — state is on-device `AsyncStorage` only |
| Barcode scanner, health integrations (Apple Health/Google Health Connect/etc.), restaurant-mode portion accuracy | **V2** per the roadmap — restaurant-mode UI exists (portion size hint), the rest is not built |

## Quickstart

Requires Node 18+.

```bash
cd calorie-coach
npm install

# Run the deterministic engine's test suite (no simulator needed)
npm test

# Typecheck the whole app
npm run typecheck

# Start the Expo dev server (scan the QR code with Expo Go on your phone,
# or press i/a for an iOS/Android simulator if you have one configured)
npm start
```

There is no `.env`/API key required to run the app — every AI-shaped
service has a working mock implementation (see the table above and
[docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) for exactly how to swap
each one for a real provider).

## Project layout

```
calorie-coach/
  App.tsx                    entry point (providers + navigation)
  src/
    types.ts                  shared domain types
    engine/                   deterministic, unit-tested calculations
      calorieTarget.ts          BMR/TDEE + safe, capped goal adjustment
      macros.ts                 protein/carb/fat/fibre targets
      nutritionAggregate.ts     item -> meal nutrition totals + confidence range
      dailyBudget.ts            consumed/remaining, exercise-calorie methods
      mealModification.ts       "how do I fit this in my budget" suggestions
      mealAllocation.ts         morning per-meal calorie plan
      weeklyInsights.ts         weekly averages & pattern flags
      canIEatThis.ts            conversational feature's numeric core
      coachReply.ts             AI Coach intent matching over real data
    services/                  pluggable, mockable integrations
      foodRecognition.ts         AI photo -> food items (mocked)
      nutritionDatabase.ts       food -> nutrition-per-gram (mocked, seeded)
      entitlements.ts            subscription tier gating (mocked)
      storage.ts                 on-device key-value storage
    state/AppContext.tsx        profile/diary/exercise/entitlement state
    navigation/                 React Navigation stack + bottom tabs
    screens/                    Onboarding, Home, Scan, MealReview, Diary, Insights, Coach, Paywall
    components/                 CalorieMeter, MacroBar, MealCard, Chip
  __tests__/                   Jest tests for every engine module
  docs/AI_INTEGRATION.md       exactly where/how each mock becomes real
```

## Design principles carried from the brief

- **Never a false-precision number.** Every AI-derived calorie figure
  ships with a confidence level and a range (section 3), computed by
  `calorieRangeFor()` from the recognition confidence — not a single
  suspiciously exact integer.
- **Consumed vs burned stays separate.** Exercise calories are tracked
  independently and never silently added back to the remaining budget by
  default (section 9) — `calculateDailyBudget()` takes an explicit
  `exerciseCalorieMethod` (`ignore` / `full` / `partial`).
- **Deterministic maths, AI for understanding.** See
  [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md).
- **Safety-capped targets.** `calculateCalorieTarget()` caps requested
  pace and floors the target at a recognised minimum safe intake,
  surfacing a warning rather than silently complying with an unsafe
  request (section 17).
