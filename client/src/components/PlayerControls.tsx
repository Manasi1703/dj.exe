interface PlayerControlsProps {
  isPlaying: boolean;
  canSkipPrevious: boolean;
  canSkipNext: boolean;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
}

export function PlayerControls({
  isPlaying,
  canSkipPrevious,
  canSkipNext,
  onPlayPause,
  onSkipNext,
  onSkipPrevious,
}: PlayerControlsProps) {
  return (
    <div className="player-controls">
      <button onClick={onSkipPrevious} disabled={!canSkipPrevious}>
        ⏮ Prev
      </button>
      <button onClick={onPlayPause}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
      <button onClick={onSkipNext} disabled={!canSkipNext}>
        Next ⏭
      </button>
    </div>
  );
}
