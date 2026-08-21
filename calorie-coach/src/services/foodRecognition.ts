/**
 * AI food recognition service — the seam described in section 11.
 *
 * FoodRecognitionService.recognize() is what a real integration
 * implements: send the photo to a vision-capable model (or a
 * specialised food-recognition API), get back food names + estimated
 * portions + confidence, then hydrate nutrition-per-gram from
 * NutritionDatabase (never from the vision model's own guess at
 * nutrition — see docs/AI_INTEGRATION.md for why).
 *
 * MockFoodRecognitionService lets the whole app run, and its tests pass,
 * with no AI API key configured: it returns one of a few fixed demo
 * meals, chosen deterministically from the photo's identifier so the
 * same "photo" always analyses the same way in development.
 */

import { ConfidenceLevel, MealEstimate, RecognizedFoodItem } from "../types";
import { buildMealEstimate } from "../engine/nutritionAggregate";
import { MockNutritionDatabase, NutritionDatabase } from "./nutritionDatabase";

export interface FoodRecognitionInput {
  /** Local URI or identifier of the captured photo. */
  photoUri: string;
  /** Optional restaurant-mode portion hint from the user (section 13). */
  portionSizeHint?: "small" | "standard" | "large";
}

export interface FoodRecognitionService {
  recognize(input: FoodRecognitionInput): Promise<MealEstimate>;
}

interface DemoMeal {
  confidence: ConfidenceLevel;
  items: { foodId: string; grams: number }[];
}

const DEMO_MEALS: DemoMeal[] = [
  {
    confidence: "medium",
    items: [
      { foodId: "chicken_tikka", grams: 180 },
      { foodId: "white_rice", grams: 200 },
      { foodId: "mixed_vegetables", grams: 120 },
      { foodId: "creamy_sauce", grams: 50 },
    ],
  },
  {
    confidence: "high",
    items: [
      { foodId: "grilled_chicken_breast", grams: 150 },
      { foodId: "salad_greens", grams: 100 },
    ],
  },
  {
    confidence: "low",
    items: [
      { foodId: "pizza_slice", grams: 250 },
      { foodId: "chips", grams: 120 },
    ],
  },
];

function hashToIndex(value: string, modulus: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1_000_000_007;
  }
  return hash % modulus;
}

const PORTION_MULTIPLIER: Record<NonNullable<FoodRecognitionInput["portionSizeHint"]>, number> = {
  small: 0.75,
  standard: 1,
  large: 1.35,
};

export class MockFoodRecognitionService implements FoodRecognitionService {
  constructor(private readonly nutritionDb: NutritionDatabase = new MockNutritionDatabase()) {}

  async recognize(input: FoodRecognitionInput): Promise<MealEstimate> {
    const demo = DEMO_MEALS[hashToIndex(input.photoUri, DEMO_MEALS.length)];
    const multiplier = input.portionSizeHint ? PORTION_MULTIPLIER[input.portionSizeHint] : 1;

    const items: RecognizedFoodItem[] = demo.items.map(({ foodId, grams }) => {
      const entry = this.nutritionDb.lookup(foodId);
      if (!entry) {
        throw new Error(`Mock recognition referenced unknown food id "${foodId}"`);
      }
      return {
        name: entry.name,
        estimatedGrams: Math.round(grams * multiplier),
        perGram: entry.perGram,
      };
    });

    return buildMealEstimate(items, demo.confidence, input.portionSizeHint ? "restaurant" : "photo");
  }
}
