# dj.exe

Log in with Spotify, paste a link to one of **your own** playlists, and it becomes a DJ set: every track's vibe (tempo, energy, key, valence) is assessed, the playlist is reordered for a smooth energy/harmonic flow, and it plays back through Spotify's embedded player.

**Why login is required:** Spotify's API (Development Mode) only lets an app read the track contents of playlists the logged-in user themselves owns — not arbitrary public playlists, even with a valid access token. Confirmed by direct testing. The only way past this without login is Spotify's "Extended Quota Mode" app review process.

**Known limitations, by design:**
- Only playlists you own work. Playlists you follow or that belong to someone else will show a friendly error.
- Transitions are hard cuts, not crossfades — Spotify doesn't expose raw audio access in-browser. The "DJ" intelligence is entirely in the *track ordering*.
- Each track plays a ~40 second chunk starting 35% into the song, not the whole thing. No API exposes real chorus/hook timestamps (Spotify's own audio-analysis is locked down same as audio-features, and ReccoBeats has no section data), so this is a heuristic — it usually lands past the intro near a hook, not a guaranteed chorus.
- Playback uses Spotify's embed player. Full tracks play if your browser already has an active Spotify session; otherwise you get Spotify's own 30-second preview + "Play on Spotify" prompt.

## Setup

1. Create a Spotify app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). Check **Web API** only. Add `http://127.0.0.1:5173/callback` as a Redirect URI.
2. `cp .env.example .env` (root) and fill in `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`.
3. `cp client/.env.example client/.env` and fill in `VITE_SPOTIFY_CLIENT_ID` (same client ID).
4. `npm install`
5. `npm run dev` — runs server (`:3001`) and client (`:5173`) together.

## Testing

- `npm test` — runs the DJ sequencing algorithm's unit tests (pure functions, no network).
- Manual E2E: log in, paste a playlist you own, review the computed order, "Start the Set" — playback should start and auto-advance at track end with no crossfade.
