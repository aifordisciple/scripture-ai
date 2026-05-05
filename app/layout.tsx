// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { BadgePopup } from "@/components/bible/BadgePopup";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { ToastProvider } from "@/components/ui/toast";
import { LocaleHtmlWrapper } from "@/components/providers/LocaleHtmlWrapper";

const baseUrl = process.env.NEXTAUTH_URL || 'https://aidu.app';

const i18nMeta = {
  zh: {
    title: "AI读 - 你的灵修伴侣",
    template: "%s | AI读",
    siteName: "AI读",
    ogTitle: "AI读 - AI-Powered Bible Reading & Devotional Assistant",
    description: "AI驱动的圣经阅读与灵修助手，支持中英双语、语音朗读、高亮笔记、读经计划",
    ogAlt: "AI读 - AI-Powered Bible Reading Assistant",
  },
  en: {
    title: "Scripture AI - Your Devotional Companion",
    template: "%s | Scripture AI",
    siteName: "Scripture AI",
    ogTitle: "Scripture AI - AI-Powered Bible Reading & Devotional Assistant",
    description: "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
    ogAlt: "Scripture AI - AI-Powered Bible Reading Assistant",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'zh';
  const meta = i18nMeta[locale as keyof typeof i18nMeta] || i18nMeta.zh;

  return {
    title: {
      default: meta.title,
      template: meta.template,
    },
    description: meta.description,
    keywords: ["Bible", "Scripture", "AI", "devotional", "CUV", "KJV", "Bible reading", "verse interpretation", "daily reading", "reading plan", "圣经", "读经", "灵修", "和合本", "圣经阅读", "经文解读", "每日读经", "读经计划"],
    manifest: "/manifest.json",
    authors: [{ name: "Scripture AI Team" }],
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: meta.siteName,
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
      siteName: meta.siteName,
      title: meta.ogTitle,
      description: meta.description,
      locale: locale === 'en' ? "en_US" : "zh_CN",
      alternateLocale: locale === 'en' ? ["zh_CN"] : ["en_US"],
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: meta.ogAlt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.ogTitle,
      description: meta.description,
      images: ["/og-image.png"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#272729" },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
          Skip to content
        </a>
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