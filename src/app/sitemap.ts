import type { MetadataRoute } from "next";

import { getSitemapPosts } from "@/lib/posts/queries";

export const dynamic = "force-dynamic";

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
