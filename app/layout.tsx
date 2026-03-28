// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { BadgePopup } from "@/components/bible/BadgePopup";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const baseUrl = process.env.NEXTAUTH_URL || 'https://aidu.app';

export const metadata: Metadata = {
  title: "AI读 - 你的灵修伴侣",
  description: "AI 驱动的圣经阅读与灵修助手，支持中英对照、语音朗读、高亮笔记、读经计划等功能",
  keywords: ["圣经", "读经", "AI读经", "灵修", "和合本", "KJV", "圣经阅读", "经文解读", "每日读经", "读经计划"],
  manifest: "/manifest.json",
  authors: [{ name: "AI读团队" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI读",
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
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    url: baseUrl,
    siteName: "AI读",
    title: "AI读 - 你的灵修伴侣",
    description: "AI 驱动的圣经阅读与灵修助手，支持中英对照、语音朗读、高亮笔记、读经计划等功能",
    locale: "zh_CN",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "AI读 - 智能圣经阅读助手" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI读 - 你的灵修伴侣",
    description: "AI 驱动的圣经阅读与灵修助手",
    images: ["/og-image.png"],
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
  // JSON-LD 结构化数据
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI读",
    "description": "AI驱动的圣经阅读与灵修助手，支持中英对照、语音朗读、高亮笔记、读经计划等功能",
    "url": baseUrl,
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web, iOS, Android",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    },
    "featureList": [
      "中英对照阅读",
      "AI经文解读",
      "语音朗读",
      "读经计划",
      "高亮笔记",
      "小组共读",
      "灵修内容"
    ]
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      {/* 移除了 Google Fonts 的依赖，直接使用 antialiased 启用 Tailwind 默认的无衬线系统字体 */}
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
           {children}
           {/* 后台数据同步组件，它自带 "use client"，会自动在浏览器空闲时挂载 */}
           <SyncProvider />
           {/* 勋章获得弹窗 */}
           <BadgePopup />
           {/* 访问统计追踪 */}
           <AnalyticsTracker />
        </AuthProvider>
      </body>
    </html>
  );
}