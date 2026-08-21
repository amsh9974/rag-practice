import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Chip } from "../components/Chip";
import { calorieRangeFor, nutritionForItem, sumNutrition } from "../engine/nutritionAggregate";
import { suggestMealModification } from "../engine/mealModification";
import { RootStackParamList } from "../navigation/types";
import { todayKey, useApp } from "../state/AppContext";
import { DiaryEntry, MealSlot, RecognizedFoodItem } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "MealReview">;

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snack", label: "Snack" },
  { value: "dinner", label: "Dinner" },
];

const CONFIDENCE_LABEL: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };

export function MealReviewScreen({ route, navigation }: Props) {
  const { estimate } = route.params;
  const { budgetForDate, logMeal } = useApp();
  const [items, setItems] = useState<RecognizedFoodItem[]>(estimate.items);
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [applyModifications, setApplyModifications] = useState(false);

  const totalNutrition = useMemo(() => sumNutrition(items.map(nutritionForItem)), [items]);
  const calorieRange = useMemo(
    () => calorieRangeFor(totalNutrition.calories, estimate.confidence),
    [totalNutrition.calories, estimate.confidence]
  );

  const today = todayKey();
  const budget = budgetForDate(today);
  const remainingBudget = budget?.remainingCalories ?? totalNutrition.calories;

  const modification = useMemo(
    () => suggestMealModification(items, totalNutrition.calories, remainingBudget),
    [items, totalNutrition.calories, remainingBudget]
  );

  function updateGrams(index: number, gramsText: string) {
    const grams = parseFloat(gramsText);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, estimatedGrams: Number.isFinite(grams) ? grams : 0 } : item))
    );
  }

  const finalCalories = applyModifications ? modification.revisedEstimateCalories : totalNutrition.calories;
  // Modifications are suggested at the meal level (section 4); we don't track which
  // grams were removed from which item, so macros are scaled proportionally to the
  // accepted calorie reduction. This is a documented simplification, not a precise
  // per-item recomputation — see docs/AI_INTEGRATION.md.
  const scale = totalNutrition.calories > 0 ? finalCalories / totalNutrition.calories : 1;
  const finalNutrition = {
    calories: finalCalories,
    proteinG: Math.round(totalNutrition.proteinG * scale * 10) / 10,
    carbsG: Math.round(totalNutrition.carbsG * scale * 10) / 10,
    fatG: Math.round(totalNutrition.fatG * scale * 10) / 10,
    fibreG: Math.round(totalNutrition.fibreG * scale * 10) / 10,
  };

  async function handleAddToDiary() {
    const entry: DiaryEntry = {
      id: `meal-${Date.now()}`,
      date: today,
      slot,
      loggedAt: new Date().toISOString(),
      nutrition: finalNutrition,
      description: items.map((i) => i.name).join(", "),
      source: estimate.source,
    };
    await logMeal(entry);
    navigation.popToTop();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review your meal</Text>

      <View style={styles.estimateCard}>
        <Text style={styles.estimateCalories}>Estimated Calories: {totalNutrition.calories} kcal</Text>
        <Text style={styles.estimateRange}>
          Range: {calorieRange.low}–{calorieRange.high} kcal · Confidence: {CONFIDENCE_LABEL[estimate.confidence]}
        </Text>
        <Text style={styles.estimateDisclaimer}>
          Photo-based estimates carry uncertainty. Adjust portion sizes below to improve accuracy.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Detected items</Text>
      {items.map((item, index) => (
        <View key={`${item.name}-${index}`} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCalories}>{nutritionForItem(item).calories} kcal</Text>
          </View>
          <View style={styles.gramsInputWrap}>
            <TextInput
              style={styles.gramsInput}
              keyboardType="numeric"
              value={String(item.estimatedGrams)}
              onChangeText={(text) => updateGrams(index, text)}
            />
            <Text style={styles.gramsUnit}>g</Text>
          </View>
        </View>
      ))}

      {modification.overBudgetBy > 0 && (
        <View style={styles.modificationCard}>
          <Text style={styles.modificationTitle}>
            Your meal is approximately {modification.overBudgetBy} kcal above your remaining target.
          </Text>
          {modification.suggestions.map((s) => (
            <Text key={s.itemName + s.action} style={styles.suggestionLine}>
              • {s.detail}
            </Text>
          ))}
          <Text style={styles.revisedLine}>Revised meal estimate: ~{modification.revisedEstimateCalories} kcal</Text>
          <TouchableOpacity
            style={[styles.applyButton, applyModifications && styles.applyButtonOn]}
            onPress={() => setApplyModifications((v) => !v)}
          >
            <Text style={[styles.applyButtonText, applyModifications && styles.applyButtonTextOn]}>
              {applyModifications ? "✓ Modifications applied" : "Accept suggested modifications"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Add to</Text>
      <View style={styles.chipRow}>
        {SLOTS.map((s) => (
          <Chip key={s.value} label={s.label} selected={slot === s.value} onPress={() => setSlot(s.value)} />
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddToDiary}>
        <Text style={styles.addButtonText}>Add {finalCalories} kcal to diary</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  estimateCard: { backgroundColor: "#F5F6F8", padding: 16, borderRadius: 14, marginBottom: 20 },
  estimateCalories: { fontSize: 20, fontWeight: "700", color: "#111827" },
  estimateRange: { fontSize: 13, color: "#374151", marginTop: 4 },
  estimateDisclaimer: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10, marginTop: 6 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemCalories: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  gramsInputWrap: { flexDirection: "row", alignItems: "center" },
  gramsInput: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, width: 64, textAlign: "right" },
  gramsUnit: { marginLeft: 6, color: "#6B7280" },
  modificationCard: { backgroundColor: "#FFFBEB", borderRadius: 14, padding: 16, marginTop: 20 },
  modificationTitle: { fontSize: 14, fontWeight: "600", color: "#92400E" },
  suggestionLine: { fontSize: 13, color: "#78350F", marginTop: 8 },
  revisedLine: { fontSize: 14, fontWeight: "700", color: "#92400E", marginTop: 12 },
  applyButton: { marginTop: 12, borderWidth: 1, borderColor: "#92400E", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  applyButtonOn: { backgroundColor: "#92400E" },
  applyButtonText: { color: "#92400E", fontWeight: "600" },
  applyButtonTextOn: { color: "#FFFFFF" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  addButton: { backgroundColor: "#111827", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 20 },
  addButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
