// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { BadgePopup } from "@/components/bible/BadgePopup";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { ToastProvider } from "@/components/ui/toast";
import { LocaleHtmlWrapper } from "@/components/providers/LocaleHtmlWrapper";

const baseUrl = process.env.NEXTAUTH_URL || 'https://aidu.app';

export const metadata: Metadata = {
  title: {
    default: "AI读 - 你的灵修伴侣",
    template: "%s | AI读",
  },
  description: "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
  keywords: ["Bible", "Scripture", "AI", "devotional", "CUV", "KJV", "Bible reading", "verse interpretation", "daily reading", "reading plan", "圣经", "读经", "灵修", "和合本", "圣经阅读", "经文解读", "每日读经", "读经计划"],
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
    title: "AI读 - AI-Powered Bible Reading & Devotional Assistant",
    description: "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "AI读 - AI-Powered Bible Reading Assistant" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI读 - AI-Powered Bible Reading Assistant",
    description: "AI-powered Bible reading and devotional assistant",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI读",
    "description": "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
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
      "Bilingual reading (CUV/KJV)",
      "AI verse interpretation",
      "Text-to-speech",
      "Reading plans",
      "Highlights & notes",
      "Group reading",
      "Devotional content"
    ]
  };

  return (
    <LocaleHtmlWrapper>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
           {children}
           {/* 后台数据同步组件，它自带 "use client"，会自动在浏览器空闲时挂载 */}
           <SyncProvider />
           {/* 勋章获得弹窗 */}
           <BadgePopup />
           {/* 访问统计追踪 */}
           <AnalyticsTracker />
          </ToastProvider>
        </AuthProvider>
      </body>
    </LocaleHtmlWrapper>
  );
}