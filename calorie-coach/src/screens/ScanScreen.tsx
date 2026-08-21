import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Chip } from "../components/Chip";
import { RootStackParamList } from "../navigation/types";
import { useApp } from "../state/AppContext";
import { FoodRecognitionInput } from "../services/foodRecognition";

type PortionHint = NonNullable<FoodRecognitionInput["portionSizeHint"]>;

export function ScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { services } = useApp();
  const [analysing, setAnalysing] = useState(false);
  const [restaurantMode, setRestaurantMode] = useState(false);
  const [portionHint, setPortionHint] = useState<PortionHint>("standard");

  async function analysePhoto(photoUri: string) {
    setAnalysing(true);
    try {
      const estimate = await services.foodRecognition.recognize({
        photoUri,
        portionSizeHint: restaurantMode ? portionHint : undefined,
      });
      navigation.navigate("MealReview", { estimate });
    } catch (err) {
      Alert.alert("Couldn't analyse that photo", "Please try again with a clearer shot of your meal.");
    } finally {
      setAnalysing(false);
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Enable camera access to scan your meals.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      await analysePhoto(result.assets[0].uri);
    }
  }

  async function handlePickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo library permission needed", "Enable photo access to select a meal photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      await analysePhoto(result.assets[0].uri);
    }
  }

  if (analysing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.analysingText}>Analysing your meal…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan your meal</Text>
      <Text style={styles.subtitle}>
        Take a photo and we'll estimate the food, portion size and calories — with an honest confidence range,
        not a false promise of perfect accuracy.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
        <Text style={styles.primaryButtonText}>📷 Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={handlePickFromLibrary}>
        <Text style={styles.secondaryButtonText}>Choose from library</Text>
      </TouchableOpacity>

      <View style={styles.restaurantSection}>
        <TouchableOpacity onPress={() => setRestaurantMode((v) => !v)} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Restaurant mode</Text>
          <View style={[styles.toggle, restaurantMode && styles.toggleOn]}>
            <View style={[styles.toggleKnob, restaurantMode && styles.toggleKnobOn]} />
          </View>
        </TouchableOpacity>
        {restaurantMode && (
          <>
            <Text style={styles.hint}>Is this a standard restaurant portion?</Text>
            <View style={styles.chipRow}>
              <Chip label="Small" selected={portionHint === "small"} onPress={() => setPortionHint("small")} />
              <Chip label="Standard" selected={portionHint === "standard"} onPress={() => setPortionHint("standard")} />
              <Chip label="Large" selected={portionHint === "large"} onPress={() => setPortionHint("large")} />
            </View>
            <Text style={styles.warningText}>
              Restaurant estimates carry higher uncertainty than home-cooked meals.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  analysingText: { marginTop: 16, color: "#6B7280" },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 8, marginBottom: 24 },
  primaryButton: { backgroundColor: "#111827", paddingVertical: 18, borderRadius: 14, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  secondaryButton: { paddingVertical: 14, alignItems: "center", marginTop: 10 },
  secondaryButtonText: { color: "#111827", fontWeight: "600", fontSize: 14 },
  restaurantSection: { marginTop: 30, padding: 16, borderRadius: 12, backgroundColor: "#F9FAFB" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: "#D1D5DB", padding: 3 },
  toggleOn: { backgroundColor: "#111827" },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
  toggleKnobOn: { marginLeft: 18 },
  hint: { fontSize: 13, color: "#6B7280", marginTop: 14, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  warningText: { fontSize: 12, color: "#B45309", marginTop: 4 },
});
