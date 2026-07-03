import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getBlogUrl } from "@/lib/blog-url";

export const metadata: Metadata = {
  title: "Writing | yorick zhang",
  description: "日记、博客和持续更新的个人记录。",
};

export default function WritingPage() {
  redirect(getBlogUrl());
}
