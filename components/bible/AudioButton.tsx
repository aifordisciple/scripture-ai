// components/bible/AudioButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, StopCircle } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface AudioButtonProps {
  text: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string; 
}

// --- 🧹 文本清洗工具函数 (升级版) ---
function cleanMarkdown(text: string): string {
  if (!text) return "";
  
  return text
    // 1. 去除标题 (# Header)
    .replace(/^#+\s+/gm, "")
    // 2. 去除加粗/斜体 (**bold**, *italic*)
    .replace(/(\*\*|__)(.*?)\1/g, "$2") 
    .replace(/(\*|_)(.*?)\1/g, "$2")    
    // 3. 去除链接 ([text](url)) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // 4. 去除行内代码 (`code`)
    .replace(/`([^`]+)`/g, "$1")
    // 5. 去除代码块 (```js ... ```)
    .replace(/```[\s\S]*?```/g, "") 
    // 6. 去除列表符号 (- item, * item)
    .replace(/^\s*[-*+]\s+/gm, "")
    // 7. 去除引用符号 (> quote)
    .replace(/^\s*>\s+/gm, "")
    // 8. 去除剩余的 Markdown 符号 (如单独的 #, *)
    .replace(/[#*`]/g, "")
    // 9. [新增] 去除 Emoji 表情图标 (Unicode Ranges)
    // 涵盖了常见表情、手势、符号等
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F800}-\u{1F8FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, "")
    // 10. 压缩多余的换行和空格
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function AudioButton({
  text,
  className,
  variant = "ghost",
  size = "icon",
  label
}: AudioButtonProps) {
  const { t } = useTranslation();
  const { isPlaying, isLoading, play, stop } = useAudioPlayer();
  const [isThisPlaying, setIsThisPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      setIsThisPlaying(false);
    }
  }, [isPlaying]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止冒泡

    if (isThisPlaying) {
      stop();
      setIsThisPlaying(false);
    } else {
      // 播放前先清洗文本 (去除 Markdown 和 Emoji)
      const cleanText = cleanMarkdown(text);
      
      play(cleanText);
      setIsThisPlaying(true);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("transition-colors", className, isThisPlaying && "text-primary bg-primary/10 active:scale-95")}
      onClick={handleToggle}
      title={isThisPlaying ? t('bible.stopReading') : t('bible.readContent')}
      disabled={isLoading && !isThisPlaying}
    >
      {isLoading && isThisPlaying ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isThisPlaying ? (
        <StopCircle className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
      
      {label && <span className="ml-1.5">{label}</span>}
    </Button>
  );
}