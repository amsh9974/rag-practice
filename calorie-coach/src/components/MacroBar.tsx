import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

export function MacroBar({ label, current, target, unit = "g", color = "#3B82F6" }: Props) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {current}
          {unit} / {target}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 13, color: "#374151", fontWeight: "600" },
  values: { fontSize: 13, color: "#6B7280" },
  track: { height: 8, borderRadius: 4, backgroundColor: "#E5E7EB", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});
