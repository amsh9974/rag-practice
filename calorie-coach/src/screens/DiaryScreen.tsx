import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { MealCard } from "../components/MealCard";
import { useApp } from "../state/AppContext";
import { DiaryEntry } from "../types";

interface DateGroup {
  date: string;
  entries: DiaryEntry[];
  totalCalories: number;
}

export function DiaryScreen() {
  const { diaryEntries } = useApp();

  const groups = useMemo<DateGroup[]>(() => {
    const byDate = new Map<string, DiaryEntry[]>();
    for (const entry of diaryEntries) {
      const list = byDate.get(entry.date) ?? [];
      list.push(entry);
      byDate.set(entry.date, list);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, entries]) => ({
        date,
        entries,
        totalCalories: entries.reduce((sum, e) => sum + e.nutrition.calories, 0),
      }));
  }, [diaryEntries]);

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No meals logged yet</Text>
        <Text style={styles.emptySubtitle}>Scan your first meal from the Home tab to get started.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={groups}
      keyExtractor={(g) => g.date}
      renderItem={({ item: group }) => (
        <View style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupDate}>{group.date}</Text>
            <Text style={styles.groupTotal}>{group.totalCalories} kcal</Text>
          </View>
          {group.entries.map((entry) => (
            <MealCard key={entry.id} entry={entry} />
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", marginTop: 6, textAlign: "center" },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  groupDate: { fontSize: 14, fontWeight: "700", color: "#111827" },
  groupTotal: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
});
