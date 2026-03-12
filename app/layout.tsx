// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { BadgePopup } from "@/components/bible/BadgePopup";

export const metadata: Metadata = {
  title: "Scripture AI - 你的灵修伴侣",
  description: "AI 驱动的圣经阅读与灵修助手，支持中英对照、语音朗读、高亮笔记、读经计划等功能",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scripture AI",
    startupImage: [
      "/icon-512x512.png",
    ],
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Scripture AI",
    title: "Scripture AI - 你的灵修伴侣",
    description: "AI 驱动的圣经阅读与灵修助手",
  },
  twitter: {
    card: "summary",
    title: "Scripture AI - 你的灵修伴侣",
    description: "AI 驱动的圣经阅读与灵修助手",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
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