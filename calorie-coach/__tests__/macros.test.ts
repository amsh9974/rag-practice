import { calculateMacroTargets } from "../src/engine/macros";
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

describe("calculateMacroTargets", () => {
  it("derives protein/fat/carb/fibre targets from the calorie target", () => {
    const targets = calculateMacroTargets(baseProfile(), 1651);
    expect(targets.calorieTarget).toBe(1651);
    expect(targets.proteinTargetG).toBe(126); // 1.8g/kg * 70kg
    expect(targets.fatTargetG).toBe(55);
    expect(targets.carbsTargetG).toBe(163);
    expect(targets.fibreTargetG).toBe(25); // floored at 25
  });

  it("floors fibre at 25g even for a low calorie target", () => {
    const targets = calculateMacroTargets(baseProfile(), 1200);
    expect(targets.fibreTargetG).toBe(25);
  });

  it("scales fibre above the floor for a higher calorie target", () => {
    const targets = calculateMacroTargets(baseProfile(), 3000);
    expect(targets.fibreTargetG).toBe(42); // round(3000/1000*14)
  });

  it("uses a higher protein-per-kg target for weight gain", () => {
    const gain = calculateMacroTargets(baseProfile({ goal: "gain_weight" }), 2500);
    const maintain = calculateMacroTargets(baseProfile({ goal: "maintain_weight" }), 2500);
    expect(gain.proteinTargetG).toBeGreaterThan(maintain.proteinTargetG);
  });
});
