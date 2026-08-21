import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { MealReviewScreen } from "../screens/MealReviewScreen";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { useApp } from "../state/AppContext";
import { MainTabNavigator } from "./MainTabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { loading, profile } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="MealReview" component={MealReviewScreen} options={{ title: "Review meal" }} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: "", presentation: "modal" }} />
    </Stack.Navigator>
  );
}
