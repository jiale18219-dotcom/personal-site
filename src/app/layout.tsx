import type { Metadata } from "next";
import { CustomCursor } from "@/components/custom-cursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "yorick jue | Personal Space",
  description:
    "一个偏创意、内容驱动、会持续更新的个人空间网站，用来展示产品、想法和正在发生的创作状态。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
