import { config } from './config.js';
import type { SpotifyTokenResponse } from './spotify/types.js';

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<SpotifyTokenResponse> {
  const basicAuth = Buffer.from(
    `${config.spotifyClientId}:${config.spotifyClientSecret}`,
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.spotifyRedirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Spotify token exchange failed: ${res.status}`);
  }

  return (await res.json()) as SpotifyTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const basicAuth = Buffer.from(
    `${config.spotifyClientId}:${config.spotifyClientSecret}`,
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${res.status}`);
  }

  return (await res.json()) as SpotifyTokenResponse;
}
