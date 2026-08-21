/**
 * "How can I eat this meal and stay within my calorie target?" (section 4).
 *
 * Deterministic, rule-based suggestion engine. It never invents a new
 * dish — it only proposes standard, keyword-matched reductions (remove a
 * sauce, cut a portion, swap a fried side) against the items actually in
 * the meal, closing as much of the over-budget gap as it reasonably can.
 * A production build would let an AI phrase these suggestions more
 * naturally, but the *which* and *how much* stay deterministic so the
 * revised estimate is always arithmetically correct.
 */

import { MealModificationResult, ModificationSuggestion, RecognizedFoodItem } from "../types";
import { nutritionForItem } from "./nutritionAggregate";

interface ReductionRule {
  /** Matches if the item name contains any of these (case-insensitive). */
  keywords: string[];
  action: ModificationSuggestion["action"];
  describe: (itemName: string) => string;
  /** Calories saved, as a fraction of that item's own calories (capped) or a flat amount. */
  savingFraction: number;
}

const REDUCTION_RULES: ReductionRule[] = [
  {
    keywords: ["sauce", "dressing", "mayo", "cream"],
    action: "remove",
    describe: (name) => `Remove or ask for ${name} on the side`,
    savingFraction: 1.0,
  },
  {
    keywords: ["fried", "battered", "crispy"],
    action: "replace",
    describe: (name) => `Replace ${name} with a grilled or steamed alternative`,
    savingFraction: 0.4,
  },
  {
    keywords: ["rice", "chips", "fries", "pasta", "bread", "naan"],
    action: "reduce",
    describe: (name) => `Reduce ${name} portion by roughly a third`,
    savingFraction: 0.33,
  },
  {
    keywords: ["cheese", "butter"],
    action: "reduce",
    describe: (name) => `Ask for half the usual amount of ${name}`,
    savingFraction: 0.5,
  },
];

function matchRule(itemName: string): ReductionRule | undefined {
  const lower = itemName.toLowerCase();
  return REDUCTION_RULES.find((rule) => rule.keywords.some((k) => lower.includes(k)));
}

export function suggestMealModification(
  items: RecognizedFoodItem[],
  originalCalories: number,
  remainingBudget: number
): MealModificationResult {
  const overBudgetBy = Math.max(originalCalories - remainingBudget, 0);

  if (overBudgetBy === 0) {
    return {
      originalCalories,
      remainingBudget,
      overBudgetBy: 0,
      suggestions: [],
      revisedEstimateCalories: originalCalories,
      fitsWithinTarget: true,
    };
  }

  const suggestions: ModificationSuggestion[] = [];
  let caloriesSaved = 0;

  // Try each item against the rule table, largest saving first, stopping
  // once the gap is closed so we don't over-suggest changes to a meal.
  const candidates = items
    .map((item) => {
      const rule = matchRule(item.name);
      if (!rule) return null;
      const itemCalories = nutritionForItem(item).calories;
      const delta = -Math.round(itemCalories * rule.savingFraction);
      return { item, rule, delta };
    })
    .filter((c): c is { item: RecognizedFoodItem; rule: ReductionRule; delta: number } => c !== null)
    .sort((a, b) => a.delta - b.delta); // most negative (biggest saving) first

  for (const { item, rule, delta } of candidates) {
    if (caloriesSaved <= -overBudgetBy) break;
    suggestions.push({
      itemName: item.name,
      action: rule.action,
      detail: `${rule.describe(item.name)}: ${delta} kcal`,
      calorieDelta: delta,
    });
    caloriesSaved += delta;
  }

  const revisedEstimateCalories = Math.max(originalCalories + caloriesSaved, 0);

  return {
    originalCalories,
    remainingBudget,
    overBudgetBy,
    suggestions,
    revisedEstimateCalories,
    fitsWithinTarget: revisedEstimateCalories <= remainingBudget,
  };
}
