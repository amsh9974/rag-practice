/**
 * Nutrition database service.
 *
 * Per the brief (section 11): "Use a trusted nutrition/food database for
 * nutritional values... combine image recognition + food database + user
 * information + portion information rather than relying purely on an
 * LLM's knowledge." The AI's job is to say *what* food and *how much*;
 * this service is the source of truth for nutrition-per-gram.
 *
 * MockNutritionDatabase ships a small seed dataset so the app runs fully
 * offline for development and testing. A production build swaps this for
 * a real provider (e.g. USDA FoodData Central, Nutritionix, Open Food
 * Facts for barcodes) behind the same NutritionDatabase interface —
 * nothing else in the app needs to change.
 */

import { NutritionInfo } from "../types";

export interface FoodDatabaseEntry {
  id: string;
  name: string;
  /** Nutrition per 1 gram of this food. */
  perGram: NutritionInfo;
}

export interface NutritionDatabase {
  lookup(name: string): FoodDatabaseEntry | undefined;
  lookupByBarcode(barcode: string): FoodDatabaseEntry | undefined;
  search(query: string): FoodDatabaseEntry[];
}

function per100g(calories: number, proteinG: number, carbsG: number, fatG: number, fibreG: number): NutritionInfo {
  return {
    calories: calories / 100,
    proteinG: proteinG / 100,
    carbsG: carbsG / 100,
    fatG: fatG / 100,
    fibreG: fibreG / 100,
  };
}

const SEED_FOODS: FoodDatabaseEntry[] = [
  { id: "chicken_tikka", name: "Chicken Tikka", perGram: per100g(190, 24, 4, 9, 0.5) },
  { id: "white_rice", name: "Rice", perGram: per100g(130, 2.4, 28, 0.3, 0.4) },
  { id: "mixed_vegetables", name: "Mixed vegetables", perGram: per100g(55, 2, 10, 0.5, 3) },
  { id: "creamy_sauce", name: "Creamy sauce", perGram: per100g(240, 2, 6, 23, 0.2) },
  { id: "grilled_chicken_breast", name: "Grilled chicken breast", perGram: per100g(165, 31, 0, 3.6, 0) },
  { id: "salad_greens", name: "Salad greens", perGram: per100g(20, 1.5, 3, 0.2, 1.8) },
  { id: "pizza_slice", name: "Pizza slice", perGram: per100g(266, 11, 33, 10, 2.3) },
  { id: "fried_chicken", name: "Fried chicken", perGram: per100g(320, 19, 11, 22, 0.6) },
  { id: "chips", name: "Chips", perGram: per100g(312, 3.4, 41, 15, 3.8) },
  { id: "fruit_bowl", name: "Fruit bowl", perGram: per100g(52, 0.6, 14, 0.2, 2.4) },
  { id: "greek_yoghurt", name: "Greek yoghurt", perGram: per100g(97, 9, 4, 5, 0) },
  { id: "pasta_bolognese", name: "Pasta Bolognese", perGram: per100g(150, 8, 18, 5, 1.8) },
  { id: "naan_bread", name: "Naan bread", perGram: per100g(310, 9, 50, 8, 2) },
  { id: "dal", name: "Dal", perGram: per100g(116, 7, 18, 2, 5) },
];

export class MockNutritionDatabase implements NutritionDatabase {
  private byId = new Map(SEED_FOODS.map((f) => [f.id, f]));

  lookup(name: string): FoodDatabaseEntry | undefined {
    const lower = name.toLowerCase();
    return SEED_FOODS.find((f) => f.name.toLowerCase() === lower) ?? this.byId.get(lower);
  }

  lookupByBarcode(barcode: string): FoodDatabaseEntry | undefined {
    // V2 feature (section 12) — real implementation calls a barcode/UPC
    // nutrition provider. Mocked here with one demo barcode for the UI.
    if (barcode === "5000000000001") {
      return { id: "demo_cereal_bar", name: "Cereal Bar", perGram: per100g(410, 6, 65, 14, 5) };
    }
    return undefined;
  }

  search(query: string): FoodDatabaseEntry[] {
    const lower = query.toLowerCase();
    return SEED_FOODS.filter((f) => f.name.toLowerCase().includes(lower));
  }
}
