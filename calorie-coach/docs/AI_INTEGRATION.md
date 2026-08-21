# AI integration seams

Per the brief (section 21): *"Use deterministic calculations for calorie
totals and nutrition calculations. Use AI for image interpretation, food
identification, meal understanding, personalised recommendations,
conversational coaching. Never allow the AI alone to perform critical
numerical calculations."*

This MVP follows that split throughout. Everything under `src/engine/` is
plain, tested TypeScript arithmetic. Everything AI-shaped is isolated
behind an interface with exactly one mock implementation, so swapping in
a real provider touches one file and nothing downstream.

## 1. Food recognition (`src/services/foodRecognition.ts`)

`FoodRecognitionService.recognize({ photoUri, portionSizeHint })` is the
seam. A production implementation:

1. Sends the photo to a vision-capable model (e.g. Claude with image
   input, or a specialised food-recognition API) with a prompt asking it
   to identify food items, cooking method, sauces, and an estimated
   portion in grams.
2. Maps each identified food name to a `NutritionDatabase` entry — the
   vision model names the food; it never states the food's nutrition
   values itself. If a name doesn't match the database, either fall back
   to asking the model for a closest-match category, or prompt the user
   (section 3: *"If the AI is uncertain, ask a simple clarification
   question"*).
3. Sets `confidence` from the model's own uncertainty (or a calibrated
   heuristic — e.g. partially-occluded items, mixed dishes, or dim
   lighting lower confidence) rather than a fixed value.
4. Passes the resulting `RecognizedFoodItem[]` through the existing
   `buildMealEstimate()` — the range widening, totals and everything
   downstream (meal modification, diary, budget) are unchanged.

`MockFoodRecognitionService` returns one of three fixed demo meals,
chosen deterministically from a hash of the photo URI, purely so the app
and its tests run with zero API keys.

## 2. Nutrition database (`src/services/nutritionDatabase.ts`)

`MockNutritionDatabase` ships ~14 seed foods. A production build swaps
this for a real provider (USDA FoodData Central, Nutritionix, Open Food
Facts for barcodes) behind the same `NutritionDatabase` interface. The
`lookupByBarcode` method is the V2 barcode-scanner seam (section 12).

## 3. AI Coach (`src/engine/coachReply.ts`)

`generateCoachReply()` currently pattern-matches three intents from the
brief ("can I eat X", "calories left", "why am I over") and answers them
using the user's real `DailyBudget` — the numbers are always correct
because they come from `engine/dailyBudget.ts`, not the matcher. A
production build routes anything that doesn't match a known intent to an
LLM, given the same `DailyBudget` (and recent diary entries, dietary
preferences, allergies) as structured context/tool results — never asking
the model to invent the numbers itself, only to reason over and phrase
them. This is the same pattern as the rule-based `mealModification.ts`
suggestions: deterministic *what*, AI-phrased *how it's said*.

## 4. Meal modification macro scaling (known MVP simplification)

`MealReviewScreen` applies an accepted set of suggested reductions by
scaling the whole meal's macros proportionally to the accepted calorie
reduction, rather than recomputing macros per removed/reduced item. This
is called out explicitly in the screen's source as a simplification: a
production version would apply each `ModificationSuggestion` to its
specific `RecognizedFoodItem` (e.g. actually remove the sauce item, or
reduce the rice item's grams) and recompute the total from the adjusted
item list via `sumNutrition()` — no engine change required, just more
precise bookkeeping in the screen.

## 5. "Can I eat this?" default portion (known MVP simplification)

`evaluateCanIEat()` assumes a flat 250g portion when the user doesn't
specify a size. A production build would use the food database's typical
serving size per item (already common in real nutrition databases) rather
than one constant across every food.

## 6. Payments / entitlements (`src/services/entitlements.ts`)

`MockEntitlementsService` grants "premium" locally with no real purchase
— it exists only so the Paywall screen and feature-gating UI are
demonstrable. Production wires this to RevenueCat (or platform billing
directly) with server-side receipt verification; client-side entitlement
state must never be trusted for anything that costs money. See
`PaywallScreen.tsx` for the exact call site.

## 7. Storage / backend (`src/services/storage.ts`)

All state in this MVP lives in on-device `AsyncStorage`. There is no
backend, no auth, no sync across devices, and no server-side data
minimisation/retention controls — see the root `calorie-coach/README.md`
"What's real vs mocked" table and section 22 of the brief. Production
needs an actual backend (auth, encrypted storage, RBAC, audit logging)
before this ships to real users with real health data.
