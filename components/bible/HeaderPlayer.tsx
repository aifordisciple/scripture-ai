// components/bible/HeaderPlayer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

// 定义播放器接口（对应 useAudioPlayer 的返回值）
export interface AudioPlayerInstance {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  playbackRate: number;
  ttsMode?: 'server' | 'browser';
  play: (text: string) => void;
  seek: (time: number) => void;
  setRate: (rate: number) => void;
}

interface HeaderPlayerProps {
  player: AudioPlayerInstance; // 接收播放器实例
  text: string;
  className?: string;
  mode?: 'full' | 'minimal'; // full: 完整版, minimal: 仅按钮
}

export function HeaderPlayer({ player, text, className, mode = 'full' }: HeaderPlayerProps) {
  const { t } = useTranslation();
  const { 
    isPlaying, isLoading, duration, currentTime, playbackRate,
    play, seek, setRate 
  } = player;

  // 时间格式化
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setRate(rates[nextIdx]);
  };

  // 本地进度状态（优化拖拽体验）
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(currentTime);
    }
  }, [currentTime, isDragging]);

  // --- 模式 1: 极简模式 (仅显示播放按钮，用于移动端 Header) ---
  if (mode === 'minimal') {
      return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => play(text)} 
            disabled={isLoading || !text}
            className={cn("h-9 w-9 rounded-full dark:text-white/80", className)}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#7a7a7a]" />
            ) : isPlaying ? (
                <Pause className="h-5 w-5 text-[#0066cc] fill-current" />
            ) : (
                <Play className="h-5 w-5 fill-current" />
            )}
        </Button>
      );
  }

  // --- 模式 2: 完整模式 (带进度条和倍速) ---
  return (
    <div className={cn("flex items-center gap-2 bg-[#f5f5f7] dark:bg-[#2a2a2c] rounded-full px-3 py-1 border border-[#e0e0e0] dark:border-[#3a3a3c] transition-all", className)}>
      
      {/* 播放/暂停 */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => play(text)} 
        disabled={isLoading || !text}
        className="h-8 w-8 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#7a7a7a]" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 text-[#0066cc] fill-current" />
        ) : (
          <Play className="h-4 w-4 text-[#1d1d1f] dark:text-white/80 fill-current ml-0.5" />
        )}
      </Button>

      {/* 进度条 */}
      <div className={cn("flex items-center gap-2 transition-all duration-500 overflow-hidden", 
          duration > 0 ? "w-full md:w-64 opacity-100" : "w-0 opacity-0"
      )}>
        <span className="text-[10px] text-[#7a7a7a] font-mono w-9 text-right shrink-0 select-none">
          {formatTime(isDragging ? localProgress : currentTime)}
        </span>
        
        <Slider
          value={[isDragging ? localProgress : currentTime]}
          min={0}
          max={duration || 100}
          step={1}
          className="flex-1 cursor-pointer"
          onValueChange={(vals) => {
            setIsDragging(true);
            setLocalProgress(vals[0]);
          }}
          onValueCommit={(vals) => {
            setIsDragging(false);
            seek(vals[0]);
          }}
        />

        <span className="text-[10px] text-[#7a7a7a]/60 font-mono w-9 shrink-0 select-none">
          {formatTime(duration)}
        </span>
      </div>

      {/* 倍速 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSpeed}
        className={cn("h-7 px-2 text-[10px] font-bold text-[#7a7a7a] hover:text-[#0066cc] transition-all overflow-hidden",
            duration > 0 ? "w-auto opacity-100 ml-1 border-l border-[#e0e0e0] dark:border-[#3a3a3c] rounded-none" : "w-0 opacity-0 px-0"
        )}
        title={t('bible.togglePlaybackSpeed')}
      >
        {playbackRate}x
      </Button>
    </div>
  );
}