import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./auth-password";

describe("auth-password", () => {
  it("verifies a freshly hashed password", () => {
    const stored = hashPassword("CorrectHorseBatteryStaple!9");
    expect(verifyPassword("CorrectHorseBatteryStaple!9", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("rejects empty or malformed stored strings", () => {
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", "bcrypt$")).toBe(false);
  });
});
