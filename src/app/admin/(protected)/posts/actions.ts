"use server";

import { redirect } from "next/navigation";

export async function logoutAction() {
  const { destroyAdminSession } = await import("@/lib/auth/session");

  await destroyAdminSession();
  redirect("/admin/login");
}
