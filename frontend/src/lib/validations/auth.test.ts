import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("authentication form schemas", () => {
  it("accepts a valid login", async () => {
    await expect(
      loginSchema.validate({ email: "racer@example.com", password: "secret" }),
    ).resolves.toMatchObject({ email: "racer@example.com" });
  });

  it("rejects an invalid email", async () => {
    await expect(
      loginSchema.validate({ email: "not-an-email", password: "secret" }),
    ).rejects.toThrow("Please enter a valid email address");
  });

  it("requires matching registration passwords", async () => {
    await expect(
      registerSchema.validate({
        name: "Racer",
        email: "racer@example.com",
        password: "secret1",
        confirmPassword: "secret2",
      }),
    ).rejects.toThrow("Passwords do not match");
  });
});
