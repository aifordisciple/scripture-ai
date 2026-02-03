// components/bible/HeaderPlayer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// 定义播放器接口（对应 useAudioPlayer 的返回值）
export interface AudioPlayerInstance {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  playbackRate: number;
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
            className={cn("h-9 w-9 rounded-full dark:text-slate-200", className)}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : isPlaying ? (
                <Pause className="h-5 w-5 text-blue-600 fill-current" />
            ) : (
                <Play className="h-5 w-5 fill-current" />
            )}
        </Button>
      );
  }

  // --- 模式 2: 完整模式 (带进度条和倍速) ---
  return (
    <div className={cn("flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1 border border-slate-200 dark:border-slate-800 transition-all shadow-sm", className)}>
      
      {/* 播放/暂停 */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => play(text)} 
        disabled={isLoading || !text}
        className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 text-blue-600 fill-current" />
        ) : (
          <Play className="h-4 w-4 text-slate-700 dark:text-slate-300 fill-current ml-0.5" />
        )}
      </Button>

      {/* 进度条 */}
      <div className={cn("flex items-center gap-2 transition-all duration-500 overflow-hidden", 
          duration > 0 ? "w-full md:w-64 opacity-100" : "w-0 opacity-0"
      )}>
        <span className="text-[10px] text-slate-500 font-mono w-9 text-right shrink-0 select-none">
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

        <span className="text-[10px] text-slate-400 font-mono w-9 shrink-0 select-none">
          {formatTime(duration)}
        </span>
      </div>

      {/* 倍速 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSpeed}
        className={cn("h-7 px-2 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-all overflow-hidden",
            duration > 0 ? "w-auto opacity-100 ml-1 border-l dark:border-slate-700 rounded-none" : "w-0 opacity-0 px-0"
        )}
        title="切换倍速"
      >
        {playbackRate}x
      </Button>
    </div>
  );
}