// hooks/use-audio-player.ts
import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const play = useCallback(async (text: string) => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && !isLoading && audioRef.current.src && audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        return;
    }

    // 如果文本为空，不执行
    if (!text || !text.trim()) return;

    try {
      setIsLoading(true);
      // 停止之前的播放
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Playback Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, isLoading]);

  return { isPlaying, isLoading, play, stop };
}