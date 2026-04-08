// apps/desktop/src/components/AudioPlayer.tsx
/**
 * Audio player component for text-to-speech
 *
 * Integrates with Web TTS API for verse reading
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Loader2 } from 'lucide-react';
import { createAudioPlayerFromBlob, setupMediaSession, setupMediaSessionActions } from '@scripture-ai/native';

interface AudioPlayerProps {
  text: string;
  title?: string;
  reference?: string;
  apiBase?: string;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export function AudioPlayer({
  text,
  title = '圣经朗读',
  reference = '',
  apiBase = 'http://113.44.66.210:3000',
  onPlayStart,
  onPlayEnd,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<ReturnType<typeof createAudioPlayerFromBlob> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  // Setup media session
  useEffect(() => {
    if (title && reference) {
      setupMediaSession(title, reference, 'AI读圣经');
    }
  }, [title, reference]);

  const fetchAudio = useCallback(async (textToSpeak: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const player = createAudioPlayerFromBlob(audioBlob, {
        onPlay: () => {
          setIsPlaying(true);
          onPlayStart?.();
        },
        onPause: () => {
          setIsPlaying(false);
        },
        onEnded: () => {
          setIsPlaying(false);
          onPlayEnd?.();
        },
        onTimeUpdate: (time) => {
          setCurrentTime(time);
        },
        onError: (err) => {
          setError(err.message);
          setIsPlaying(false);
          setIsLoading(false);
        },
      });

      playerRef.current = player;
      setDuration(player.duration);
      setIsLoading(false);

      // Start playing
      await player.play();

      // Setup media session actions
      setupMediaSessionActions(
        () => player.play(),
        () => player.pause()
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : '播放失败');
      setIsLoading(false);
    }
  }, [apiBase, onPlayStart, onPlayEnd]);

  const handlePlay = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    } else if (text) {
      fetchAudio(text);
    }
  }, [isPlaying, text, fetchAudio]);

  const handleStop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
      playerRef.current = null;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      <div className="audio-controls">
        <button
          className="audio-btn"
          onClick={handlePlay}
          disabled={isLoading || !text}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        {isPlaying && (
          <button
            className="audio-btn stop"
            onClick={handleStop}
            title="停止"
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        <Volume2 className="w-4 h-4 audio-icon" />

        {duration > 0 && (
          <span className="audio-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
      </div>

      {error && (
        <div className="audio-error">{error}</div>
      )}
    </div>
  );
}