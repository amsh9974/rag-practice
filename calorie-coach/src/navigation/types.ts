import { MealEstimate } from "../types";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  MealReview: { estimate: MealEstimate };
  Paywall: { feature?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Diary: undefined;
  Insights: undefined;
  Coach: undefined;
};
