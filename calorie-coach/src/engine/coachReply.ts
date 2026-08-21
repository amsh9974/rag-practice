/**
 * AI Coach (section 16) — deterministic intent matching over the user's
 * actual daily data. Production would route unmatched or nuanced
 * questions to an LLM (with the same DailyBudget numbers passed in as
 * context/tool results, never asked to invent them — see
 * docs/AI_INTEGRATION.md) but the two intents specified in the brief in
 * detail — "can I eat X" and "how many calories do I have left" — get
 * answers that are always numerically correct because they're computed
 * here, not generated.
 */

import { evaluateCanIEat } from "./canIEatThis";
import { NutritionDatabase } from "../services/nutritionDatabase";
import { DailyBudget } from "../types";

export interface CoachContext {
  budget: DailyBudget;
  nutritionDb: NutritionDatabase;
}

const CAN_I_EAT_PATTERN = /can i (?:have|eat) (?:some |a |an )?(.+?)\??$/i;
const CALORIES_LEFT_PATTERN = /(how many (?:calories|kcal).*(left|remaining))|what.?s left|calories remaining/i;
const WHY_OVER_PATTERN = /why (am i|.*) (going )?over/i;

export function generateCoachReply(message: string, ctx: CoachContext): string {
  const trimmed = message.trim();

  const canIEatMatch = trimmed.match(CAN_I_EAT_PATTERN);
  if (canIEatMatch) {
    const result = evaluateCanIEat(canIEatMatch[1], ctx.budget.remainingCalories, ctx.nutritionDb);
    return result.message;
  }

  if (CALORIES_LEFT_PATTERN.test(trimmed)) {
    const { remainingCalories, target, consumed } = ctx.budget;
    if (remainingCalories >= 0) {
      return `You've consumed approximately ${consumed.calories} kcal today. Your target is ${target.calorieTarget} kcal, so you have approximately ${remainingCalories} kcal remaining.`;
    }
    return `You've consumed approximately ${consumed.calories} kcal today, which is ${Math.abs(remainingCalories)} kcal over your ${target.calorieTarget} kcal target.`;
  }

  if (WHY_OVER_PATTERN.test(trimmed)) {
    const { remainingCalories, target, consumed } = ctx.budget;
    if (remainingCalories >= 0) {
      return `You're actually still within target today — ${consumed.calories} of ${target.calorieTarget} kcal consumed, ${remainingCalories} kcal remaining.`;
    }
    return `You've consumed ${consumed.calories} kcal against a ${target.calorieTarget} kcal target, ${Math.abs(remainingCalories)} kcal over. This is often driven by a single higher-calorie meal or snack — check your diary to see which entry contributed most.`;
  }

  return "I can tell you what you've eaten, how many calories you have left, or whether a specific food fits your target — try asking \"how many calories do I have left?\" or \"can I have pizza tonight?\"";
}
