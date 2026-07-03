import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken } from "../token";

describe("session tokens", () => {
  it("creates unguessable URL-safe tokens", () => {
    const token = createSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it("hashes the same token consistently", () => {
    const token = createSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });
});
