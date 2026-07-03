"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const { prisma } = await import("@/lib/db");

  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "账号或密码错误" };
  }

  const { createAdminSession, getRequestMetadata } = await import(
    "@/lib/auth/session"
  );

  await createAdminSession(user.id, await getRequestMetadata());
  redirect("/admin/posts");
}
