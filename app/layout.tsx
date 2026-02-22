// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider"; // 恢复为静态导入

// [优化 1] 强制字体交换，避免加载期间出现白屏隐形文字
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", 
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          {/* 后台数据同步组件，它自带 "use client"，会自动在浏览器空闲时挂载 */}
          <SyncProvider /> 
        </AuthProvider>
      </body>
    </html>
  );
}