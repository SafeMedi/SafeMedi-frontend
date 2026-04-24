import { tutorialStep1Schema } from "@/components/domains/tutorial/schema";

describe("tutorialStep1Schema", () => {
  it("accepts valid step1 inputs", () => {
    const result = tutorialStep1Schema.safeParse({
      height: "170",
      weight: "65",
      bloodType: "AB",
      rhFactor: "positive",
      gender: "female",
    });

    expect(result.success).toBe(true);
  });

  it("accepts decimal strings within valid range", () => {
    const result = tutorialStep1Schema.safeParse({
      height: "170,4",
      weight: "65.7",
      bloodType: "A",
      rhFactor: "negative",
      gender: "male",
    });

    expect(result.success).toBe(true);
  });

  it("rejects out-of-range numeric values", () => {
    const result = tutorialStep1Schema.safeParse({
      height: "49",
      weight: "9",
      bloodType: "B",
      rhFactor: "positive",
      gender: "female",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("height"))).toBe(true);
      expect(result.error.issues.some((issue) => issue.path.includes("weight"))).toBe(true);
    }
  });

  it("rejects empty required fields", () => {
    const result = tutorialStep1Schema.safeParse({
      height: "",
      weight: "",
      bloodType: undefined,
      rhFactor: undefined,
      gender: undefined,
    });

    expect(result.success).toBe(false);
  });
});
