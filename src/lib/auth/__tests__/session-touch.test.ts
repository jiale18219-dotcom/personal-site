import { describe, expect, it } from "vitest";

import { shouldTouchSession } from "../session-touch";

describe("session touch throttling", () => {
  it("touches sessions older than five minutes", () => {
    const now = new Date("2026-07-03T12:10:00.000Z");
    const lastSeenAt = new Date("2026-07-03T12:04:59.999Z");

    expect(shouldTouchSession(lastSeenAt, now)).toBe(true);
  });

  it("does not touch recently seen sessions", () => {
    const now = new Date("2026-07-03T12:10:00.000Z");
    const lastSeenAt = new Date("2026-07-03T12:05:00.000Z");

    expect(shouldTouchSession(lastSeenAt, now)).toBe(false);
  });
});
