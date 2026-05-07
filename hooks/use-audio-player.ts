// hooks/use-audio-player.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';

type TtsMode = 'server' | 'browser';

export function useAudioPlayer(onFinished?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ttsMode, setTtsMode] = useState<TtsMode>('server');

  const cancelledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTextRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 使用 ref 追踪 isPlaying 和 playbackRate，避免 stale closure
  const isPlayingRef = useRef(false);
  const playbackRateRef = useRef(1);
  const onFinishedRef = useRef(onFinished);

  // 同步 ref 和 state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  // 清理浏览器 TTS 资源
  const cleanupBrowserTts = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
      cleanupBrowserTts();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, [cleanupBrowserTts]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanupBrowserTts();
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(0);
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
  }, [cleanupBrowserTts]);

  const pause = useCallback(() => {
    if (ttsMode === 'browser') {
      speechSynthesis.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [ttsMode]);

  const seek = useCallback((time: number) => {
    if (ttsMode === 'browser') return; // 浏览器 TTS 不支持 seek
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [ttsMode]);

  const setRate = useCallback((rate: number) => {
    if (ttsMode === 'browser' && utteranceRef.current) {
      utteranceRef.current.rate = rate;
      // 需要重新开始才能生效
      const text = currentTextRef.current;
      if (text && isPlayingRef.current) {
        cleanupBrowserTts();
        // 重新播放会在 playBrowserTts 中处理
      }
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  }, [ttsMode, cleanupBrowserTts]);

  // 浏览器原生 TTS 播放
  const playBrowserTts = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return false;

    cleanupBrowserTts();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // 设置中文语音
    const voices = speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh')) || voices[0];
    if (zhVoice) utterance.voice = zhVoice;
    utterance.lang = 'zh-CN';
    utterance.rate = playbackRateRef.current;

    // 模拟进度更新
    const estimatedDuration = Math.max(text.length / 5, 1); // 粗略估算
    let elapsed = 0;
    setDuration(estimatedDuration);

    progressTimerRef.current = setInterval(() => {
      if (isPlayingRef.current) {
        elapsed += 0.1 * playbackRateRef.current;
        setCurrentTime(Math.min(elapsed, estimatedDuration));
      }
    }, 100);

    utterance.onend = () => {
      clearInterval(progressTimerRef.current!);
      progressTimerRef.current = null;
      setIsPlaying(false);
      setCurrentTime(0);

      if (cancelledRef.current) return;

      const { readingPlanContext, advancePlanStep } = useBibleStore.getState();
      if (readingPlanContext) {
          advancePlanStep();
          return;
      }
      if (onFinishedRef.current) onFinishedRef.current();
    };

    utterance.onerror = (e) => {
      console.error('Browser TTS Error:', e);
      clearInterval(progressTimerRef.current!);
      progressTimerRef.current = null;
      setIsPlaying(false);
      setIsLoading(false);
    };

    // Media Session 支持
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
          title: "圣经朗读",
          artist: "浏览器语音",
          album: "Audio Bible",
      });
      navigator.mediaSession.setActionHandler('play', () => {
          speechSynthesis.resume();
          setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
          speechSynthesis.pause();
          setIsPlaying(false);
      });
    }

    speechSynthesis.speak(utterance);
    return true;
  }, [cleanupBrowserTts]);

  const play = useCallback(async (text: string) => {
    if (!text) return;

    // 场景1：点击的是当前正在播放/暂停的内容 -> 仅切换状态
    if (currentTextRef.current === text && (audioRef.current || utteranceRef.current)) {
      if (isPlayingRef.current) {
        if (ttsMode === 'browser') {
          speechSynthesis.pause();
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        if (ttsMode === 'browser') {
          speechSynthesis.resume();
        } else if (audioRef.current) {
          audioRef.current.playbackRate = playbackRateRef.current;
          audioRef.current.play().catch(console.error);
        }
        setIsPlaying(true);
      }
      return;
    }

    // 场景2：内容变化（切换章节），重新加载
    try {
      cancelledRef.current = false;
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // 停止旧音频
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
      cleanupBrowserTts();

      currentTextRef.current = text;

      // 尝试服务器 TTS
      try {
        const { ttsVoice } = useBibleStore.getState();
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: ttsVoice }),
        });

        if (!response.ok) throw new Error('TTS request failed');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        setTtsMode('server');

        // Media Session
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

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };

        const thisCancelled = cancelledRef;
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);

          if (thisCancelled.current) return;

          const { readingPlanContext, advancePlanStep } = useBibleStore.getState();
          if (readingPlanContext) {
              advancePlanStep();
              return;
          }

          if (onFinishedRef.current) onFinishedRef.current();
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

      } catch (serverError) {
        // 服务器 TTS 失败，回退到浏览器原生 TTS
        console.warn('Server TTS failed, falling back to browser TTS:', serverError);
        setTtsMode('browser');

        if (!playBrowserTts(text)) {
          throw new Error('Browser TTS not available');
        }

        setIsPlaying(true);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }

    } catch (error) {
      console.error('Playback Error:', error);
      currentTextRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [cleanupBrowserTts, playBrowserTts, ttsMode]);

  return {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    playbackRate,
    ttsMode,
    play,
    pause,
    stop,
    seek,
    setRate
  };
}
