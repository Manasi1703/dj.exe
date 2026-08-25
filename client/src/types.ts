export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
  popularity: number;
}

export interface OrderedTrack {
  track: SpotifyTrack;
  reasonTag: string;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
