import type { AdminUser } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { createSessionToken, hashSessionToken } from "./token";

const ADMIN_SESSION_COOKIE = "personal_site_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type SessionMetadata = { userAgent?: string; ip?: string };

export async function createAdminSession(
  userId: string,
  metadata?: SessionMetadata,
): Promise<void> {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: metadata?.userAgent,
      ip: metadata?.ip,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getOptionalAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  const now = new Date();

  if (session.expiresAt <= now) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: now },
  });

  return session.user;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getOptionalAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getRequestMetadata(): Promise<SessionMetadata> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") ?? undefined;
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || undefined;

  return { userAgent, ip };
}
