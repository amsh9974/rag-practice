import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { calculateWeeklyInsights, DaySummary, summarizeDay } from "../engine/weeklyInsights";
import { RootStackParamList } from "../navigation/types";
import { useApp } from "../state/AppContext";

function lastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function InsightsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { targets, entriesForDate, services } = useApp();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    services.entitlements.hasFeature("weekly_reports").then(setHasAccess);
  }, [services]);

  const days = useMemo<DaySummary[]>(() => {
    if (!targets) return [];
    return lastNDates(7)
      .map((date) => summarizeDay(date, targets, entriesForDate(date)))
      .filter((d) => d.calories > 0)
      .reverse();
  }, [targets, entriesForDate]);

  const insights = useMemo(() => calculateWeeklyInsights(days), [days]);

  if (hasAccess === null) return <View style={styles.centered} />;

  if (!hasAccess) {
    return (
      <View style={styles.centered}>
        <Text style={styles.lockedTitle}>Weekly insights are a Premium feature</Text>
        <Text style={styles.lockedSubtitle}>
          Unlock weekly trend reports, protein/fibre patterns and your best-performing days.
        </Text>
        <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate("Paywall", { feature: "weekly_reports" })}>
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (insights.daysTracked === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.lockedTitle}>Not enough data yet</Text>
        <Text style={styles.lockedSubtitle}>Log a few days of meals and check back here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>This week</Text>

      <View style={styles.statRow}>
        <Stat label="Avg calories" value={`${insights.averageCalories}`} />
        <Stat label="Avg target" value={`${insights.averageTarget}`} />
      </View>
      <View style={styles.statRow}>
        <Stat label="Avg protein" value={`${insights.averageProtein}g`} />
        <Stat label="Avg fibre" value={`${insights.averageFibre}g`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.summaryLine}>
          Your average intake this week was approximately {insights.averageCalories} kcal compared with your{" "}
          {insights.averageTarget} kcal target.
        </Text>
        {insights.daysUnderProteinTarget > 0 && (
          <Text style={styles.summaryLine}>
            Your protein intake was below target on {insights.daysUnderProteinTarget} of {insights.daysTracked} tracked
            days.
          </Text>
        )}
        {insights.highestCalorieDay && (
          <Text style={styles.summaryLine}>
            Your highest-calorie day was {insights.highestCalorieDay.date} at {insights.highestCalorieDay.calories}{" "}
            kcal.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  statRow: { flexDirection: "row", marginBottom: 12 },
  stat: { flex: 1, backgroundColor: "#F5F6F8", borderRadius: 12, padding: 14, marginRight: 8 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  card: { backgroundColor: "#F5F6F8", borderRadius: 14, padding: 16, marginTop: 8 },
  summaryLine: { fontSize: 14, color: "#374151", marginBottom: 10 },
  lockedTitle: { fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center" },
  lockedSubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 8, marginBottom: 20 },
  upgradeButton: { backgroundColor: "#111827", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  upgradeButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
