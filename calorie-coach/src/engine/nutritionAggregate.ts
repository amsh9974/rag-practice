/**
 * Deterministic aggregation of recognized food items into a meal-level
 * nutrition total and an honest calorie range. This is the layer that
 * combines AI recognition output with the nutrition database — the AI
 * only ever identifies *what* and *how much*; this module does the maths.
 */

import { ConfidenceLevel, MealEstimate, NutritionInfo, RecognizedFoodItem } from "../types";

const EMPTY: NutritionInfo = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };

export function nutritionForItem(item: RecognizedFoodItem): NutritionInfo {
  const g = item.estimatedGrams;
  return {
    calories: Math.round(item.perGram.calories * g),
    proteinG: round1(item.perGram.proteinG * g),
    carbsG: round1(item.perGram.carbsG * g),
    fatG: round1(item.perGram.fatG * g),
    fibreG: round1(item.perGram.fibreG * g),
  };
}

export function sumNutrition(items: NutritionInfo[]): NutritionInfo {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      proteinG: round1(acc.proteinG + n.proteinG),
      carbsG: round1(acc.carbsG + n.carbsG),
      fatG: round1(acc.fatG + n.fatG),
      fibreG: round1(acc.fibreG + n.fibreG),
    }),
    { ...EMPTY }
  );
}

/**
 * Photo-based estimation is inherently uncertain. Rather than present a
 * single misleadingly precise number, widen the stated total into a range
 * based on how confident the recognition step was. These percentages are
 * a starting point for tuning once real accuracy data exists — see
 * docs/AI_INTEGRATION.md.
 */
const RANGE_WIDTH_BY_CONFIDENCE: Record<ConfidenceLevel, number> = {
  high: 0.08,
  medium: 0.15,
  low: 0.3,
};

export function calorieRangeFor(totalCalories: number, confidence: ConfidenceLevel): { low: number; high: number } {
  const width = RANGE_WIDTH_BY_CONFIDENCE[confidence];
  return {
    low: Math.max(Math.round(totalCalories * (1 - width)), 0),
    high: Math.round(totalCalories * (1 + width)),
  };
}

export function buildMealEstimate(
  items: RecognizedFoodItem[],
  confidence: ConfidenceLevel,
  source: MealEstimate["source"]
): MealEstimate {
  const totalNutrition = sumNutrition(items.map(nutritionForItem));
  return {
    items,
    totalNutrition,
    calorieRange: calorieRangeFor(totalNutrition.calories, confidence),
    confidence,
    source,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
