"use client";

import { useBibleStore } from "@/store/useBibleStore";

export function LocaleHtmlWrapper({ children }: { children: React.ReactNode }) {
  const locale = useBibleStore((state) => state.locale);
  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'} suppressHydrationWarning>
      {children}
    </html>
  );
}