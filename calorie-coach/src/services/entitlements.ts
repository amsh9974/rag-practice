/**
 * Subscription entitlement gating (section 18).
 *
 * A real build wires this to RevenueCat or platform billing (StoreKit /
 * Google Play Billing) plus a backend that verifies receipts server-side
 * — client-side entitlement state must never be trusted for anything
 * that costs money. MockEntitlementsService keeps that exact interface
 * shape so swapping in a real provider only touches this one file, but
 * stores state locally (via the injected Storage) purely for UI
 * development — it is not a real payment integration and grants
 * "premium" for free.
 */

import { SubscriptionTier } from "../types";
import { Storage } from "./storage";

export const FREE_SCAN_LIMIT_PER_DAY = 3;

export interface EntitlementsService {
  getTier(): Promise<SubscriptionTier>;
  setTier(tier: SubscriptionTier): Promise<void>;
  hasFeature(feature: PremiumFeature): Promise<boolean>;
}

export type PremiumFeature =
  | "unlimited_scans"
  | "meal_modification"
  | "ai_coach"
  | "historical_analysis"
  | "health_integrations"
  | "weekly_reports"
  | "barcode_scanner"
  | "restaurant_mode";

const PREMIUM_FEATURES: ReadonlySet<PremiumFeature> = new Set([
  "unlimited_scans",
  "meal_modification",
  "ai_coach",
  "historical_analysis",
  "health_integrations",
  "weekly_reports",
  "barcode_scanner",
  "restaurant_mode",
]);

const STORAGE_KEY = "entitlements.tier";

export class MockEntitlementsService implements EntitlementsService {
  constructor(private readonly storage: Storage) {}

  async getTier(): Promise<SubscriptionTier> {
    const stored = await this.storage.getItem(STORAGE_KEY);
    return (stored as SubscriptionTier | null) ?? "free";
  }

  async setTier(tier: SubscriptionTier): Promise<void> {
    await this.storage.setItem(STORAGE_KEY, tier);
  }

  async hasFeature(feature: PremiumFeature): Promise<boolean> {
    if (!PREMIUM_FEATURES.has(feature)) return true;
    const tier = await this.getTier();
    return tier === "premium" || tier === "pro";
  }
}
