// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import dynamic from "next/dynamic";

const BadgePopup = dynamic(() => import("@/components/bible/BadgePopup").then(mod => mod.BadgePopup), { ssr: false });

export const metadata: Metadata = {
  title: "Scripture AI - 你的灵修伴侣",
  description: "AI 驱动的圣经阅读与灵修助手",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      {/* 移除了 Google Fonts 的依赖，直接使用 antialiased 启用 Tailwind 默认的无衬线系统字体 */}
      <body className="antialiased">
        <AuthProvider>
           {children}
           {/* 后台数据同步组件，它自带 "use client"，会自动在浏览器空闲时挂载 */}
           <SyncProvider />
           {/* 勋章获得弹窗 */}
           <BadgePopup />
        </AuthProvider>
      </body>
    </html>
  );
}