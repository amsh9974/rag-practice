import { evaluateCanIEat } from "../src/engine/canIEatThis";
import { MockNutritionDatabase } from "../src/services/nutritionDatabase";

describe("evaluateCanIEat", () => {
  const db = new MockNutritionDatabase();

  it("says yes when the estimated range fits comfortably within the remaining budget", () => {
    // grilled chicken breast: 165 kcal/100g -> ~413 kcal for a 250g portion, medium range widens ~15%
    const result = evaluateCanIEat("grilled chicken breast", 1000, db);
    expect(result.found).toBe(true);
    expect(result.fits).toBe(true);
    expect(result.message).toMatch(/^Yes\./);
  });

  it("warns when the food would exceed the remaining budget", () => {
    const result = evaluateCanIEat("pizza slice", 200, db);
    expect(result.found).toBe(true);
    expect(result.fits).toBe(false);
    expect(result.message).toMatch(/already close to today's target/);
  });

  it("handles a food that isn't in the database", () => {
    const result = evaluateCanIEat("unobtainium pudding", 1000, db);
    expect(result.found).toBe(false);
    expect(result.message).toMatch(/don't have/);
  });
});
