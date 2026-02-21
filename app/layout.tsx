import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider"; // [新增]
import { SyncProvider } from "@/components/providers/SyncProvider"; // [新增]

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Scripture AI - 你的灵修伴侣",
  description: "AI 驱动的圣经阅读与灵修助手",
  manifest: "/manifest.json", // [新增]
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
      <body className="...">
        <AuthProvider>
          <SyncProvider /> {/* [新增] 负责数据同步 */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
