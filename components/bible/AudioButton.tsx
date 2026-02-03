// components/bible/AudioButton.tsx
"use client";

import { useAudioPlayer } from "@/hooks/use-audio-player";
import { Button } from "@/components/ui/button";
import { Loader2, Volume2, PauseCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioButtonProps {
  text: string;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  disabled?: boolean;
}

export function AudioButton({ text, className, variant = "ghost", size = "icon", label, disabled }: AudioButtonProps) {
  const { isPlaying, isLoading, play } = useAudioPlayer();

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={(e) => {
        e.stopPropagation();
        play(text);
      }} 
      disabled={disabled || isLoading}
      className={cn("gap-2 transition-all", className)}
      title="朗读"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <PauseCircle className="h-4 w-4 text-blue-600 animate-pulse" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {label && <span>{label}</span>}
    </Button>
  );
}