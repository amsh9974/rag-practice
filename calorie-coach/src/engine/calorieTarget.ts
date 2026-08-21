/**
 * Deterministic calorie target calculation.
 *
 * Per the product brief (section 21): "Use deterministic calculations for
 * calorie totals and nutrition calculations... Never allow the AI alone to
 * perform critical numerical calculations." Everything here is plain
 * arithmetic — Mifflin-St Jeor BMR, standard activity multipliers, and a
 * capped, safety-floored adjustment for the user's goal — with no AI
 * involvement and no hidden randomness.
 */

import { ActivityLevel, Goal, Sex, UserProfile } from "../types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** 1kg of body fat is approximately 7,700 kcal. */
const KCAL_PER_KG_FAT = 7700;

/** Safe upper bound on requested pace, regardless of what the user enters. */
export const MAX_SAFE_LOSS_KG_PER_WEEK = 1.0;
export const MAX_SAFE_GAIN_KG_PER_WEEK = 0.5;

/** Widely-used minimum safe daily intake floors (NHS/BDA guidance ballpark). */
const MIN_SAFE_CALORIES: Record<Sex, number> = {
  female: 1200,
  male: 1500,
};

export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export interface CalorieTargetResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  /** The pace actually applied, after safety capping. */
  appliedPaceKgPerWeek: number;
  /** True if the requested pace or resulting target was unsafe and had to be capped. */
  wasCapped: boolean;
  /** Non-blocking guidance shown to the user, e.g. suggesting a healthcare professional. */
  warnings: string[];
}

function capPace(goal: Goal, requestedPaceKgPerWeek: number): { pace: number; capped: boolean } {
  const requested = Math.abs(requestedPaceKgPerWeek);
  if (goal === "lose_weight") {
    const capped = Math.min(requested, MAX_SAFE_LOSS_KG_PER_WEEK);
    return { pace: capped, capped: capped !== requested };
  }
  if (goal === "gain_weight") {
    const capped = Math.min(requested, MAX_SAFE_GAIN_KG_PER_WEEK);
    return { pace: capped, capped: capped !== requested };
  }
  return { pace: 0, capped: requestedPaceKgPerWeek !== 0 };
}

export function calculateCalorieTarget(profile: UserProfile): CalorieTargetResult {
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const warnings: string[] = [];
  const { pace, capped } = capPace(profile.goal, profile.desiredPaceKgPerWeek);
  if (capped) {
    warnings.push(
      "Your requested pace was reduced to a safer level. Rapid weight change is not recommended without medical supervision."
    );
  }

  const dailyAdjustment = Math.round((pace * KCAL_PER_KG_FAT) / 7);

  let targetCalories: number;
  if (profile.goal === "lose_weight") {
    targetCalories = tdee - dailyAdjustment;
  } else if (profile.goal === "gain_weight") {
    targetCalories = tdee + dailyAdjustment;
  } else {
    targetCalories = tdee;
  }

  const floor = MIN_SAFE_CALORIES[profile.sex];
  let wasCapped = capped;
  if (targetCalories < floor) {
    targetCalories = floor;
    wasCapped = true;
    warnings.push(
      `Your calculated target was below a generally recognised safe minimum, so it has been set to ${floor} kcal. ` +
        "Please consult a doctor or registered dietitian before pursuing a lower intake."
    );
  }

  return {
    bmr,
    tdee,
    targetCalories,
    appliedPaceKgPerWeek: pace,
    wasCapped,
    warnings,
  };
}
