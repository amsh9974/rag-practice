import { MockEntitlementsService } from "../src/services/entitlements";
import { InMemoryStorage } from "../src/services/storage";

describe("MockEntitlementsService", () => {
  it("defaults to the free tier and gates premium features", async () => {
    const service = new MockEntitlementsService(new InMemoryStorage());
    expect(await service.getTier()).toBe("free");
    expect(await service.hasFeature("ai_coach")).toBe(false);
    expect(await service.hasFeature("unlimited_scans")).toBe(false);
  });

  it("unlocks premium features once upgraded", async () => {
    const service = new MockEntitlementsService(new InMemoryStorage());
    await service.setTier("premium");
    expect(await service.getTier()).toBe("premium");
    expect(await service.hasFeature("ai_coach")).toBe(true);
    expect(await service.hasFeature("meal_modification")).toBe(true);
  });

  it("persists the tier through the injected storage", async () => {
    const storage = new InMemoryStorage();
    const first = new MockEntitlementsService(storage);
    await first.setTier("pro");

    const second = new MockEntitlementsService(storage);
    expect(await second.getTier()).toBe("pro");
  });
});
