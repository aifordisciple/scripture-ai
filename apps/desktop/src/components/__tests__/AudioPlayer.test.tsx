// apps/desktop/src/components/__tests__/AudioPlayer.test.tsx
/**
 * Tests for AudioPlayer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioPlayer } from '../AudioPlayer';

// Mock fetch for TTS API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio data'], { type: 'audio/mpeg' })),
    });
  });

  it('renders play button when not playing', () => {
    render(
      <AudioPlayer
        text="Test verse text"
        title="创世记"
        reference="创世记 1章"
      />
    );

    const playButton = screen.getByRole('button', { name: /播放/i });
    expect(playButton).toBeInTheDocument();
  });

  it('disables play button when no text provided', () => {
    render(
      <AudioPlayer
        text=""
        title="创世记"
        reference="创世记 1章"
      />
    );

    const playButton = screen.getByRole('button', { name: /播放/i });
    expect(playButton).toBeDisabled();
  });

  it('shows loading state when fetching audio', async () => {
    render(
      <AudioPlayer
        text="Test verse text"
        title="创世记"
        reference="创世记 1章"
      />
    );

    const playButton = screen.getByRole('button', { name: /播放/i });
    fireEvent.click(playButton);

    // Should show loading spinner
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://aidu.app/api/tts',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test verse text'),
        })
      );
    });
  });

  it('displays error message on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AudioPlayer
        text="Test verse text"
        title="创世记"
        reference="创世记 1章"
      />
    );

    const playButton = screen.getByRole('button', { name: /播放/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByText(/播放失败|Network error/i)).toBeInTheDocument();
    });
  });

  it('calls onPlayStart when audio starts playing', async () => {
    const onPlayStart = vi.fn();

    render(
      <AudioPlayer
        text="Test verse text"
        title="创世记"
        reference="创世记 1章"
        onPlayStart={onPlayStart}
      />
    );

    const playButton = screen.getByRole('button', { name: /播放/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('uses custom apiBase when provided', async () => {
    render(
      <AudioPlayer
        text="Test verse text"
        title="创世记"
        reference="创世记 1章"
        apiBase="https://custom.api.com"
      />
    );

    const playButton = screen.getByRole('button', { name: /播放/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/api/tts',
        expect.any(Object)
      );
    });
  });
});