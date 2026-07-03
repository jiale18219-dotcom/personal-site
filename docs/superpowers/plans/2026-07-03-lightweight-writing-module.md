# Lightweight Writing Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight single-owner writing module for the personal site with PostgreSQL-backed Markdown posts, simple visibility controls, admin login, editing, image upload, and public reading pages.

**Architecture:** Keep the backend inside the existing Next.js App Router project instead of adopting a full CMS. Store posts in PostgreSQL via Prisma; protect `/admin/*` with a database-backed HttpOnly session; render public content from database queries; use MDXEditor only as a Markdown editor, not as an MDX runtime.

**Tech Stack:** Next.js 15.3.1, React 19.1.0, TypeScript 5.8.3, PostgreSQL, Prisma, Node `crypto`, MDXEditor, react-markdown, remark-gfm, Vitest.

## Global Constraints

- Do not introduce Payload, Directus, Strapi, Keystone, or a full CMS.
- This is a single-owner personal-site admin, not a multi-tenant product.
- Store article body as Markdown text in PostgreSQL.
- Use PostgreSQL, not SQLite, for the target deployment.
- Use database-backed sessions with HttpOnly cookies; do not store auth state in localStorage.
- Public visitors may only list `PUBLISHED + PUBLIC` posts.
- Public detail pages return 404 for draft, archived, and private posts when the visitor is not logged in as admin.
- `UNLISTED` posts are readable by direct slug but excluded from listing and sitemap, and marked `noindex`.
- Uploaded image files live outside the database; PostgreSQL stores metadata and access level.
- Existing static `thinking` content remains untouched in the first implementation.
- Remove `output: "export"` because this feature needs dynamic server routes and PostgreSQL.
- Keep the first version small: no comments, likes, public registration, role system, audit workflow, full-text search, version history, or Yuque sync.

---

## Scope Check

This plan covers one coherent feature: the personal writing module. Auth, posts, Markdown rendering, and uploads are split into sequential tasks because each task produces a usable layer that later tasks depend on.

## File Structure

- Modify `package.json` — add DB, Markdown, editor, seed, and test scripts/dependencies.
- Modify `next.config.ts` — remove static export mode.
- Create `.env.example` — document required deployment variables.
- Create `prisma/schema.prisma` — define `AdminUser`, `AdminSession`, `Post`, `Asset`, and enums.
- Create `prisma/seed.ts` — seed the first admin user from environment variables.
- Create `src/lib/db.ts` — Prisma singleton.
- Create `src/lib/auth/password.ts` — password hashing and verification.
- Create `src/lib/auth/token.ts` — token creation and hashing helpers.
- Create `src/lib/auth/session.ts` — session cookie creation, lookup, deletion, and admin guard.
- Create `src/lib/posts/validation.ts` — form parsing, slug normalization, and status/visibility conversion.
- Create `src/lib/posts/access.ts` — read/index rules for public, unlisted, private, draft, and archived posts.
- Create `src/lib/posts/assets.ts` — extract `/media/:id` references and sync asset visibility with a post.
- Create `src/lib/posts/queries.ts` — public/admin post database query helpers.
- Create `src/components/writing/markdown-content.tsx` — safe Markdown rendering.
- Create `src/components/admin/markdown-editor.tsx` — client-only MDXEditor wrapper.
- Create `src/components/admin/post-form.tsx` — shared admin create/edit form.
- Create `src/app/writing/page.tsx` — public writing list.
- Create `src/app/writing/[slug]/page.tsx` — public/unlisted/private-readable detail page.
- Create `src/app/admin/login/page.tsx` and `src/app/admin/login/actions.ts` — single-owner login.
- Create `src/app/admin/(protected)/layout.tsx` — admin route protection.
- Create `src/app/admin/(protected)/page.tsx` — redirect to posts.
- Create `src/app/admin/(protected)/posts/page.tsx` — admin post list.
- Create `src/app/admin/(protected)/posts/new/page.tsx` — new post page.
- Create `src/app/admin/(protected)/posts/[id]/page.tsx` — edit post page.
- Create `src/app/admin/(protected)/posts/actions.ts` — post create/update/delete/logout server actions.
- Create `src/app/api/admin/uploads/route.ts` — authenticated image upload endpoint.
- Create `src/app/media/[id]/route.ts` — media serving with access checks.
- Create `src/app/sitemap.ts` — sitemap from public published posts only.
- Modify `src/components/site-header.tsx` — add a `writing` route link.
- Modify `src/app/layout.tsx` — import MDXEditor CSS.
- Modify `src/app/globals.css` — add minimal writing/admin form styles.
- Create tests under `src/lib/**/__tests__/*.test.ts` for pure auth/post helpers.

---

### Task 1: Convert the project from static export to server-backed app setup

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Create: `.env.example`
- Test: `src/lib/smoke/__tests__/tooling.test.ts`

**Interfaces:**
- Consumes: existing Next.js project.
- Produces: scripts `typecheck`, `test`, `db:generate`, `db:migrate`, `db:deploy`, `db:seed`; server-compatible Next config.

- [ ] **Step 1: Install runtime and dev dependencies**

Run:

```bash
npm install @prisma/client @mdxeditor/editor react-markdown remark-gfm
npm install -D prisma tsx vitest
```

Expected: `package.json` and `package-lock.json` update with the latest available versions.

