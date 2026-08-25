import { useEffect, useRef, useState } from 'react';

interface PlaybackUpdatePayload {
  data: {
    position: number;
    duration: number;
    isPaused: boolean;
    isBuffering: boolean;
  };
}

interface EmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  addListener: (event: 'ready' | 'playback_update', cb: (e: PlaybackUpdatePayload) => void) => void;
}

interface IFrameApi {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string; height?: number },
    callback: (controller: EmbedController) => void,
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: IFrameApi) => void;
  }
}

const SDK_SCRIPT_SRC = 'https://open.spotify.com/embed/iframe-api/v1';
const NEAR_END_THRESHOLD_MS = 300;

// No API exposes real chorus/hook timestamps (Spotify's own audio-analysis is
// locked down same as audio-features; ReccoBeats has no section data either).
// Heuristic: skip the intro, play a fixed-length chunk from roughly where a
// hook usually lands, then cut — same as a DJ dropping into a track's peak.
const INTRO_SKIP_RATIO = 0.35;
const CHUNK_DURATION_MS = 40_000;

function loadSdkScript(): void {
  if (document.querySelector(`script[src="${SDK_SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = SDK_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

interface UseSpotifyEmbedOptions {
  containerRef: React.RefObject<HTMLElement>;
  initialTrackId: string;
  onSegmentEnd: () => void;
}

export function useSpotifyEmbed({
  containerRef,
  initialTrackId,
  onSegmentEnd,
}: UseSpotifyEmbedOptions) {
  const [isReady, setIsReady] = useState(false);
  const controllerRef = useRef<EmbedController | null>(null);
  const hasFiredEndRef = useRef(false);
  const hasSeekedRef = useRef(false);
  const chunkStartMsRef = useRef(0);

  useEffect(() => {
    loadSdkScript();

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      if (!containerRef.current) return;

      IFrameAPI.createController(
        containerRef.current,
        { uri: `spotify:track:${initialTrackId}`, width: '100%', height: 152 },
        (controller) => {
          controllerRef.current = controller;
          setIsReady(true);

          controller.addListener('playback_update', (e) => {
            const { position, duration, isPaused } = e.data;
            if (duration === 0) return;

            if (!hasSeekedRef.current) {
              hasSeekedRef.current = true;
              chunkStartMsRef.current = Math.floor(duration * INTRO_SKIP_RATIO);
              controller.seek(chunkStartMsRef.current / 1000);
              return;
            }

            const elapsedInChunk = position - chunkStartMsRef.current;
            const remainingInTrack = duration - position;
            const chunkFinished =
              elapsedInChunk >= CHUNK_DURATION_MS || remainingInTrack <= NEAR_END_THRESHOLD_MS;

            if (!isPaused && chunkFinished) {
              if (!hasFiredEndRef.current) {
                hasFiredEndRef.current = true;
                onSegmentEnd();
              }
            } else {
              hasFiredEndRef.current = false;
            }
          });
        },
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrack = (trackId: string) => {
    hasFiredEndRef.current = false;
    hasSeekedRef.current = false;
    chunkStartMsRef.current = 0;
    controllerRef.current?.loadUri(`spotify:track:${trackId}`);
    controllerRef.current?.play();
  };

  const play = () => controllerRef.current?.play();
  const pause = () => controllerRef.current?.pause();

  return { isReady, loadTrack, play, pause };
}
