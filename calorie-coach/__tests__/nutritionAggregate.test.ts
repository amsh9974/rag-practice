import { buildMealEstimate, calorieRangeFor, nutritionForItem, sumNutrition } from "../src/engine/nutritionAggregate";
import { RecognizedFoodItem } from "../src/types";

function item(grams: number): RecognizedFoodItem {
  return {
    name: "Test Food",
    estimatedGrams: grams,
    perGram: { calories: 2, proteinG: 0.1, carbsG: 0.2, fatG: 0.05, fibreG: 0.03 },
  };
}

describe("nutritionForItem", () => {
  it("scales per-gram nutrition by the estimated portion", () => {
    const result = nutritionForItem(item(100));
    expect(result).toEqual({ calories: 200, proteinG: 10, carbsG: 20, fatG: 5, fibreG: 3 });
  });
});

describe("sumNutrition", () => {
  it("adds multiple nutrition totals together", () => {
    const sum = sumNutrition([nutritionForItem(item(100)), nutritionForItem(item(100))]);
    expect(sum).toEqual({ calories: 400, proteinG: 20, carbsG: 40, fatG: 10, fibreG: 6 });
  });

  it("returns all zeros for an empty list", () => {
    expect(sumNutrition([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 });
  });
});

describe("calorieRangeFor", () => {
  it("widens the range for lower confidence", () => {
    expect(calorieRangeFor(200, "high")).toEqual({ low: 184, high: 216 });
    expect(calorieRangeFor(200, "medium")).toEqual({ low: 170, high: 230 });
    expect(calorieRangeFor(200, "low")).toEqual({ low: 140, high: 260 });
  });

  it("never returns a negative lower bound", () => {
    expect(calorieRangeFor(10, "low").low).toBeGreaterThanOrEqual(0);
  });
});

describe("buildMealEstimate", () => {
  it("combines items into a totalled, ranged, confidence-tagged estimate", () => {
    const estimate = buildMealEstimate([item(100), item(50)], "medium", "photo");
    expect(estimate.totalNutrition.calories).toBe(300); // 200 + 100
    expect(estimate.confidence).toBe("medium");
    expect(estimate.source).toBe("photo");
    expect(estimate.calorieRange).toEqual({ low: 255, high: 345 });
  });
});
