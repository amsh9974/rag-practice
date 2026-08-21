import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { DiaryEntry, MealSlot } from "../types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

export function MealCard({ entry }: { entry: DiaryEntry }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.slot}>{SLOT_LABEL[entry.slot]}</Text>
        <Text style={styles.calories}>{entry.nutrition.calories} kcal</Text>
      </View>
      <Text style={styles.description}>{entry.description}</Text>
      <Text style={styles.macros}>
        P {entry.nutrition.proteinG}g · C {entry.nutrition.carbsG}g · F {entry.nutrition.fatG}g · Fibre{" "}
        {entry.nutrition.fibreG}g
      </Text>
    </View>
  );
}

export function EmptyMealSlot({ slot }: { slot: MealSlot }) {
  return (
    <View style={[styles.card, styles.empty]}>
      <Text style={styles.slot}>{SLOT_LABEL[slot]}</Text>
      <Text style={styles.emptyText}>Not logged yet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 10 },
  empty: { borderStyle: "dashed" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  slot: { fontSize: 14, fontWeight: "700", color: "#111827" },
  calories: { fontSize: 14, fontWeight: "700", color: "#111827" },
  description: { fontSize: 13, color: "#374151", marginTop: 4 },
  macros: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  emptyText: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
});
