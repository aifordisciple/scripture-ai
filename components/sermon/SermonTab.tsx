// components/sermon/SermonTab.tsx
"use client";

import { useEffect } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { useTranslation } from "@/lib/i18n";

export function SermonTab() {
  const { t } = useTranslation();
  const {
    sermons,
    setSermons,
    sermonsLoading,
    setSermonsLoading,
    currentSermon,
    setCurrentSermon,
  } = useBibleStore();

  useEffect(() => {
    if (sermons.length === 0 && !currentSermon) {
      setSermonsLoading(true);
      fetch("/api/sermon")
        .then((res) => res.json())
        .then((data) => {
          if (data.sermons) {
            setSermons(data.sermons);
          }
        })
        .catch(() => {})
        .finally(() => {
          setSermonsLoading(false);
        });
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t("sermon.title")}
          </h1>
        </div>

        {sermonsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sermons.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {t("sermon.noSermons")}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              {t("sermon.noSermonsDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                onClick={() => setCurrentSermon(sermon)}
                className="p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <h3 className="font-semibold text-foreground">
                  {sermon.title || t("sermon.untitled")}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{t(`sermon.${sermon.style.toLowerCase()}`)}</span>
                  <span>-</span>
                  <span>
                    {new Date(sermon.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
