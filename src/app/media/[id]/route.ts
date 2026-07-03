import { readFile } from "node:fs/promises";
import path from "node:path";

import { PostVisibility } from "@prisma/client";

import { getMediaCacheControl } from "./helpers";

export const runtime = "nodejs";

type MediaRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: MediaRouteContext) {
  const { prisma } = await import("@/lib/db");
  const { id } = await context.params;
  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset) {
    return new Response(null, { status: 404 });
  }

  if (asset.visibility === PostVisibility.PRIVATE) {
    const { getOptionalAdminUser } = await import("@/lib/auth/session");
    const user = await getOptionalAdminUser();

    if (!user) {
      return new Response(null, { status: 404 });
    }
  }

  try {
    const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
    const file = await readFile(path.join(uploadDir, asset.storageKey));

    return new Response(file, {
      headers: {
        "Cache-Control": getMediaCacheControl(asset.visibility),
        "Content-Type": asset.mimeType,
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return new Response(null, { status: 404 });
    }

    throw error;
  }
}
