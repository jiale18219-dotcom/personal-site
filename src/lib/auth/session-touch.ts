const SESSION_TOUCH_INTERVAL_MS = 1000 * 60 * 5;

export function shouldTouchSession(lastSeenAt: Date, now: Date): boolean {
  return now.getTime() - lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS;
}
