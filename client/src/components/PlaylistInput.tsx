import { useState } from 'react';

interface PlaylistInputProps {
  onSubmit: (playlistUrl: string) => void;
  error?: string | null;
}

export function PlaylistInput({ onSubmit, error }: PlaylistInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <form className="playlist-input" onSubmit={handleSubmit}>
      <h1>dj.exe</h1>
      <p>Paste a public Spotify playlist link and get a DJ set out of it.</p>
      <input
        type="text"
        placeholder="https://open.spotify.com/playlist/..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Analyze</button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}
