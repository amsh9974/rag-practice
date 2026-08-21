import { calculateDailyBudget } from "../src/engine/dailyBudget";
import { DailyTargets, DiaryEntry, ExerciseEntry, NutritionInfo } from "../src/types";

const target: DailyTargets = {
  calorieTarget: 2000,
  proteinTargetG: 140,
  carbsTargetG: 220,
  fatTargetG: 70,
  fibreTargetG: 30,
};

function nutrition(calories: number): NutritionInfo {
  return { calories, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 };
}

function diaryEntry(id: string, calories: number): DiaryEntry {
  return {
    id,
    date: "2026-08-21",
    slot: "lunch",
    loggedAt: "2026-08-21T12:00:00Z",
    nutrition: nutrition(calories),
    description: "test meal",
    source: "manual",
  };
}

function exerciseEntry(id: string, calories: number): ExerciseEntry {
  return { id, date: "2026-08-21", caloriesBurned: calories, description: "test exercise" };
}

describe("calculateDailyBudget", () => {
  const diary = [diaryEntry("d1", 500), diaryEntry("d2", 700)];
  const exercise = [exerciseEntry("e1", 300)];

  it("ignores exercise calories by default (does not add them back)", () => {
    const budget = calculateDailyBudget(target, diary, exercise, "ignore");
    expect(budget.consumed.calories).toBe(1200);
    expect(budget.exerciseCalories).toBe(300);
    expect(budget.remainingCalories).toBe(800); // 2000 - 1200
  });

  it("adds back the full exercise calories when method is 'full'", () => {
    const budget = calculateDailyBudget(target, diary, exercise, "full");
    expect(budget.remainingCalories).toBe(1100); // (2000+300) - 1200
  });

  it("adds back half the exercise calories when method is 'partial'", () => {
    const budget = calculateDailyBudget(target, diary, exercise, "partial");
    expect(budget.remainingCalories).toBe(950); // (2000+150) - 1200
  });

  it("handles a day with no entries", () => {
    const budget = calculateDailyBudget(target, [], [], "ignore");
    expect(budget.consumed.calories).toBe(0);
    expect(budget.remainingCalories).toBe(2000);
  });
});
