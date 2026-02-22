// app/loading.tsx
import { BookOpen } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[9999]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* 优雅的图标和光晕效果 */}
        <div className="relative p-4">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <BookOpen className="w-12 h-12 text-primary relative z-10" />
        </div>
        
        {/* 文字提示 */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-serif tracking-widest text-foreground font-bold">
            SCRIPTURE AI
          </h2>
          <p className="text-sm text-muted-foreground tracking-widest">
            正在加载灵修空间...
          </p>
        </div>
      </div>
    </div>
  );
}