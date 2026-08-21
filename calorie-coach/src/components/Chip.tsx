import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  label: { fontSize: 13, color: "#374151", fontWeight: "500" },
  labelSelected: { color: "#FFFFFF" },
});
