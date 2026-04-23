// components/bible/BookPicker/TestamentTabs.tsx
"use client";

import { cn } from "@/lib/utils";
import { TestamentTabsProps, Testament } from "./types";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

/**
 * 旧约/新约切换 Tab
 */
export function TestamentTabs({ testament, onChange }: TestamentTabsProps) {
  const t = useTranslation();

  const tabs: { id: Testament; labelKey: string; count: number }[] = [
    { id: "old", labelKey: "sidebar.oldTestament", count: 39 },
    { id: "new", labelKey: "sidebar.newTestament", count: 27 },
  ];

  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex bg-secondary/60 rounded-full p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
              testament === tab.id
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {testament === tab.id && (
              <motion.div
                layoutId="testament-tab"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", duration: 0.3 }}
              />
            )}
            <span className="relative z-10">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TestamentTabs;