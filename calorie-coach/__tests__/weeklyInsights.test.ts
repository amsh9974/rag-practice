import { calculateWeeklyInsights, DaySummary, summarizeDay } from "../src/engine/weeklyInsights";
import { DailyTargets, DiaryEntry } from "../src/types";

const target: DailyTargets = {
  calorieTarget: 2100,
  proteinTargetG: 140,
  carbsTargetG: 220,
  fatTargetG: 70,
  fibreTargetG: 30,
};

function entry(calories: number, proteinG: number, fibreG: number): DiaryEntry {
  return {
    id: `${calories}-${proteinG}`,
    date: "2026-08-21",
    slot: "lunch",
    loggedAt: "2026-08-21T12:00:00Z",
    nutrition: { calories, proteinG, carbsG: 0, fatG: 0, fibreG },
    description: "meal",
    source: "manual",
  };
}

describe("summarizeDay", () => {
  it("aggregates a day's diary entries against its target", () => {
    const summary = summarizeDay("2026-08-21", target, [entry(900, 60, 15), entry(1080, 50, 10)]);
    expect(summary.calories).toBe(1980);
    expect(summary.proteinG).toBe(110);
    expect(summary.fibreG).toBe(25);
    expect(summary.target).toBe(target);
  });
});

describe("calculateWeeklyInsights", () => {
  it("returns zeroed output for no tracked days", () => {
    const insights = calculateWeeklyInsights([]);
    expect(insights.daysTracked).toBe(0);
    expect(insights.highestCalorieDay).toBeNull();
  });

  it("averages calories/protein/fibre and flags days under the protein target", () => {
    const days: DaySummary[] = [
      { date: "d1", target, calories: 1980, proteinG: 110, fibreG: 25 },
      { date: "d2", target, calories: 2200, proteinG: 150, fibreG: 32 },
      { date: "d3", target, calories: 1800, proteinG: 90, fibreG: 20 },
    ];
    const insights = calculateWeeklyInsights(days);
    expect(insights.daysTracked).toBe(3);
    expect(insights.averageCalories).toBe(1993); // round((1980+2200+1800)/3)
    expect(insights.averageProtein).toBe(117); // round((110+150+90)/3)
    expect(insights.daysUnderProteinTarget).toBe(2); // d1 (110<140) and d3 (90<140)
    expect(insights.highestCalorieDay?.date).toBe("d2");
    expect(insights.lowestCalorieDay?.date).toBe("d3");
  });
});
