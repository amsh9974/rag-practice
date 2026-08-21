/**
 * Central app state: user profile, today's derived targets, the diary and
 * exercise log, and subscription tier. Backed by the Storage abstraction
 * (on-device only for this MVP — see services/storage.ts for the
 * production caveat) so a closed/reopened app remembers the user.
 *
 * Deliberately a single context rather than Redux/Zustand: the state
 * shape is small and the MVP has one screen tree, not multiple
 * independently-updating widgets.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { calculateCalorieTarget } from "../engine/calorieTarget";
import { calculateDailyBudget, ExerciseCalorieMethod } from "../engine/dailyBudget";
import { calculateMacroTargets } from "../engine/macros";
import { AsyncStorageAdapter, Storage } from "../services/storage";
import { EntitlementsService, MockEntitlementsService } from "../services/entitlements";
import { FoodRecognitionService, MockFoodRecognitionService } from "../services/foodRecognition";
import { MockNutritionDatabase, NutritionDatabase } from "../services/nutritionDatabase";
import { DailyBudget, DailyTargets, DiaryEntry, ExerciseEntry, SubscriptionTier, UserProfile } from "../types";

const PROFILE_KEY = "profile.v1";
const DIARY_KEY = "diary.v1";
const EXERCISE_KEY = "exercise.v1";

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AppServices {
  storage: Storage;
  entitlements: EntitlementsService;
  foodRecognition: FoodRecognitionService;
  nutritionDb: NutritionDatabase;
}

interface AppState {
  loading: boolean;
  profile: UserProfile | null;
  targets: DailyTargets | null;
  diaryEntries: DiaryEntry[]; // all dates, most recent first
  exerciseEntries: ExerciseEntry[];
  entitlementTier: SubscriptionTier;
  exerciseCalorieMethod: ExerciseCalorieMethod;
  services: AppServices;
  saveProfile: (profile: UserProfile) => Promise<void>;
  logMeal: (entry: DiaryEntry) => Promise<void>;
  logExercise: (entry: ExerciseEntry) => Promise<void>;
  upgradeTier: (tier: SubscriptionTier) => Promise<void>;
  budgetForDate: (date: string) => DailyBudget | null;
  entriesForDate: (date: string) => DiaryEntry[];
}

const AppContext = createContext<AppState | undefined>(undefined);

function buildServices(): AppServices {
  const storage = new AsyncStorageAdapter();
  const nutritionDb = new MockNutritionDatabase();
  return {
    storage,
    entitlements: new MockEntitlementsService(storage),
    foodRecognition: new MockFoodRecognitionService(nutritionDb),
    nutritionDb,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState<AppServices>(buildServices);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [entitlementTier, setEntitlementTier] = useState<SubscriptionTier>("free");
  const [exerciseCalorieMethod] = useState<ExerciseCalorieMethod>("ignore");

  useEffect(() => {
    (async () => {
      const [storedProfile, storedDiary, storedExercise, tier] = await Promise.all([
        services.storage.getItem(PROFILE_KEY),
        services.storage.getItem(DIARY_KEY),
        services.storage.getItem(EXERCISE_KEY),
        services.entitlements.getTier(),
      ]);
      if (storedProfile) setProfile(JSON.parse(storedProfile));
      if (storedDiary) setDiaryEntries(JSON.parse(storedDiary));
      if (storedExercise) setExerciseEntries(JSON.parse(storedExercise));
      setEntitlementTier(tier);
      setLoading(false);
    })();
  }, [services]);

  const targets = useMemo<DailyTargets | null>(() => {
    if (!profile) return null;
    const { targetCalories } = calculateCalorieTarget(profile);
    return calculateMacroTargets(profile, targetCalories);
  }, [profile]);

  const saveProfile = useCallback(
    async (next: UserProfile) => {
      setProfile(next);
      await services.storage.setItem(PROFILE_KEY, JSON.stringify(next));
    },
    [services]
  );

  const logMeal = useCallback(
    async (entry: DiaryEntry) => {
      setDiaryEntries((prev) => {
        const next = [entry, ...prev];
        services.storage.setItem(DIARY_KEY, JSON.stringify(next));
        return next;
      });
    },
    [services]
  );

  const logExercise = useCallback(
    async (entry: ExerciseEntry) => {
      setExerciseEntries((prev) => {
        const next = [entry, ...prev];
        services.storage.setItem(EXERCISE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [services]
  );

  const upgradeTier = useCallback(
    async (tier: SubscriptionTier) => {
      await services.entitlements.setTier(tier);
      setEntitlementTier(tier);
    },
    [services]
  );

  const entriesForDate = useCallback(
    (date: string) => diaryEntries.filter((e) => e.date === date),
    [diaryEntries]
  );

  const budgetForDate = useCallback(
    (date: string): DailyBudget | null => {
      if (!targets) return null;
      const dayDiary = diaryEntries.filter((e) => e.date === date);
      const dayExercise = exerciseEntries.filter((e) => e.date === date);
      return calculateDailyBudget(targets, dayDiary, dayExercise, exerciseCalorieMethod);
    },
    [targets, diaryEntries, exerciseEntries, exerciseCalorieMethod]
  );

  const value: AppState = {
    loading,
    profile,
    targets,
    diaryEntries,
    exerciseEntries,
    entitlementTier,
    exerciseCalorieMethod,
    services,
    saveProfile,
    logMeal,
    logExercise,
    upgradeTier,
    budgetForDate,
    entriesForDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
