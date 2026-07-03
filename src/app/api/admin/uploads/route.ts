import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  createStorageKey,
  getUploadSignatureValidationError,
  getUploadValidationError,
} from "./helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [{ getOptionalAdminUser }, { prisma }] = await Promise.all([
    import("@/lib/auth/session"),
    import("@/lib/db"),
  ]);
  const user = await getOptionalAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const upload = formData.get("file");
  const file = upload instanceof File ? upload : null;
  const validationError = getUploadValidationError(file);

  if (validationError || !file) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const signatureError = getUploadSignatureValidationError(file, bytes);

  if (signatureError) {
    return NextResponse.json({ error: signatureError }, { status: 400 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  const storageKey = createStorageKey(file.name);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storageKey), bytes);

  const asset = await prisma.asset.create({
    data: {
      filename: storageKey,
      storageKey,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    },
  });

  return NextResponse.json({ id: asset.id, url: `/media/${asset.id}` });
}
