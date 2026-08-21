/**
 * Deterministic macro-nutrient targets, derived from the calorie target.
 * Protein is set per kg bodyweight (goal-dependent), fat as a percentage
 * of total calories, carbs as the remainder, and fibre from a
 * calories-based rule of thumb. All plain arithmetic, no AI.
 */

import { DailyTargets, Goal, UserProfile } from "../types";

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_weight: 1.8, // higher protein helps preserve lean mass in a deficit
  maintain_weight: 1.6,
  gain_weight: 2.0,
  improve_nutrition: 1.6,
};

const FAT_PERCENT_OF_CALORIES = 0.3;

const CALORIES_PER_G = { protein: 4, carbs: 4, fat: 9 };

export function calculateMacroTargets(profile: UserProfile, calorieTarget: number): DailyTargets {
  const proteinTargetG = Math.round(PROTEIN_G_PER_KG[profile.goal] * profile.weightKg);
  const proteinCalories = proteinTargetG * CALORIES_PER_G.protein;

  const fatCalories = calorieTarget * FAT_PERCENT_OF_CALORIES;
  const fatTargetG = Math.round(fatCalories / CALORIES_PER_G.fat);

  const remainingCalories = Math.max(calorieTarget - proteinCalories - fatCalories, 0);
  const carbsTargetG = Math.round(remainingCalories / CALORIES_PER_G.carbs);

  // ~14g fibre per 1000 kcal is a standard population-level guideline, with a sensible floor.
  const fibreTargetG = Math.max(Math.round((calorieTarget / 1000) * 14), 25);

  return {
    calorieTarget,
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    fibreTargetG,
  };
}
