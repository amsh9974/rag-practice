import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Chip } from "../../components/Chip";
import { RootStackParamList } from "../../navigation/types";
import { useApp } from "../../state/AppContext";
import { ActivityLevel, DietaryPreference, Goal, Sex, UserProfile } from "../../types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light (1-3x/wk)" },
  { value: "moderate", label: "Moderate (3-5x/wk)" },
  { value: "active", label: "Active (6-7x/wk)" },
  { value: "very_active", label: "Very active" },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "gain_weight", label: "Gain weight" },
  { value: "improve_nutrition", label: "Improve nutrition" },
];

const DIET_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "none", label: "No preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "halal", label: "Halal" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "dairy_free", label: "Dairy-free" },
  { value: "other", label: "Other" },
];

export function OnboardingScreen({ navigation }: Props) {
  const { saveProfile } = useApp();

  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("75");
  const [sex, setSex] = useState<Sex>("female");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("lose_weight");
  const [paceKgPerWeek, setPaceKgPerWeek] = useState("0.5");
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>(["none"]);
  const [allergiesText, setAllergiesText] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("4");

  function toggleDiet(value: DietaryPreference) {
    setDietaryPreferences((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleContinue() {
    const parsedAge = parseInt(age, 10);
    const parsedHeight = parseFloat(heightCm);
    const parsedWeight = parseFloat(weightKg);
    const parsedMeals = parseInt(mealsPerDay, 10);
    const parsedPace = parseFloat(paceKgPerWeek || "0");

    if (!parsedAge || !parsedHeight || !parsedWeight || !parsedMeals) {
      Alert.alert("Missing information", "Please fill in age, height, weight and meals per day.");
      return;
    }

    const profile: UserProfile = {
      id: `local-${Date.now()}`,
      age: parsedAge,
      sex,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      activityLevel,
      goal,
      desiredPaceKgPerWeek: Number.isFinite(parsedPace) ? Math.abs(parsedPace) : 0,
      dietaryPreferences: dietaryPreferences.length ? dietaryPreferences : ["none"],
      allergies: allergiesText
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      mealsPerDay: parsedMeals,
    };

    await saveProfile(profile);
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Let's set up your plan</Text>
      <Text style={styles.subtitle}>
        This takes about a minute and helps us calculate a calorie budget that's right for you.
      </Text>

      <Section title="Basic information">
        <FieldRow label="Age">
          <TextInput style={styles.input} keyboardType="number-pad" value={age} onChangeText={setAge} />
        </FieldRow>
        <FieldRow label="Height (cm)">
          <TextInput style={styles.input} keyboardType="decimal-pad" value={heightCm} onChangeText={setHeightCm} />
        </FieldRow>
        <FieldRow label="Weight (kg)">
          <TextInput style={styles.input} keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
        </FieldRow>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.chipRow}>
          <Chip label="Female" selected={sex === "female"} onPress={() => setSex("female")} />
          <Chip label="Male" selected={sex === "male"} onPress={() => setSex("male")} />
        </View>
        <Text style={styles.label}>Activity level</Text>
        <View style={styles.chipRow}>
          {ACTIVITY_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={activityLevel === opt.value}
              onPress={() => setActivityLevel(opt.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="Goal">
        <View style={styles.chipRow}>
          {GOAL_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={goal === opt.value} onPress={() => setGoal(opt.value)} />
          ))}
        </View>
        {(goal === "lose_weight" || goal === "gain_weight") && (
          <FieldRow label="Desired pace (kg/week)">
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={paceKgPerWeek}
              onChangeText={setPaceKgPerWeek}
            />
          </FieldRow>
        )}
        <Text style={styles.hint}>
          We cap this at a safe rate automatically — rapid weight change isn't recommended without medical
          supervision.
        </Text>
      </Section>

      <Section title="Dietary preferences">
        <View style={styles.chipRow}>
          {DIET_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={dietaryPreferences.includes(opt.value)}
              onPress={() => toggleDiet(opt.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="Allergies & intolerances">
        <TextInput
          style={[styles.input, styles.fullWidth]}
          placeholder="e.g. peanuts, shellfish (comma separated)"
          value={allergiesText}
          onChangeText={setAllergiesText}
        />
      </Section>

      <Section title="Lifestyle">
        <FieldRow label="Meals per day">
          <TextInput style={styles.input} keyboardType="number-pad" value={mealsPerDay} onChangeText={setMealsPerDay} />
        </FieldRow>
      </Section>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Calculate my calorie budget</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 6, marginBottom: 20 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },
  fieldRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  fieldLabel: { fontSize: 14, color: "#374151" },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    textAlign: "right",
  },
  fullWidth: { textAlign: "left", width: "100%" },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  hint: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  button: { backgroundColor: "#111827", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
