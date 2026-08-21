/**
 * Shared domain types for the AI Calorie & Nutrition Coach app.
 *
 * Deliberately plain data structures (no class behaviour) so the
 * deterministic engine (src/engine/*) and the pluggable services
 * (src/services/*) can be unit tested without React Native at all.
 */

export type Sex = "female" | "male";

export type ActivityLevel =
  | "sedentary" // little/no exercise
  | "light" // 1-3 days/week
  | "moderate" // 3-5 days/week
  | "active" // 6-7 days/week
  | "very_active"; // physical job or 2x/day training

export type Goal = "lose_weight" | "maintain_weight" | "gain_weight" | "improve_nutrition";

export type DietaryPreference =
  | "none"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "halal"
  | "gluten_free"
  | "dairy_free"
  | "other";

export interface UserProfile {
  id: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** kg per week the user wants to change weight by; 0 for maintain/improve_nutrition. Always a safe, capped value — see engine/calorieTarget.ts. */
  desiredPaceKgPerWeek: number;
  dietaryPreferences: DietaryPreference[];
  allergies: string[];
  mealsPerDay: number;
}

export interface NutritionInfo {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
}

export type ConfidenceLevel = "low" | "medium" | "high";

/** A single food item as identified by AI recognition (photo or barcode), scaled to an estimated portion. */
export interface RecognizedFoodItem {
  name: string;
  estimatedGrams: number;
  cookingMethod?: string;
  perGram: NutritionInfo; // nutrition per 1g, from the nutrition database
}

export interface MealEstimate {
  items: RecognizedFoodItem[];
  totalNutrition: NutritionInfo;
  /** Estimated range reflecting photo-based uncertainty, e.g. { low: 650, high: 800 }. */
  calorieRange: { low: number; high: number };
  confidence: ConfidenceLevel;
  source: "photo" | "barcode" | "manual" | "restaurant";
}

export type MealSlot = "breakfast" | "lunch" | "snack" | "dinner";

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  loggedAt: string; // ISO timestamp
  nutrition: NutritionInfo;
  description: string;
  source: MealEstimate["source"];
}

export interface ExerciseEntry {
  id: string;
  date: string;
  caloriesBurned: number;
  description: string;
}

export interface DailyTargets {
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  fibreTargetG: number;
}

export interface DailyBudget {
  target: DailyTargets;
  consumed: NutritionInfo;
  exerciseCalories: number;
  /** consumed - target, never below a safety floor; see engine/dailyBudget.ts */
  remainingCalories: number;
}

export interface ModificationSuggestion {
  itemName: string;
  action: "remove" | "reduce" | "replace";
  detail: string;
  calorieDelta: number; // negative = calories saved
}

export interface MealModificationResult {
  originalCalories: number;
  remainingBudget: number;
  overBudgetBy: number; // 0 if within budget
  suggestions: ModificationSuggestion[];
  revisedEstimateCalories: number;
  fitsWithinTarget: boolean;
}

export type SubscriptionTier = "free" | "premium" | "pro";
