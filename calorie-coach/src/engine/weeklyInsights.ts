/**
 * Deterministic weekly dashboard aggregation (section 15). Takes each
 * day's diary entries plus that day's target and produces the averages
 * and simple pattern flags the Insights screen renders. No AI involved —
 * only the narrative phrasing layered on top (see CoachScreen) is templated.
 */

import { DailyTargets, DiaryEntry } from "../types";
import { consumedNutritionForDay } from "./dailyBudget";

export interface DaySummary {
  date: string;
  target: DailyTargets;
  calories: number;
  proteinG: number;
  fibreG: number;
}

export interface WeeklyInsights {
  daysTracked: number;
  averageCalories: number;
  averageProtein: number;
  averageFibre: number;
  averageTarget: number;
  daysUnderProteinTarget: number;
  highestCalorieDay: DaySummary | null;
  lowestCalorieDay: DaySummary | null;
}

export function summarizeDay(date: string, target: DailyTargets, entries: DiaryEntry[]): DaySummary {
  const nutrition = consumedNutritionForDay(entries);
  return {
    date,
    target,
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    fibreG: nutrition.fibreG,
  };
}

export function calculateWeeklyInsights(days: DaySummary[]): WeeklyInsights {
  if (days.length === 0) {
    return {
      daysTracked: 0,
      averageCalories: 0,
      averageProtein: 0,
      averageFibre: 0,
      averageTarget: 0,
      daysUnderProteinTarget: 0,
      highestCalorieDay: null,
      lowestCalorieDay: null,
    };
  }

  const sum = (fn: (d: DaySummary) => number) => days.reduce((acc, d) => acc + fn(d), 0);
  const avg = (fn: (d: DaySummary) => number) => Math.round(sum(fn) / days.length);

  const daysUnderProteinTarget = days.filter((d) => d.proteinG < d.target.proteinTargetG).length;

  const highestCalorieDay = days.reduce((a, b) => (b.calories > a.calories ? b : a));
  const lowestCalorieDay = days.reduce((a, b) => (b.calories < a.calories ? b : a));

  return {
    daysTracked: days.length,
    averageCalories: avg((d) => d.calories),
    averageProtein: avg((d) => d.proteinG),
    averageFibre: avg((d) => d.fibreG),
    averageTarget: avg((d) => d.target.calorieTarget),
    daysUnderProteinTarget,
    highestCalorieDay,
    lowestCalorieDay,
  };
}
