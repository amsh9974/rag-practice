import { suggestMealModification } from "../src/engine/mealModification";
import { RecognizedFoodItem } from "../src/types";

function flat(calories: number): RecognizedFoodItem["perGram"] {
  return { calories, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
}

const items: RecognizedFoodItem[] = [
  { name: "Creamy sauce", estimatedGrams: 50, perGram: flat(4.8) }, // 240 kcal
  { name: "Rice", estimatedGrams: 200, perGram: flat(1.3) }, // 260 kcal
  { name: "Fried chicken", estimatedGrams: 150, perGram: flat(2.0) }, // 300 kcal
  { name: "Chicken Tikka", estimatedGrams: 180, perGram: flat(1.9) }, // 342 kcal, no matching rule
];
// total = 1142 kcal

describe("suggestMealModification", () => {
  it("returns no suggestions when the meal already fits the budget", () => {
    const result = suggestMealModification(items, 500, 700);
    expect(result.overBudgetBy).toBe(0);
    expect(result.suggestions).toHaveLength(0);
    expect(result.fitsWithinTarget).toBe(true);
    expect(result.revisedEstimateCalories).toBe(500);
  });

  it("suggests the biggest savings first and closes the gap when possible", () => {
    const result = suggestMealModification(items, 1142, 700);
    expect(result.overBudgetBy).toBe(442);
    expect(result.suggestions.map((s) => s.itemName)).toEqual(["Creamy sauce", "Fried chicken", "Rice"]);
    expect(result.revisedEstimateCalories).toBe(696);
    expect(result.fitsWithinTarget).toBe(true);
  });

  it("does not suggest a change to an item with no matching reduction rule", () => {
    const result = suggestMealModification(items, 1142, 700);
    expect(result.suggestions.some((s) => s.itemName === "Chicken Tikka")).toBe(false);
  });

  it("is honest when suggestions cannot fully close a very large gap", () => {
    const result = suggestMealModification(items, 1142, 200);
    expect(result.overBudgetBy).toBe(942);
    expect(result.revisedEstimateCalories).toBe(696);
    expect(result.fitsWithinTarget).toBe(false);
  });
});
