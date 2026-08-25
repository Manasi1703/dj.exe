import { useRef, useState } from 'react';
import type { OrderedTrack } from '../types';
import { useSpotifyEmbed } from '../hooks/useSpotifyEmbed';
import { NowPlaying } from './NowPlaying';
import { PlayerControls } from './PlayerControls';

interface DJPlayerProps {
  orderedTracks: OrderedTrack[];
}

export function DJPlayer({ orderedTracks }: DJPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const advanceToNext = () => {
    const i = currentIndexRef.current;
    if (i >= orderedTracks.length - 1) return;
    const next = i + 1;
    loadTrack(orderedTracks[next].track.id);
    setCurrentIndex(next);
  };

  const { isReady, loadTrack, play, pause } = useSpotifyEmbed({
    containerRef,
    initialTrackId: orderedTracks[0].track.id,
    onSegmentEnd: advanceToNext,
  });

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
    } else {
      play();
      setIsPlaying(true);
    }
  };

  const handleSkipNext = () => {
    if (currentIndex >= orderedTracks.length - 1) return;
    const next = currentIndex + 1;
    loadTrack(orderedTracks[next].track.id);
    setCurrentIndex(next);
    setIsPlaying(true);
  };

  const handleSkipPrevious = () => {
    if (currentIndex <= 0) return;
    const prev = currentIndex - 1;
    loadTrack(orderedTracks[prev].track.id);
    setCurrentIndex(prev);
    setIsPlaying(true);
  };

  return (
    <div className="dj-player">
      <NowPlaying current={orderedTracks[currentIndex]} next={orderedTracks[currentIndex + 1]} />
      <div ref={containerRef} className="embed-container" />
      {!isReady && <p className="dj-player-status">Loading player…</p>}
      <PlayerControls
        isPlaying={isPlaying}
        canSkipPrevious={currentIndex > 0}
        canSkipNext={currentIndex < orderedTracks.length - 1}
        onPlayPause={handlePlayPause}
        onSkipNext={handleSkipNext}
        onSkipPrevious={handleSkipPrevious}
      />
    </div>
  );
}
