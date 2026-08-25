import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { playlistRouter } from './routes/playlist.js';

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/playlist', playlistRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`dj.exe server listening on http://127.0.0.1:${config.port}`);
});
