import type { OrderedTrack } from '../types';
import { TrackCard } from './TrackCard';

interface SetOrderReviewProps {
  orderedTracks: OrderedTrack[];
  onStart: () => void;
}

export function SetOrderReview({ orderedTracks, onStart }: SetOrderReviewProps) {
  return (
    <div className="set-order-review">
      <h2>Your DJ Set ({orderedTracks.length} tracks)</h2>
      <ol className="track-list">
        {orderedTracks.map((entry, i) => (
          <TrackCard key={entry.track.id} entry={entry} position={i + 1} />
        ))}
      </ol>
      <button className="start-set-button" onClick={onStart}>
        Start the Set
      </button>
    </div>
  );
}
