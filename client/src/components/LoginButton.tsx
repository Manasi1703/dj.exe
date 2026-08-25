interface LoginButtonProps {
  onLogin: () => void;
  isExchanging: boolean;
  error?: string | null;
}

export function LoginButton({ onLogin, isExchanging, error }: LoginButtonProps) {
  return (
    <div className="login-gate">
      <h1>dj.exe</h1>
      <p>Log in with Spotify to turn one of your playlists into a DJ set.</p>
      <button className="login-button" onClick={onLogin} disabled={isExchanging}>
        {isExchanging ? 'Logging in…' : 'Log in with Spotify'}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
