import { suggestMealAllocation } from "../src/engine/mealAllocation";

describe("suggestMealAllocation", () => {
  it("splits the target across meal slots and always sums back to the exact target", () => {
    const allocation = suggestMealAllocation(2100);
    expect(allocation).toEqual({ breakfast: 420, lunch: 630, snack: 210, dinner: 735, flexibility: 105 });
    const sum = allocation.breakfast + allocation.lunch + allocation.snack + allocation.dinner + allocation.flexibility;
    expect(sum).toBe(2100);
  });

  it("sums exactly to the target even when rounding would otherwise cause drift", () => {
    for (const target of [1500, 1801, 1999, 2237, 3000]) {
      const allocation = suggestMealAllocation(target);
      const sum = allocation.breakfast + allocation.lunch + allocation.snack + allocation.dinner + allocation.flexibility;
      expect(sum).toBe(target);
    }
  });
});
