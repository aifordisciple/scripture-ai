// hooks/use-audio-player.ts
import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioPlayer(onFinished?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTextRef = useRef<string | null>(null);

  // 组件卸载时清理
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
    setCurrentTime(0);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // [新增] 跳转进度
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // [新增] 设置倍速
  const setRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  }, []);

  const play = useCallback(async (text: string) => {
    if (!text) return;

    // 场景1：点击的是当前正在播放/暂停的内容 -> 仅切换状态
    if (currentTextRef.current === text && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // 恢复播放时，确保倍速正确
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }

    // 场景2：内容变化（切换章节），重新加载
    try {
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // 停止旧音频
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      currentTextRef.current = text;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // 绑定事件：获取时长
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
      
      // 绑定事件：更新进度
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      // [关键] 绑定事件：播放结束
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (onFinished) onFinished(); // 触发回调
      };

      audio.onerror = (e) => {
        console.error("Audio Error:", e);
        setIsLoading(false);
        setIsPlaying(false);
      };

      audioRef.current = audio;
      audio.playbackRate = playbackRate; // 应用当前倍速
      
      await audio.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Playback Error:', error);
      currentTextRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, playbackRate, onFinished]);

  return { 
    isPlaying, 
    isLoading, 
    duration, 
    currentTime, 
    playbackRate,
    play, 
    pause, 
    stop, 
    seek, 
    setRate 
  };
}