- [ ] **Step 2: Update scripts in `package.json`**

Replace the `scripts` object and add the `prisma` seed block so the relevant part of `package.json` reads:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Keep the existing `name`, `version`, `private`, `dependencies`, and `devDependencies` fields.

- [ ] **Step 3: Remove static export from `next.config.ts`**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1:3003", "localhost:3003"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create `.env.example`**

Create `.env.example` with:

```env
DATABASE_URL="postgresql://personal_site:personal_site@localhost:5432/personal_site?schema=public"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="change-this-before-seeding"
UPLOAD_DIR="./uploads"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

- [ ] **Step 5: Add a minimal tooling smoke test**

Create `src/lib/smoke/__tests__/tooling.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("tooling", () => {
  it("runs TypeScript unit tests", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
npm test
npm run typecheck
```

Expected: Vitest passes. TypeScript passes, or fails only on the known absence of generated Prisma types before Task 2. If TypeScript fails for another reason, fix that before continuing.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json next.config.ts .env.example src/lib/smoke/__tests__/tooling.test.ts
git commit -m "chore: prepare server-backed writing module"
```

---

### Task 2: Add PostgreSQL schema, Prisma client, and admin seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Modify: `package.json` if Prisma generated client requires postinstall script in the deployment environment
- Test: `prisma/schema.prisma` through Prisma validation/generation

**Interfaces:**
- Consumes: scripts from Task 1.
- Produces: Prisma models `AdminUser`, `AdminSession`, `Post`, `Asset`; enums `PostStatus`, `PostVisibility`; exported `prisma` singleton.

- [ ] **Step 1: Create Prisma schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PostVisibility {
  PUBLIC
  UNLISTED
  PRIVATE
}

model AdminUser {
  id           String         @id @default(cuid())
  email        String         @unique
  passwordHash String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  sessions     AdminSession[]
}

model AdminSession {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  lastSeenAt DateTime @default(now())
  userAgent String?
  ip        String?
  user      AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Post {
  id           String         @id @default(cuid())
  title        String
  slug         String         @unique
  summary      String         @default("")
  bodyMarkdown String         @db.Text
  status       PostStatus     @default(DRAFT)
  visibility   PostVisibility @default(PRIVATE)
  coverAssetId String?
  publishedAt  DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  assets       Asset[]

  @@index([status, visibility, publishedAt])
  @@index([updatedAt])
}

model Asset {
  id           String         @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  storageKey   String         @unique
  visibility   PostVisibility @default(PRIVATE)
  postId       String?
  createdAt    DateTime       @default(now())
  post         Post?          @relation(fields: [postId], references: [id], onDelete: SetNull)

  @@index([postId])
  @@index([visibility])
}
```

- [ ] **Step 2: Create Prisma singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Create password helper before seed uses it**

Create `src/lib/auth/password.ts`:

```ts
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, key] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
```

- [ ] **Step 4: Create admin seed**

Create `prisma/seed.ts`:

```ts
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the admin user.");
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await hashPassword(password);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 5: Generate client and create migration**

Run with a local PostgreSQL database available at `DATABASE_URL`:

```bash
npm run db:generate
npm run db:migrate -- --name init_writing_module
```

Expected: Prisma Client generates successfully and a migration appears under `prisma/migrations/`.

- [ ] **Step 6: Seed admin user**

Run with `ADMIN_EMAIL` and a 12+ character `ADMIN_PASSWORD` set:

```bash
npm run db:seed
```

Expected: stdout includes `Seeded admin user: <email>`.

- [ ] **Step 7: Run verification**

Run:

```bash
npm test
npm run typecheck
```

Expected: both pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add prisma src/lib/db.ts src/lib/auth/password.ts package.json package-lock.json
git commit -m "feat: add writing database schema"
```

---

### Task 3: Add auth token/session helpers and tests

**Files:**
- Create: `src/lib/auth/token.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/__tests__/password.test.ts`
- Create: `src/lib/auth/__tests__/token.test.ts`

**Interfaces:**
- Consumes: `prisma` from `src/lib/db.ts`, `AdminUser`, `AdminSession` Prisma models.
- Produces: `createSessionToken(): string`, `hashSessionToken(token: string): string`, `createAdminSession(userId: string, metadata?: SessionMetadata): Promise<void>`, `getOptionalAdminUser(): Promise<AdminUser | null>`, `requireAdmin(): Promise<AdminUser>`, `destroyAdminSession(): Promise<void>`.

- [ ] **Step 1: Write password helper tests**

Create `src/lib/auth/__tests__/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password hashing", () => {
  it("verifies the original password", async () => {
    const hash = await hashPassword("a-long-safe-password");
    await expect(verifyPassword("a-long-safe-password", hash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const hash = await hashPassword("a-long-safe-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Create token helper test**

Create `src/lib/auth/__tests__/token.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify token helper is missing**

Run:

```bash
npm test -- src/lib/auth/__tests__/token.test.ts
```

Expected: FAIL because `src/lib/auth/token.ts` does not exist.

- [ ] **Step 4: Implement token helper**

Create `src/lib/auth/token.ts`:

```ts
import { createHash, randomBytes } from "node:crypto";

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 5: Implement session helper**

Create `src/lib/auth/session.ts`:

```ts
import type { AdminUser } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSessionToken, hashSessionToken } from "@/lib/auth/token";

const SESSION_COOKIE = "personal_site_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type SessionMetadata = {
  userAgent?: string;
  ip?: string;
};

export async function createAdminSession(userId: string, metadata: SessionMetadata = {}) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent,
      ip: metadata.ip,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getOptionalAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } });
    }
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
}

export async function requireAdmin() {
  const user = await getOptionalAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getRequestMetadata(): Promise<SessionMetadata> {
  const headerStore = await headers();
  return {
    userAgent: headerStore.get("user-agent") ?? undefined,
    ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim(),
  };
}
```

- [ ] **Step 6: Run auth tests and typecheck**

Run:

```bash
npm test -- src/lib/auth/__tests__
npm run typecheck
```

Expected: both pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/lib/auth
git commit -m "feat: add admin session helpers"
```

---

### Task 4: Add post validation, access rules, asset sync helpers, and tests

**Files:**
- Create: `src/lib/posts/validation.ts`
- Create: `src/lib/posts/access.ts`
- Create: `src/lib/posts/assets.ts`
- Create: `src/lib/posts/__tests__/validation.test.ts`
- Create: `src/lib/posts/__tests__/access.test.ts`
- Create: `src/lib/posts/__tests__/assets.test.ts`

**Interfaces:**
- Consumes: Prisma enums `PostStatus`, `PostVisibility`.
- Produces: `slugify(input: string): string`, `parsePostForm(formData: FormData): ParsedPostInput`, `canReadPost(post, isAdmin): boolean`, `shouldIndexPost(post): boolean`, `extractAssetIds(markdown: string): string[]`, `syncPostAssetVisibility(postId, bodyMarkdown, visibility): Promise<void>`.

- [ ] **Step 1: Write validation tests**

Create `src/lib/posts/__tests__/validation.test.ts`:

```ts
import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { parsePostForm, slugify } from "../validation";

describe("post validation", () => {
  it("creates a URL-safe fallback slug", () => {
    expect(slugify("Hello, Personal Site!")).toBe("hello-personal-site");
  });

  it("parses post form values", () => {
    const form = new FormData();
    form.set("title", "My Post");
    form.set("slug", "my-post");
    form.set("summary", "Short summary");
    form.set("bodyMarkdown", "# Hello");
    form.set("status", "PUBLISHED");
    form.set("visibility", "PUBLIC");

    expect(parsePostForm(form)).toEqual({
      title: "My Post",
      slug: "my-post",
      summary: "Short summary",
      bodyMarkdown: "# Hello",
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    });
  });

  it("rejects empty titles", () => {
    const form = new FormData();
    form.set("title", " ");
    form.set("bodyMarkdown", "body");

    expect(() => parsePostForm(form)).toThrow("Title is required.");
  });
});
```

- [ ] **Step 2: Write access tests**

Create `src/lib/posts/__tests__/access.test.ts`:

```ts
import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canReadPost, shouldIndexPost } from "../access";

const basePost = {
  status: PostStatus.PUBLISHED,
  visibility: PostVisibility.PUBLIC,
};

describe("post access", () => {
  it("allows public published posts", () => {
    expect(canReadPost(basePost, false)).toBe(true);
  });

  it("allows unlisted published posts by direct slug", () => {
    expect(canReadPost({ ...basePost, visibility: PostVisibility.UNLISTED }, false)).toBe(true);
  });

  it("hides private posts from public visitors", () => {
    expect(canReadPost({ ...basePost, visibility: PostVisibility.PRIVATE }, false)).toBe(false);
  });

  it("lets admin read drafts", () => {
    expect(canReadPost({ ...basePost, status: PostStatus.DRAFT }, true)).toBe(true);
  });

  it("indexes only public published posts", () => {
    expect(shouldIndexPost(basePost)).toBe(true);
    expect(shouldIndexPost({ ...basePost, visibility: PostVisibility.UNLISTED })).toBe(false);
    expect(shouldIndexPost({ ...basePost, status: PostStatus.DRAFT })).toBe(false);
  });
});
```

- [ ] **Step 3: Write asset extraction test**

Create `src/lib/posts/__tests__/assets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractAssetIds } from "../assets";

describe("asset references", () => {
  it("extracts unique media ids from markdown", () => {
    const markdown = "![one](/media/asset_one) ![two](/media/asset-two) ![again](/media/asset_one)";
    expect(extractAssetIds(markdown)).toEqual(["asset_one", "asset-two"]);
  });
});
```

- [ ] **Step 4: Run tests to verify helpers are missing**

Run:

```bash
npm test -- src/lib/posts/__tests__
```

Expected: FAIL because helper files do not exist.

- [ ] **Step 5: Implement validation helper**

Create `src/lib/posts/validation.ts`:

```ts
import { PostStatus, PostVisibility } from "@prisma/client";

export type ParsedPostInput = {
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  status: PostStatus;
  visibility: PostVisibility;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function slugify(input: string) {
  const slug = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || `post-${Date.now()}`;
}

function parseStatus(value: string) {
  if (value === PostStatus.PUBLISHED || value === PostStatus.ARCHIVED || value === PostStatus.DRAFT) {
    return value;
  }

  return PostStatus.DRAFT;
}

function parseVisibility(value: string) {
  if (value === PostVisibility.PUBLIC || value === PostVisibility.UNLISTED || value === PostVisibility.PRIVATE) {
    return value;
  }

  return PostVisibility.PRIVATE;
}

export function parsePostForm(formData: FormData): ParsedPostInput {
  const title = getString(formData, "title");
  const bodyMarkdown = getString(formData, "bodyMarkdown");

  if (!title) {
    throw new Error("Title is required.");
  }

  return {
    title,
    slug: slugify(getString(formData, "slug") || title),
    summary: getString(formData, "summary"),
    bodyMarkdown,
    status: parseStatus(getString(formData, "status")),
    visibility: parseVisibility(getString(formData, "visibility")),
  };
}
```

- [ ] **Step 6: Implement access helper**

Create `src/lib/posts/access.ts`:

```ts
import { PostStatus, PostVisibility } from "@prisma/client";

type ReadablePostState = {
  status: PostStatus;
  visibility: PostVisibility;
};

export function canReadPost(post: ReadablePostState, isAdmin: boolean) {
  if (isAdmin) {
    return true;
  }

  return (
    post.status === PostStatus.PUBLISHED &&
    (post.visibility === PostVisibility.PUBLIC || post.visibility === PostVisibility.UNLISTED)
  );
}

export function shouldIndexPost(post: ReadablePostState) {
  return post.status === PostStatus.PUBLISHED && post.visibility === PostVisibility.PUBLIC;
}
```

- [ ] **Step 7: Implement asset helper**

Create `src/lib/posts/assets.ts`:

```ts
import type { PostVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";

const MEDIA_ID_PATTERN = /\/media\/([A-Za-z0-9_-]+)/g;

export function extractAssetIds(markdown: string) {
  const ids = new Set<string>();
  let match = MEDIA_ID_PATTERN.exec(markdown);

  while (match) {
    ids.add(match[1]);
    match = MEDIA_ID_PATTERN.exec(markdown);
  }

  return [...ids];
}

export async function syncPostAssetVisibility(postId: string, bodyMarkdown: string, visibility: PostVisibility) {
  const assetIds = extractAssetIds(bodyMarkdown);

  if (assetIds.length === 0) {
    return;
  }

  await prisma.asset.updateMany({
    where: { id: { in: assetIds } },
    data: { postId, visibility },
  });
}
```

- [ ] **Step 8: Run helper tests and typecheck**

Run:

```bash
npm test -- src/lib/posts/__tests__
npm run typecheck
```

Expected: both pass.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/lib/posts
git commit -m "feat: add post access and validation helpers"
```

---

### Task 5: Add public writing queries and public pages

**Files:**
- Create: `src/lib/posts/queries.ts`
- Create: `src/components/writing/markdown-content.tsx`
- Create: `src/app/writing/page.tsx`
- Create: `src/app/writing/[slug]/page.tsx`
- Create: `src/app/sitemap.ts`
- Modify: `src/components/site-header.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `prisma`, `canReadPost`, `shouldIndexPost`, `getOptionalAdminUser`.
- Produces: `getPublicWritingPosts()`, `getPostBySlug(slug)`, `getSitemapPosts()`, public `/writing` and `/writing/[slug]` routes.

- [ ] **Step 1: Implement post queries**

Create `src/lib/posts/queries.ts`:

```ts
import { PostStatus, PostVisibility } from "@prisma/client";
import { prisma } from "@/lib/db";

export function getPublicWritingPosts() {
  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export function getPostBySlug(slug: string) {
  return prisma.post.findUnique({ where: { slug } });
}

export function getAdminPosts() {
  return prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export function getSitemapPosts() {
  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    },
    select: { slug: true, updatedAt: true },
    orderBy: [{ updatedAt: "desc" }],
  });
}
```

- [ ] **Step 2: Add Markdown renderer**

Create `src/components/writing/markdown-content.tsx`:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  markdown: string;
};

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 3: Add public writing list page**

Create `src/app/writing/page.tsx`:

```tsx
import Link from "next/link";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicWritingPosts } from "@/lib/posts/queries";
import { formatDate } from "@/lib/content";

export const metadata = {
  title: "Writing | yorick zhang",
  description: "日记、博客和持续更新的个人记录。",
};

export default async function WritingPage() {
  const posts = await getPublicWritingPosts();

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="writing-page">
        <div className="container writing-page__inner">
          <header className="writing-hero">
            <p className="section-head__kicker">writing</p>
            <h1>一些正在留下来的文字</h1>
            <p>日记、博客、想法和阶段性记录。公开的内容会出现在这里。</p>
          </header>

          <section className="writing-list" aria-label="Writing posts">
            {posts.map((post) => (
              <Link key={post.id} href={`/writing/${post.slug}`} className="writing-card">
                <p className="writing-card__date">
                  {formatDate((post.publishedAt ?? post.createdAt).toISOString())}
                </p>
                <h2>{post.title}</h2>
                {post.summary ? <p>{post.summary}</p> : null}
              </Link>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Add writing detail page**

Create `src/app/writing/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { MarkdownContent } from "@/components/writing/markdown-content";
import { formatDate } from "@/lib/content";
import { getOptionalAdminUser } from "@/lib/auth/session";
import { canReadPost, shouldIndexPost } from "@/lib/posts/access";
import { getPostBySlug } from "@/lib/posts/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Writing`,
    description: post.summary,
    robots: shouldIndexPost(post) ? undefined : { index: false, follow: false },
  };
}

export default async function WritingDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, adminUser] = await Promise.all([getPostBySlug(slug), getOptionalAdminUser()]);

  if (!post || !canReadPost(post, Boolean(adminUser))) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="writing-detail">
        <div className="container writing-detail__inner">
          <Link href="/writing" className="text-link text-link--back">
            back to writing
          </Link>
          <article className="writing-article">
            <header className="writing-article__header">
              <p className="section-head__kicker">writing</p>
              <h1>{post.title}</h1>
              {post.summary ? <p>{post.summary}</p> : null}
              <p className="project-block__meta">
                {formatDate((post.publishedAt ?? post.createdAt).toISOString())}
              </p>
            </header>
            <MarkdownContent markdown={post.bodyMarkdown} />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: Add sitemap**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { getSitemapPosts } from "@/lib/posts/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const posts = await getSitemapPosts();

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/writing`, lastModified: new Date() },
    ...posts.map((post) => ({
      url: `${baseUrl}/writing/${post.slug}`,
      lastModified: post.updatedAt,
    })),
  ];
}
```

- [ ] **Step 6: Add writing nav link**

Modify `src/components/site-header.tsx` so `navItems` includes writing:

```ts
const navItems = [
  { id: "work", label: "work", href: "#work", route: false },
  { id: "writing", label: "writing", href: "/writing", route: true },
  { id: "playground", label: "playground", href: "/playground", route: true },
  { id: "about", label: "about", href: "/about", route: true },
];
```

- [ ] **Step 7: Append minimal public writing styles**

Append to `src/app/globals.css`:

```css
.writing-page,
.writing-detail {
  padding: 120px 0 80px;
}

.writing-page__inner,
.writing-detail__inner {
  max-width: 860px;
}

.writing-hero,
.writing-article__header {
  margin-bottom: 42px;
}

.writing-hero h1,
.writing-article h1 {
  font-family: var(--serif);
  font-size: clamp(2.4rem, 6vw, 5.8rem);
  line-height: 0.95;
  margin: 0 0 18px;
}

.writing-list {
  display: grid;
  gap: 18px;
}

.writing-card {
  display: block;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: rgba(251, 249, 245, 0.72);
  padding: 24px;
  transition: transform 160ms ease, border-color 160ms ease;
}

.writing-card:hover {
  transform: translateY(-2px);
  border-color: rgba(47, 43, 38, 0.36);
}

.writing-card__date {
  color: var(--text-soft);
  font-size: 0.86rem;
  margin: 0 0 10px;
}

.writing-card h2 {
  font-family: var(--serif);
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  margin: 0 0 10px;
}

.writing-card p,
.writing-hero p,
.writing-article__header p {
  color: var(--text-soft);
}

.markdown-content {
  font-size: 1.05rem;
  line-height: 1.9;
}

.markdown-content h2,
.markdown-content h3 {
  font-family: var(--serif);
  line-height: 1.15;
  margin: 2.2em 0 0.7em;
}

.markdown-content p,
.markdown-content ul,
.markdown-content ol,
.markdown-content blockquote,
.markdown-content pre {
  margin: 0 0 1.25em;
}

.markdown-content a {
  color: var(--tag-red);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.markdown-content img {
  max-width: 100%;
  border-radius: 22px;
}

.markdown-content blockquote {
  border-left: 3px solid var(--tag-red);
  color: var(--text-soft);
  padding-left: 18px;
}

.markdown-content code {
  background: rgba(47, 43, 38, 0.08);
  border-radius: 6px;
  padding: 0.15em 0.35em;
}

.markdown-content pre {
  background: rgba(47, 43, 38, 0.08);
  border-radius: 18px;
  overflow-x: auto;
  padding: 18px;
}
```

- [ ] **Step 8: Run verification**

Run with a seeded database:

```bash
npm run typecheck
npm run build
```

Expected: both pass. Manual check: `/writing` renders an empty list if there are no public posts.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/lib/posts/queries.ts src/components/writing src/app/writing src/app/sitemap.ts src/components/site-header.tsx src/app/globals.css
git commit -m "feat: add public writing pages"
```

---

### Task 6: Add admin login and protected admin shell

**Files:**
- Create: `src/app/admin/login/actions.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/(protected)/layout.tsx`
- Create: `src/app/admin/(protected)/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `verifyPassword`, `createAdminSession`, `getRequestMetadata`, `requireAdmin`.
- Produces: `/admin/login`, protected route group under `/admin/*`, redirect from `/admin` to `/admin/posts`.

- [ ] **Step 1: Create login server action**

Create `src/app/admin/login/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession, getRequestMetadata } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "账号或密码错误" };
  }

  await createAdminSession(user.id, await getRequestMetadata());
  redirect("/admin/posts");
}
```

- [ ] **Step 2: Create login page**

Create `src/app/admin/login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="admin-login">
      <form action={formAction} className="admin-card">
        <p className="section-head__kicker">admin</p>
        <h1>登录写作后台</h1>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {state.error ? <p className="admin-error">{state.error}</p> : null}
        <button type="submit" disabled={pending}>
          {pending ? "登录中" : "登录"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Add protected admin layout**

Create `src/app/admin/(protected)/layout.tsx`:

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { logoutAction } from "./posts/actions";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="site-brand">
          <span className="site-brand__name">yorick zhang</span>
          <span className="site-brand__sub">writing admin</span>
        </Link>
        <nav>
          <Link href="/admin/posts">Posts</Link>
          <Link href="/admin/posts/new">New post</Link>
        </nav>
        <form action={logoutAction}>
          <button type="submit">Logout</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Create admin index redirect**

Create `src/app/admin/(protected)/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/posts");
}
```

- [ ] **Step 5: Create temporary post actions file for logout**

Create `src/app/admin/(protected)/posts/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/auth/session";

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
```

- [ ] **Step 6: Append admin shell styles**

Append to `src/app/globals.css`:

```css
.admin-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.admin-card {
  width: min(100%, 420px);
  display: grid;
  gap: 18px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface);
  padding: 28px;
}

.admin-card h1 {
  font-family: var(--serif);
  font-size: 2.4rem;
  margin: 0;
}

.admin-card label,
.admin-field {
  display: grid;
  gap: 8px;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.admin-card input,
.admin-field input,
.admin-field textarea,
.admin-field select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.58);
  color: var(--text);
  font: inherit;
  padding: 12px 14px;
}

.admin-card button,
.admin-button,
.admin-sidebar button {
  border: 0;
  border-radius: 999px;
  background: var(--text);
  color: var(--surface);
  font: inherit;
  padding: 12px 18px;
}

.admin-error {
  color: var(--tag-red);
  margin: 0;
}

.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: 26px;
  border-right: 1px solid var(--line);
  background: rgba(251, 249, 245, 0.78);
  padding: 28px;
}

.admin-sidebar nav {
  display: grid;
  gap: 12px;
}

.admin-main {
  padding: 38px;
}

@media (max-width: 760px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
}
```

- [ ] **Step 7: Run verification**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both pass. Manual check: `/admin` redirects to `/admin/login` when logged out; valid seeded credentials redirect to `/admin/posts`, which may 404 until Task 7 creates it.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/app/admin src/app/globals.css
git commit -m "feat: add admin login shell"
```

---

### Task 7: Add admin post CRUD with textarea editor first

**Files:**
- Modify: `src/app/admin/(protected)/posts/actions.ts`
- Create: `src/app/admin/(protected)/posts/page.tsx`
- Create: `src/app/admin/(protected)/posts/new/page.tsx`
- Create: `src/app/admin/(protected)/posts/[id]/page.tsx`
- Create: `src/components/admin/post-form.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `parsePostForm`, `syncPostAssetVisibility`, `getAdminPosts`, `prisma`, `requireAdmin`.
- Produces: `createPostAction(formData)`, `updatePostAction(id, formData)`, `archivePostAction(id)`, admin pages for list/new/edit.

- [ ] **Step 1: Replace post actions with CRUD actions**

Replace `src/app/admin/(protected)/posts/actions.ts` with:

```ts
"use server";

import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { destroyAdminSession, requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { syncPostAssetVisibility } from "@/lib/posts/assets";
import { parsePostForm } from "@/lib/posts/validation";

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function createPostAction(formData: FormData) {
  await requireAdmin();
  const input = parsePostForm(formData);
  const publishedAt = input.status === PostStatus.PUBLISHED ? new Date() : null;

  const post = await prisma.post.create({
    data: { ...input, publishedAt },
  });

  await syncPostAssetVisibility(post.id, post.bodyMarkdown, post.visibility);
  revalidatePath("/writing");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePostAction(id: string, formData: FormData) {
  await requireAdmin();
  const input = parsePostForm(formData);
  const current = await prisma.post.findUniqueOrThrow({ where: { id } });
  const publishedAt =
    input.status === PostStatus.PUBLISHED && !current.publishedAt ? new Date() : current.publishedAt;

  const post = await prisma.post.update({
    where: { id },
    data: { ...input, publishedAt },
  });

  await syncPostAssetVisibility(post.id, post.bodyMarkdown, post.visibility);
  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
  redirect(`/admin/posts/${post.id}`);
}

export async function archivePostAction(id: string) {
  await requireAdmin();
  const post = await prisma.post.update({
    where: { id },
    data: { status: PostStatus.ARCHIVED },
  });
  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
}
```

- [ ] **Step 2: Create shared post form with textarea**

Create `src/components/admin/post-form.tsx`:

```tsx
import { PostStatus, PostVisibility, type Post } from "@prisma/client";

type PostFormProps = {
  post?: Post;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

export function PostForm({ post, action, submitLabel }: PostFormProps) {
  return (
    <form action={action} className="admin-post-form">
      <label className="admin-field">
        Title
        <input name="title" defaultValue={post?.title ?? ""} required />
      </label>
      <label className="admin-field">
        Slug
        <input name="slug" defaultValue={post?.slug ?? ""} placeholder="auto-generated-from-title" />
      </label>
      <label className="admin-field">
        Summary
        <textarea name="summary" rows={3} defaultValue={post?.summary ?? ""} />
      </label>
      <div className="admin-form-grid">
        <label className="admin-field">
          Status
          <select name="status" defaultValue={post?.status ?? PostStatus.DRAFT}>
            <option value={PostStatus.DRAFT}>Draft</option>
            <option value={PostStatus.PUBLISHED}>Published</option>
            <option value={PostStatus.ARCHIVED}>Archived</option>
          </select>
        </label>
        <label className="admin-field">
          Visibility
          <select name="visibility" defaultValue={post?.visibility ?? PostVisibility.PRIVATE}>
            <option value={PostVisibility.PRIVATE}>Private</option>
            <option value={PostVisibility.UNLISTED}>Unlisted</option>
            <option value={PostVisibility.PUBLIC}>Public</option>
          </select>
        </label>
      </div>
      <label className="admin-field">
        Markdown
        <textarea name="bodyMarkdown" rows={22} defaultValue={post?.bodyMarkdown ?? ""} />
      </label>
      <button className="admin-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create admin post list page**

Create `src/app/admin/(protected)/posts/page.tsx`:

```tsx
import Link from "next/link";
import { formatDate } from "@/lib/content";
import { getAdminPosts } from "@/lib/posts/queries";
import { archivePostAction } from "./actions";

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">posts</p>
          <h1>Writing</h1>
        </div>
        <Link href="/admin/posts/new" className="admin-button">
          New post
        </Link>
      </header>
      <div className="admin-table">
        {posts.map((post) => (
          <article key={post.id} className="admin-row">
            <div>
              <h2>{post.title}</h2>
              <p>
                {post.status} · {post.visibility} · updated {formatDate(post.updatedAt.toISOString())}
              </p>
            </div>
            <div className="admin-row__actions">
              <Link href={`/writing/${post.slug}`}>Preview</Link>
              <Link href={`/admin/posts/${post.id}`}>Edit</Link>
              <form action={archivePostAction.bind(null, post.id)}>
                <button type="submit">Archive</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create new post page**

Create `src/app/admin/(protected)/posts/new/page.tsx`:

```tsx
import { PostForm } from "@/components/admin/post-form";
import { createPostAction } from "../actions";

export default function NewPostPage() {
  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">new</p>
          <h1>New post</h1>
        </div>
      </header>
      <PostForm action={createPostAction} submitLabel="Create post" />
    </section>
  );
}
```

- [ ] **Step 5: Create edit post page**

Create `src/app/admin/(protected)/posts/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { prisma } from "@/lib/db";
import { updatePostAction } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    notFound();
  }

  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">edit</p>
          <h1>{post.title}</h1>
        </div>
      </header>
      <PostForm post={post} action={updatePostAction.bind(null, post.id)} submitLabel="Save post" />
    </section>
  );
}
```

- [ ] **Step 6: Append admin post styles**

Append to `src/app/globals.css`:

```css
.admin-section {
  display: grid;
  gap: 28px;
}

.admin-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.admin-section__header h1 {
  font-family: var(--serif);
  font-size: clamp(2.2rem, 5vw, 4.8rem);
  margin: 0;
}

.admin-table,
.admin-post-form {
  display: grid;
  gap: 16px;
}

.admin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: rgba(251, 249, 245, 0.72);
  padding: 18px;
}

.admin-row h2 {
  margin: 0 0 6px;
}

.admin-row p {
  color: var(--text-soft);
  margin: 0;
}

.admin-row__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-row__actions button {
  border: 0;
  background: transparent;
  color: var(--tag-red);
  font: inherit;
}

.admin-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
```

- [ ] **Step 7: Run verification**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both pass. Manual check: log in, create a draft, edit it, publish it as public, see it on `/writing`, archive it, and confirm it disappears from `/writing`.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/app/admin src/components/admin src/app/globals.css
git commit -m "feat: add admin post editing"
```

---

### Task 8: Replace textarea with MDXEditor and import editor styles

**Files:**
- Create: `src/components/admin/markdown-editor.tsx`
- Modify: `src/components/admin/post-form.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `PostForm` from Task 7.
- Produces: a client-only editor that writes Markdown into hidden form field `bodyMarkdown`.

- [ ] **Step 1: Import MDXEditor CSS globally**

Modify `src/app/layout.tsx` so imports read:

```tsx
import type { Metadata } from "next";
import { CustomCursor } from "@/components/custom-cursor";
import "@mdxeditor/editor/style.css";
import "./globals.css";
```

Keep the existing metadata and `RootLayout` component unchanged.

- [ ] **Step 2: Create MDXEditor wrapper**

Create `src/components/admin/markdown-editor.tsx`:

```tsx
"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  codeBlockPlugin,
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { useState } from "react";

type MarkdownEditorProps = {
  name: string;
  initialMarkdown: string;
};

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image upload failed.");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export function MarkdownEditor({ name, initialMarkdown }: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialMarkdown);

  return (
    <div className="admin-markdown-editor">
      <input type="hidden" name={name} value={markdown} />
      <MDXEditor
        markdown={initialMarkdown}
        onChange={setMarkdown}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
          imagePlugin({ imageUploadHandler: uploadImage }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <ListsToggle />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertCodeBlock />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 3: Use MarkdownEditor in PostForm**

Replace the Markdown field in `src/components/admin/post-form.tsx`:

```tsx
      <label className="admin-field">
        Markdown
        <textarea name="bodyMarkdown" rows={22} defaultValue={post?.bodyMarkdown ?? ""} />
      </label>
```

with:

```tsx
      <div className="admin-field">
        <span>Markdown</span>
        <MarkdownEditor name="bodyMarkdown" initialMarkdown={post?.bodyMarkdown ?? ""} />
      </div>
```

Add this import at the top of `src/components/admin/post-form.tsx`:

```tsx
import { MarkdownEditor } from "@/components/admin/markdown-editor";
```

- [ ] **Step 4: Append editor styles**

Append to `src/app/globals.css`:

```css
.admin-markdown-editor {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.62);
}

.admin-markdown-editor .mdxeditor {
  min-height: 520px;
}
```

- [ ] **Step 5: Run verification**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both pass. Manual check: edit a post with headings, list, link, quote, table, and code block; save; verify Markdown persists in the database and renders on `/writing/[slug]`.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/components/admin src/app/layout.tsx src/app/globals.css
git commit -m "feat: add markdown editor"
```

---

### Task 9: Add image upload and media serving with access checks

**Files:**
- Create: `src/app/api/admin/uploads/route.ts`
- Create: `src/app/media/[id]/route.ts`
- Modify: `src/lib/posts/assets.ts` if tests require stricter ID extraction

**Interfaces:**
- Consumes: `requireAdmin`, `getOptionalAdminUser`, `prisma`, `Asset.visibility`.
- Produces: authenticated `POST /api/admin/uploads` returning `{ id, url }`; `GET /media/[id]` that serves public/unlisted media to anyone and private media to admin only.

- [ ] **Step 1: Create upload route**

Create `src/app/api/admin/uploads/route.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function getUploadDir() {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be 10MB or smaller." }, { status: 400 });
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const extension = path.extname(file.name).toLowerCase() || ".bin";
  const storageKey = `${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storageKey), bytes);

  const asset = await prisma.asset.create({
    data: {
      filename: storageKey,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      storageKey,
    },
  });

  return NextResponse.json({ id: asset.id, url: `/media/${asset.id}` });
}
```

- [ ] **Step 2: Create media route**

Create `src/app/media/[id]/route.ts`:

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PostVisibility } from "@prisma/client";
import { notFound } from "next/navigation";
import { getOptionalAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

function getUploadDir() {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset) {
    notFound();
  }

  if (asset.visibility === PostVisibility.PRIVATE) {
    const adminUser = await getOptionalAdminUser();
    if (!adminUser) {
      notFound();
    }
  }

  const filePath = path.join(getUploadDir(), asset.storageKey);
  const file = await readFile(filePath);

  return new Response(file, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": asset.visibility === PostVisibility.PUBLIC ? "public, max-age=31536000, immutable" : "private, no-store",
    },
  });
}
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both pass. Manual check: upload an image in the editor, save the post as private, confirm the image loads while logged in, confirm a logged-out private media URL returns 404, publish the post as public, and confirm the media URL loads logged out.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/app/api/admin/uploads src/app/media
git commit -m "feat: add writing image uploads"
```

---

### Task 10: Final verification, deployment notes, and old content import decision

**Files:**
- Create: `docs/writing-module.md`
- No code changes unless verification exposes a defect.

**Interfaces:**
- Consumes: completed Tasks 1-9.
- Produces: operator notes for local development, server deployment, backup, and the explicit decision to keep `thinking` static for now.

- [ ] **Step 1: Create operator documentation**

Create `docs/writing-module.md`:

```md
# Writing Module

This personal-site writing module is a lightweight single-owner backend, not a CMS.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Start PostgreSQL.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.
7. Open `/admin/login`.

## Content rules

- `DRAFT`: admin only.
- `PUBLISHED + PUBLIC`: visible in `/writing`, readable by anyone, included in sitemap.
- `PUBLISHED + UNLISTED`: readable by direct slug, excluded from listing and sitemap, marked `noindex`.
- `PUBLISHED + PRIVATE`: admin only.
- `ARCHIVED`: admin only.

## Uploads

Image files are stored in `UPLOAD_DIR`. PostgreSQL stores file metadata and visibility. Back up both PostgreSQL and `UPLOAD_DIR`.

## Backup

Run a daily `pg_dump` for the database and archive `UPLOAD_DIR`. Keep at least 7 daily backups.

## Existing content

The existing static `src/content/thinking.ts` content remains static. Importing it into PostgreSQL is a separate migration step if the new module proves useful.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 3: Manual acceptance test**

Perform these checks in the browser:

```txt
1. Logged out /admin redirects to /admin/login.
2. Wrong login shows "账号或密码错误".
3. Seeded admin can log in.
4. Admin can create a draft with Markdown.
5. Draft is not readable logged out at /writing/[slug].
6. Publishing as PUBLIC shows the post in /writing.
7. Publishing as UNLISTED hides the post from /writing but direct slug works.
8. Publishing as PRIVATE hides the post from logged-out visitors and allows logged-in admin.
9. Uploaded image appears in Markdown and respects media visibility after save.
10. /sitemap.xml contains only PUBLIC published posts.
```

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/writing-module.md
git commit -m "docs: document writing module operations"
```

---

## Self-Review

- Spec coverage: PostgreSQL, single-owner admin, Markdown storage, visibility/status rules, public pages, admin CRUD, image upload, sitemap, and no-CMS constraint are each implemented in Tasks 1-10.
- Placeholder scan: this plan has no `TBD`, no incomplete sections, and no vague implementation-only instructions.
- Type consistency: `PostStatus`/`PostVisibility`, `bodyMarkdown`, `createPostAction`, `updatePostAction`, `extractAssetIds`, `syncPostAssetVisibility`, and auth helper names are consistent across tasks.
- Scope: Yuque sync, comments, multi-user roles, full-text search, version history, and static `thinking` migration are explicitly excluded from first implementation.
