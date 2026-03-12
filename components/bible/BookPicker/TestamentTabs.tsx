// components/bible/BookPicker/TestamentTabs.tsx
"use client";

import { cn } from "@/lib/utils";
import { TestamentTabsProps, Testament } from "./types";
import { motion } from "framer-motion";

/**
 * 旧约/新约切换 Tab
 */
export function TestamentTabs({ testament, onChange }: TestamentTabsProps) {
  const tabs: { id: Testament; label: string; count: number }[] = [
    { id: "old", label: "旧约", count: 39 },
    { id: "new", label: "新约", count: 27 },
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
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TestamentTabs;