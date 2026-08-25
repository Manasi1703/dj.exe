import type { OrderedTrack } from '../types';

interface NowPlayingProps {
  current: OrderedTrack;
  next?: OrderedTrack;
}

export function NowPlaying({ current, next }: NowPlayingProps) {
  return (
    <div className="now-playing">
      <div className="now-playing-current">
        <p className="now-playing-label">Now Playing</p>
        <h2>{current.track.name}</h2>
        <p>{current.track.artists.join(', ')}</p>
      </div>
      {next && (
        <div className="now-playing-next">
          <p className="now-playing-label">Up Next — {next.reasonTag}</p>
          <p>
            {next.track.name} — {next.track.artists.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
