// hooks/use-audio-player.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';

export function useAudioPlayer(onFinished?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const cancelledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTextRef = useRef<string | null>(null);

  // 使用 ref 追踪 isPlaying 和 playbackRate，避免 stale closure
  const isPlayingRef = useRef(false);
  const playbackRateRef = useRef(1);
  const onFinishedRef = useRef(onFinished);

  // 同步 ref 和 state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // 撤销ObjectURL防止内存泄漏
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
      // 清除锁屏 Media Session handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.playbackState = 'none';
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
    // 清除锁屏控制
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

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
      // 使用 ref 读取实时状态，避免 stale closure
      if (isPlayingRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRateRef.current;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }

    // 场景2：内容变化（切换章节），重新加载
    try {
      cancelledRef.current = false; // 重置取消标志
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // 停止旧音频并撤销ObjectURL
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
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

      // [修复] 设置 Media Session (关键：允许锁屏播放)
      // handler 内使用 audioRef.current 代替闭包变量，避免引用旧音频
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: "圣经朗读",
            artist: "AI读",
            album: "Audio Bible",
        });

        navigator.mediaSession.setActionHandler('play', () => {
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
              setIsPlaying(true);
            }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
        });
      }

      // 绑定事件：获取时长
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      // 绑定事件：更新进度
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      // 绑定事件：播放结束
      // 使用当前请求的 cancelledRef 判断是否被取消
      const thisCancelled = cancelledRef;
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);

        // 如果音频已被取消（用户切换了章节），不触发自动播放
        if (thisCancelled.current) return;

        // [新增] 拦截：如果处于计划流中，按照计划步骤前进
        const { readingPlanContext, advancePlanStep } = useBibleStore.getState();
        if (readingPlanContext) {
            advancePlanStep();
            return;
        }

        if (onFinishedRef.current) onFinishedRef.current(); // 触发回调，自动播放下一章
      };

      audio.onerror = (e) => {
        console.error("Audio Error:", e);
        setIsLoading(false);
        setIsPlaying(false);
      };

      audioRef.current = audio;
      audio.playbackRate = playbackRateRef.current;

      await audio.play();
      setIsPlaying(true);

      if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
      }

    } catch (error) {
      console.error('Playback Error:', error);
      currentTextRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, []); // 空依赖数组 - 通过 ref 访问所有状态

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
