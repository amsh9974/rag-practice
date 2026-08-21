import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  target: number;
  consumed: number;
  remaining: number;
}

export function CalorieMeter({ target, consumed, remaining }: Props) {
  const pct = target > 0 ? Math.min(Math.max(consumed / target, 0), 1) : 0;
  const overBudget = remaining < 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TODAY</Text>
      <Text style={styles.targetLine}>{target} kcal target</Text>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: overBudget ? "#E5484D" : "#2F855A" },
          ]}
        />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.value}>{consumed}</Text>
          <Text style={styles.caption}>consumed</Text>
        </View>
        <View>
          <Text style={[styles.value, overBudget && styles.overBudget]}>
            {overBudget ? `${Math.abs(remaining)} over` : remaining}
          </Text>
          <Text style={styles.caption}>{overBudget ? "" : "remaining"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 16, backgroundColor: "#F5F6F8" },
  label: { fontSize: 12, letterSpacing: 1, color: "#6B7280", fontWeight: "600" },
  targetLine: { fontSize: 16, fontWeight: "600", marginTop: 2, marginBottom: 10 },
  track: { height: 14, borderRadius: 7, backgroundColor: "#E5E7EB", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 7 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  value: { fontSize: 28, fontWeight: "700" },
  overBudget: { color: "#E5484D" },
  caption: { fontSize: 12, color: "#6B7280" },
});
