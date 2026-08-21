import { MockFoodRecognitionService } from "../src/services/foodRecognition";

describe("MockFoodRecognitionService", () => {
  const service = new MockFoodRecognitionService();

  it("returns a meal estimate with items, a range and a confidence level", async () => {
    const estimate = await service.recognize({ photoUri: "photo-1" });
    expect(estimate.items.length).toBeGreaterThan(0);
    expect(estimate.totalNutrition.calories).toBeGreaterThan(0);
    expect(estimate.calorieRange.low).toBeLessThanOrEqual(estimate.totalNutrition.calories);
    expect(estimate.calorieRange.high).toBeGreaterThanOrEqual(estimate.totalNutrition.calories);
    expect(["low", "medium", "high"]).toContain(estimate.confidence);
  });

  it("is deterministic for the same photo identifier", async () => {
    const first = await service.recognize({ photoUri: "same-photo" });
    const second = await service.recognize({ photoUri: "same-photo" });
    expect(first).toEqual(second);
  });

  it("scales portions using the restaurant-mode size hint and tags the source as restaurant", async () => {
    const standard = await service.recognize({ photoUri: "photo-1", portionSizeHint: "standard" });
    const large = await service.recognize({ photoUri: "photo-1", portionSizeHint: "large" });
    expect(large.totalNutrition.calories).toBeGreaterThan(standard.totalNutrition.calories);
    expect(standard.source).toBe("restaurant");
  });
});
