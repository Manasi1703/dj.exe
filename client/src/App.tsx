import { useState } from 'react';
import type { OrderedTrack } from './types';
import { analyzePlaylist } from './api';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { LoginButton } from './components/LoginButton';
import { PlaylistInput } from './components/PlaylistInput';
import { AnalyzingState } from './components/AnalyzingState';
import { SetOrderReview } from './components/SetOrderReview';
import { DJPlayer } from './components/DJPlayer';

type Stage = 'idle' | 'analyzing' | 'reviewing' | 'playing';

export function App() {
  const [stage, setStage] = useState<Stage>('idle');
  const [orderedTracks, setOrderedTracks] = useState<OrderedTrack[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const { isLoggedIn, isExchanging, error: authError, login, getFreshAccessToken } =
    useSpotifyAuth();

  const handleAnalyze = async (playlistUrl: string) => {
    const accessToken = await getFreshAccessToken();
    if (!accessToken) {
      setAnalyzeError('Not logged in — please log in again');
      return;
    }

    setStage('analyzing');
    setAnalyzeError(null);
    try {
      const tracks = await analyzePlaylist(playlistUrl, accessToken);
      setOrderedTracks(tracks);
      setStage('reviewing');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('idle');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="app">
        <LoginButton onLogin={login} isExchanging={isExchanging} error={authError} />
      </div>
    );
  }

  return (
    <div className="app">
      {stage === 'idle' && <PlaylistInput onSubmit={handleAnalyze} error={analyzeError} />}
      {stage === 'analyzing' && <AnalyzingState />}
      {stage === 'reviewing' && (
        <SetOrderReview orderedTracks={orderedTracks} onStart={() => setStage('playing')} />
      )}
      {stage === 'playing' && <DJPlayer orderedTracks={orderedTracks} />}
    </div>
  );
}
