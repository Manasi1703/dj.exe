import { useCallback, useEffect, useState } from 'react';
import { exchangeAuthCode, refreshAuthToken } from '../api';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative'].join(' ');

const VERIFIER_STORAGE_KEY = 'dj_exe_pkce_verifier';
const TOKEN_STORAGE_KEY = 'dj_exe_tokens';

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function deriveCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(new Uint8Array(digest));
}

function loadStoredTokens(): StoredTokens | null {
  const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

function saveStoredTokens(tokens: StoredTokens) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function useSpotifyAuth() {
  const [tokens, setTokens] = useState<StoredTokens | null>(() => loadStoredTokens());
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {
    const verifier = generateCodeVerifier();
    sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
    const challenge = await deriveCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }, []);

  const completeLogin = useCallback(async (code: string) => {
    const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
    if (!verifier) {
      setError('Missing PKCE verifier — please log in again');
      return;
    }

    setIsExchanging(true);
    setError(null);
    try {
      const token = await exchangeAuthCode(code, verifier);
      const next: StoredTokens = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + (token.expires_in - 60) * 1000,
      };
      saveStoredTokens(next);
      setTokens(next);
      sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsExchanging(false);
    }
  }, []);

  const getFreshAccessToken = useCallback(async (): Promise<string | null> => {
    const current = loadStoredTokens();
    if (!current) return null;

    if (current.expiresAt > Date.now()) {
      return current.accessToken;
    }

    if (!current.refreshToken) return null;

    const token = await refreshAuthToken(current.refreshToken);
    const next: StoredTokens = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? current.refreshToken,
      expiresAt: Date.now() + (token.expires_in - 60) * 1000,
    };
    saveStoredTokens(next);
    setTokens(next);
    return next.accessToken;
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && !tokens) {
      completeLogin(code);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoggedIn: tokens !== null,
    isExchanging,
    error,
    login,
    getFreshAccessToken,
  };
}
