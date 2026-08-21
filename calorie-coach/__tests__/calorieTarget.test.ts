import { calculateBMR, calculateCalorieTarget, calculateTDEE } from "../src/engine/calorieTarget";
import { UserProfile } from "../src/types";

function baseProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "u1",
    age: 30,
    sex: "female",
    heightCm: 165,
    weightKg: 70,
    activityLevel: "moderate",
    goal: "lose_weight",
    desiredPaceKgPerWeek: 0.5,
    dietaryPreferences: ["none"],
    allergies: [],
    mealsPerDay: 4,
    ...overrides,
  };
}

describe("calculateBMR / calculateTDEE", () => {
  it("computes Mifflin-St Jeor BMR for a female profile", () => {
    expect(calculateBMR("female", 70, 165, 30)).toBe(1420);
  });

  it("computes Mifflin-St Jeor BMR for a male profile", () => {
    expect(calculateBMR("male", 100, 180, 40)).toBe(1930);
  });

  it("applies the activity multiplier", () => {
    expect(calculateTDEE(1420, "moderate")).toBe(2201);
  });
});

describe("calculateCalorieTarget", () => {
  it("applies a safe deficit for weight loss", () => {
    const result = calculateCalorieTarget(baseProfile());
    expect(result.bmr).toBe(1420);
    expect(result.tdee).toBe(2201);
    expect(result.targetCalories).toBe(1651);
    expect(result.appliedPaceKgPerWeek).toBe(0.5);
    expect(result.wasCapped).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("caps an unsafe pace and floors the target at the minimum safe calories", () => {
    const result = calculateCalorieTarget(
      baseProfile({
        sex: "male",
        age: 40,
        heightCm: 180,
        weightKg: 100,
        activityLevel: "sedentary",
        desiredPaceKgPerWeek: 2.0,
      })
    );
    expect(result.appliedPaceKgPerWeek).toBe(1.0); // capped from 2.0
    expect(result.targetCalories).toBe(1500); // floored, not 1216
    expect(result.wasCapped).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("applies a surplus for weight gain within the safe cap", () => {
    const result = calculateCalorieTarget(
      baseProfile({
        sex: "male",
        age: 25,
        heightCm: 175,
        weightKg: 65,
        activityLevel: "active",
        goal: "gain_weight",
        desiredPaceKgPerWeek: 0.3,
      })
    );
    expect(result.targetCalories).toBe(3131);
    expect(result.wasCapped).toBe(false);
  });

  it("ignores pace for maintain_weight and flags it as capped", () => {
    const result = calculateCalorieTarget(
      baseProfile({ goal: "maintain_weight", desiredPaceKgPerWeek: 0.5 })
    );
    expect(result.appliedPaceKgPerWeek).toBe(0);
    expect(result.targetCalories).toBe(result.tdee);
    expect(result.wasCapped).toBe(true);
  });
});
