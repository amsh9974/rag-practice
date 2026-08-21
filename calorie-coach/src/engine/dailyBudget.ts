/**
 * Deterministic aggregation of a day's diary + exercise entries into the
 * "calories consumed / remaining" figures that drive the Home dashboard.
 *
 * Per the brief (section 9): consumed and burned calories are tracked
 * separately, and exercise calories are never silently added back to the
 * user's remaining budget — the caller chooses a method explicitly.
 */

import { DailyBudget, DailyTargets, DiaryEntry, ExerciseEntry, NutritionInfo } from "../types";
import { sumNutrition } from "./nutritionAggregate";

export type ExerciseCalorieMethod = "ignore" | "full" | "partial";

/** Used by the "partial" method — a common, less-misleading middle ground. */
const PARTIAL_EXERCISE_CREDIT = 0.5;

export function consumedNutritionForDay(entries: DiaryEntry[]): NutritionInfo {
  return sumNutrition(entries.map((e) => e.nutrition));
}

export function totalExerciseCalories(entries: ExerciseEntry[]): number {
  return entries.reduce((sum, e) => sum + e.caloriesBurned, 0);
}

export function calculateDailyBudget(
  target: DailyTargets,
  diaryEntries: DiaryEntry[],
  exerciseEntries: ExerciseEntry[],
  exerciseMethod: ExerciseCalorieMethod = "ignore"
): DailyBudget {
  const consumed = consumedNutritionForDay(diaryEntries);
  const exerciseCalories = totalExerciseCalories(exerciseEntries);

  let effectiveTarget = target.calorieTarget;
  if (exerciseMethod === "full") {
    effectiveTarget += exerciseCalories;
  } else if (exerciseMethod === "partial") {
    effectiveTarget += Math.round(exerciseCalories * PARTIAL_EXERCISE_CREDIT);
  }

  const remainingCalories = effectiveTarget - consumed.calories;

  return {
    target,
    consumed,
    exerciseCalories,
    remainingCalories,
  };
}
