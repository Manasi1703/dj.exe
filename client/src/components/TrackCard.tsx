import type { OrderedTrack } from '../types';

interface TrackCardProps {
  entry: OrderedTrack;
  position: number;
}

export function TrackCard({ entry, position }: TrackCardProps) {
  return (
    <li className="track-card">
      <span className="track-position">{position}</span>
      <div className="track-info">
        <p className="track-name">{entry.track.name}</p>
        <p className="track-artists">{entry.track.artists.join(', ')}</p>
      </div>
      <span className="track-reason-tag">{entry.reasonTag}</span>
    </li>
  );
}
