/**
 * "Can I eat this?" (section 14) — deterministic core. Looks the food up
 * in the nutrition database, estimates a typical portion, and compares
 * against the user's actual remaining calories for today. The response
 * text is templated here (see CoachScreen for where a real LLM would
 * take these numbers and phrase them more naturally in production —
 * the numbers themselves never come from the LLM).
 */

import { NutritionDatabase } from "../services/nutritionDatabase";
import { calorieRangeFor } from "./nutritionAggregate";

/** A reasonable default single-serving portion when the user gives no size. */
const DEFAULT_PORTION_G = 250;

export interface CanIEatResult {
  found: boolean;
  foodName: string;
  estimatedCalories: number;
  range: { low: number; high: number };
  remainingCalories: number;
  fits: boolean;
  message: string;
}

export function evaluateCanIEat(
  query: string,
  remainingCalories: number,
  nutritionDb: NutritionDatabase
): CanIEatResult {
  const matches = nutritionDb.search(query);
  if (matches.length === 0) {
    return {
      found: false,
      foodName: query,
      estimatedCalories: 0,
      range: { low: 0, high: 0 },
      remainingCalories,
      fits: false,
      message: `I don't have "${query}" in the nutrition database yet. Try scanning a photo of it instead so I can estimate it directly.`,
    };
  }

  const food = matches[0];
  const estimatedCalories = Math.round(food.perGram.calories * DEFAULT_PORTION_G);
  const range = calorieRangeFor(estimatedCalories, "medium");
  const fits = range.high <= remainingCalories;
  const tight = !fits && range.low <= remainingCalories;

  let message: string;
  if (fits) {
    message = `Yes. You have approximately ${remainingCalories} kcal remaining today. A typical portion of ${food.name} is estimated at ${range.low}–${range.high} kcal, so it would fit within your target.`;
  } else if (tight) {
    message = `It's close. You have approximately ${remainingCalories} kcal remaining, and a typical portion of ${food.name} is estimated at ${range.low}–${range.high} kcal. Consider a smaller portion to stay within target.`;
  } else {
    message = `You're already close to today's target — only ${remainingCalories} kcal remaining. A typical portion of ${food.name} is estimated at ${range.low}–${range.high} kcal. Consider a smaller portion or pairing it with something lighter today.`;
  }

  return { found: true, foodName: food.name, estimatedCalories, range, remainingCalories, fits, message };
}
