import { generateCoachReply } from "../src/engine/coachReply";
import { MockNutritionDatabase } from "../src/services/nutritionDatabase";
import { DailyBudget } from "../src/types";

const nutritionDb = new MockNutritionDatabase();

function budget(consumedCalories: number, target: number, remaining: number): DailyBudget {
  return {
    target: { calorieTarget: target, proteinTargetG: 140, carbsTargetG: 220, fatTargetG: 70, fibreTargetG: 30 },
    consumed: { calories: consumedCalories, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 },
    exerciseCalories: 0,
    remainingCalories: remaining,
  };
}

describe("generateCoachReply", () => {
  it("answers 'can I eat X' using the day's actual remaining budget", () => {
    const reply = generateCoachReply("Can I have pizza slice tonight?", {
      budget: budget(1000, 2000, 1000),
      nutritionDb,
    });
    expect(reply).toMatch(/pizza slice/i);
  });

  it("answers how many calories are left", () => {
    const reply = generateCoachReply("How many calories do I have left?", {
      budget: budget(1970, 2100, 130),
      nutritionDb,
    });
    expect(reply).toContain("1970 kcal");
    expect(reply).toContain("130 kcal remaining");
  });

  it("explains being over target", () => {
    const reply = generateCoachReply("Why am I going over my calories?", {
      budget: budget(2400, 2100, -300),
      nutritionDb,
    });
    expect(reply).toContain("300 kcal over");
  });

  it("falls back to a helpful default for unmatched questions", () => {
    const reply = generateCoachReply("blah blah unrelated", { budget: budget(0, 2000, 2000), nutritionDb });
    expect(reply.length).toBeGreaterThan(0);
  });
});
