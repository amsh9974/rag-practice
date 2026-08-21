/**
 * Morning planning (section 7): split the day's calorie target into a
 * suggested allocation per meal slot plus a flexibility buffer. Fixed,
 * deterministic percentages — a reasonable default a user can override
 * in the UI, not an AI guess.
 */

export interface MealAllocation {
  breakfast: number;
  lunch: number;
  snack: number;
  dinner: number;
  flexibility: number;
}

const SPLIT = { breakfast: 0.2, lunch: 0.3, snack: 0.1, dinner: 0.35, flexibility: 0.05 } as const;

export function suggestMealAllocation(calorieTarget: number): MealAllocation {
  const breakfast = Math.round(calorieTarget * SPLIT.breakfast);
  const lunch = Math.round(calorieTarget * SPLIT.lunch);
  const snack = Math.round(calorieTarget * SPLIT.snack);
  const dinner = Math.round(calorieTarget * SPLIT.dinner);
  // Flexibility absorbs any rounding remainder so the parts always sum to the target exactly.
  const flexibility = calorieTarget - breakfast - lunch - snack - dinner;

  return { breakfast, lunch, snack, dinner, flexibility };
}
