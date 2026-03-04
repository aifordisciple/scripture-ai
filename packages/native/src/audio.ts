// packages/native/src/audio.ts
// Native audio playback module

export interface AudioPlayer {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  setRate(rate: number): void;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

export interface AudioCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: Error) => void;
}

// Create audio player from URL
export function createAudioPlayer(
  url: string,
  callbacks: AudioCallbacks = {}
): AudioPlayer {
  const audio = new Audio(url);
  let isPlaying = false;
  
  audio.addEventListener('play', () => {
    isPlaying = true;
    callbacks.onPlay?.();
  });
  
  audio.addEventListener('pause', () => {
    isPlaying = false;
    callbacks.onPause?.();
  });
  
  audio.addEventListener('ended', () => {
    isPlaying = false;
    callbacks.onEnded?.();
  });
  
  audio.addEventListener('timeupdate', () => {
    callbacks.onTimeUpdate?.(audio.currentTime);
  });
  
  audio.addEventListener('error', (e) => {
    callbacks.onError?.(new Error('Audio playback error'));
  });
  
  return {
    get isPlaying() { return isPlaying; },
    get duration() { return audio.duration || 0; },
    get currentTime() { return audio.currentTime; },
    
    async play() {
      await audio.play();
    },
    
    pause() {
      audio.pause();
    },
    
    stop() {
      audio.pause();
      audio.currentTime = 0;
    },
    
    seek(time: number) {
      audio.currentTime = time;
    },
    
    setRate(rate: number) {
      audio.playbackRate = rate;
    }
  };
}

// Create audio player from blob
export function createAudioPlayerFromBlob(
  blob: Blob,
  callbacks: AudioCallbacks = {}
): AudioPlayer {
  const url = URL.createObjectURL(blob);
  const player = createAudioPlayer(url, callbacks);
  
  // Clean up URL when stopped
  const originalStop = player.stop;
  player.stop = () => {
    originalStop.call(player);
    URL.revokeObjectURL(url);
  };
  
  return player;
}

// Set up media session for lock screen controls
export function setupMediaSession(
  title: string,
  artist: string,
  album: string,
  artwork?: string
): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  
  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist,
    album,
    ...(artwork && { artwork: [{ src: artwork, sizes: '512x512', type: 'image/png' }] })
  });
}

// Set up media session action handlers
export function setupMediaSessionActions(
  onPlay: () => void,
  onPause: () => void,
  onSeekBackward?: (seconds: number) => void,
  onSeekForward?: (seconds: number) => void
): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }
  
  navigator.mediaSession.setActionHandler('play', onPlay);
  navigator.mediaSession.setActionHandler('pause', onPause);
  
  if (onSeekBackward) {
    navigator.mediaSession.setActionHandler('seekbackward', () => onSeekBackward(10));
  }
  
  if (onSeekForward) {
    navigator.mediaSession.setActionHandler('seekforward', () => onSeekForward(10));
  }
}
