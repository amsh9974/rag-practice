import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalorieMeter } from "../components/CalorieMeter";
import { MacroBar } from "../components/MacroBar";
import { EmptyMealSlot, MealCard } from "../components/MealCard";
import { suggestMealAllocation } from "../engine/mealAllocation";
import { MainTabParamList } from "../navigation/types";
import { todayKey, useApp } from "../state/AppContext";
import { MealSlot } from "../types";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "snack", "dinner"];

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { targets, budgetForDate, entriesForDate } = useApp();
  const date = todayKey();
  const budget = budgetForDate(date);
  const todayEntries = entriesForDate(date);

  if (!targets || !budget) {
    return (
      <View style={styles.centered}>
        <Text>Loading your plan…</Text>
      </View>
    );
  }

  const allocation = suggestMealAllocation(targets.calorieTarget);
  const loggedSlots = new Set(todayEntries.map((e) => e.slot));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CalorieMeter target={targets.calorieTarget} consumed={budget.consumed.calories} remaining={budget.remainingCalories} />

      <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate("Scan")}>
        <Text style={styles.scanIcon}>📷</Text>
        <Text style={styles.scanText}>SCAN MY MEAL</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Macros</Text>
        <MacroBar label="Protein" current={budget.consumed.proteinG} target={targets.proteinTargetG} color="#3B82F6" />
        <MacroBar label="Carbohydrates" current={budget.consumed.carbsG} target={targets.carbsTargetG} color="#F59E0B" />
        <MacroBar label="Fat" current={budget.consumed.fatG} target={targets.fatTargetG} color="#8B5CF6" />
        <MacroBar label="Fibre" current={budget.consumed.fibreG} target={targets.fibreTargetG} color="#10B981" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meals today</Text>
        {SLOTS.map((slot) => {
          const entry = todayEntries.find((e) => e.slot === slot);
          return entry ? <MealCard key={slot} entry={entry} /> : <EmptyMealSlot key={slot} slot={slot} />;
        })}
      </View>

      {budget.exerciseCalories > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity burn</Text>
          <Text style={styles.exerciseText}>{budget.exerciseCalories} kcal today</Text>
        </View>
      )}

      {loggedSlots.size === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Good morning! Suggested allocation</Text>
          <Text style={styles.planLine}>Breakfast — {allocation.breakfast} kcal</Text>
          <Text style={styles.planLine}>Lunch — {allocation.lunch} kcal</Text>
          <Text style={styles.planLine}>Snack — {allocation.snack} kcal</Text>
          <Text style={styles.planLine}>Dinner — {allocation.dinner} kcal</Text>
          <Text style={styles.planLine}>Flexibility — {allocation.flexibility} kcal</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scanButton: {
    marginTop: 16,
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scanIcon: { fontSize: 32, marginBottom: 6 },
  scanText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16, letterSpacing: 1 },
  card: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F3F4F6" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },
  exerciseText: { fontSize: 14, color: "#374151" },
  planLine: { fontSize: 14, color: "#374151", marginBottom: 4 },
});
