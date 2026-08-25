import { Router } from 'express';
import { exchangeCodeForToken, refreshAccessToken } from '../pkce.js';

export const authRouter = Router();

authRouter.post('/callback', async (req, res) => {
  const { code, codeVerifier } = req.body as { code?: string; codeVerifier?: string };

  if (!code || !codeVerifier) {
    res.status(400).json({ error: 'code and codeVerifier are required' });
    return;
  }

  try {
    const token = await exchangeCodeForToken(code, codeVerifier);
    res.json(token);
  } catch (err) {
    res.status(502).json({ error: 'Failed to exchange authorization code', detail: String(err) });
  }
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  try {
    const token = await refreshAccessToken(refreshToken);
    res.json(token);
  } catch (err) {
    res.status(502).json({ error: 'Failed to refresh token', detail: String(err) });
  }
});
