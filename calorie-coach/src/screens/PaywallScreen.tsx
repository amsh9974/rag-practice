import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { RootStackParamList } from "../navigation/types";
import { useApp } from "../state/AppContext";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

const PREMIUM_FEATURES = [
  "Unlimited AI food scans",
  "AI meal modification",
  "Personal AI coach",
  "Historical analysis",
  "Health integrations",
  "Weekly AI reports",
  "Barcode scanning",
  "Restaurant mode",
];

export function PaywallScreen({ navigation }: Props) {
  const { upgradeTier } = useApp();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  async function handleStartTrial() {
    // Mocked entitlement grant for demo purposes — see services/entitlements.ts.
    // Production wires this button to RevenueCat / StoreKit / Play Billing,
    // and only grants entitlement after a verified purchase/trial receipt.
    await upgradeTier("premium");
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Innoligo Premium</Text>
      <Text style={styles.subtitle}>Your AI calorie budget manager — unlocked.</Text>

      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[styles.billingOption, billing === "monthly" && styles.billingOptionSelected]}
          onPress={() => setBilling("monthly")}
        >
          <Text style={[styles.billingLabel, billing === "monthly" && styles.billingLabelSelected]}>
            Monthly · £9.99/mo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.billingOption, billing === "yearly" && styles.billingOptionSelected]}
          onPress={() => setBilling("yearly")}
        >
          <Text style={[styles.billingLabel, billing === "yearly" && styles.billingLabelSelected]}>
            Yearly · £79.99/yr
          </Text>
          <Text style={styles.savingsBadge}>Save 33%</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featureList}>
        {PREMIUM_FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={handleStartTrial}>
        <Text style={styles.ctaButtonText}>Start 7-day free trial</Text>
      </TouchableOpacity>
      <Text style={styles.finePrint}>
        7 days free, then {billing === "monthly" ? "£9.99/month" : "£79.99/year"}. Cancel anytime.
      </Text>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.dismissText}>Not now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 24, paddingBottom: 60, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", color: "#111827", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 6, marginBottom: 24 },
  billingToggle: { flexDirection: "row", width: "100%", marginBottom: 24 },
  billingOption: { flex: 1, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, padding: 14, alignItems: "center", marginHorizontal: 4 },
  billingOptionSelected: { borderColor: "#111827", backgroundColor: "#111827" },
  billingLabel: { fontSize: 13, fontWeight: "700", color: "#111827" },
  billingLabelSelected: { color: "#FFFFFF" },
  savingsBadge: { fontSize: 11, color: "#10B981", fontWeight: "700", marginTop: 4 },
  featureList: { width: "100%", marginBottom: 28 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  checkmark: { color: "#10B981", fontWeight: "800", marginRight: 10 },
  featureText: { fontSize: 14, color: "#374151" },
  ctaButton: { backgroundColor: "#111827", paddingVertical: 18, borderRadius: 14, alignItems: "center", width: "100%" },
  ctaButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  finePrint: { fontSize: 12, color: "#9CA3AF", marginTop: 12, textAlign: "center" },
  dismissText: { fontSize: 14, color: "#6B7280", marginTop: 20 },
});
