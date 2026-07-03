import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../password";

describe("password helpers", () => {
  const password = "correct horse battery staple";

  it("generates hashes with the expected scrypt format", async () => {
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it("verifies the original password", async () => {
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const hash = await hashPassword(password);

    await expect(verifyPassword("wrong horse battery staple", hash)).resolves.toBe(false);
  });

  it("returns false for malformed hashes", async () => {
    const hash = await hashPassword(password);
    const [, salt, key] = hash.split(":");
    const malformedHashes = [
      `argon2:${salt}:${key}`,
      `scrypt:${salt}`,
      `scrypt:${salt.slice(0, -1)}:${key}`,
      `scrypt:${salt.slice(0, -1)}g:${key}`,
      `scrypt:${salt}:${key.slice(0, -1)}`,
      `scrypt:${salt}:${key.slice(0, -1)}g`,
      `${hash}g`,
    ];

    await Promise.all(
      malformedHashes.map(async (malformedHash) => {
        await expect(verifyPassword(password, malformedHash)).resolves.toBe(false);
      }),
    );
  });

  it("does not throw for malformed hashes", async () => {
    const hash = await hashPassword(password);
    const [, salt, key] = hash.split(":");
    const malformedHashes = [
      `argon2:${salt}:${key}`,
      `scrypt:${salt}`,
      `scrypt:${salt.slice(0, -1)}:${key}`,
      `scrypt:${salt.slice(0, -1)}g:${key}`,
      `scrypt:${salt}:${key.slice(0, -1)}`,
      `scrypt:${salt}:${key.slice(0, -1)}g`,
      `${hash}g`,
    ];

    await Promise.all(
      malformedHashes.map(async (malformedHash) => {
        await expect(verifyPassword(password, malformedHash)).resolves.toBeDefined();
      }),
    );
  });
});
