import { describe, it, expect, beforeAll } from 'vitest';
import app from './index';

const validHeartbeat = {
  tool: 'vscode',
  timestamp: Date.now(),
  activity_type: 'coding',
  project: 'test-project',
  file: 'index.ts',
  language: 'typescript',
};

const devAuthHeader = { Authorization: 'Bearer dt_dev_key' };

describe('API Integration', () => {
  describe('GET /', () => {
    it('returns API info', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.name).toBe('DevTime API');
      expect(body.version).toBe('v1');
    });
  });

  describe('GET /health', () => {
    it('returns health status', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('POST /v1/heartbeat', () => {
    it('rejects requests without auth', async () => {
      const res = await app.request('/v1/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validHeartbeat),
      });

      expect(res.status).toBe(401);
    });

    it('rejects invalid API key format', async () => {
      const res = await app.request('/v1/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid_key',
        },
        body: JSON.stringify(validHeartbeat),
      });

      expect(res.status).toBe(401);
    });

    it('accepts valid heartbeat with dev key', async () => {
      const res = await app.request('/v1/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...devAuthHeader,
        },
        body: JSON.stringify(validHeartbeat),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.received).toBe(1);
    });

    it('rejects invalid heartbeat data', async () => {
      const res = await app.request('/v1/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...devAuthHeader,
        },
        body: JSON.stringify({ tool: 'vscode' }),
      });

      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid JSON', async () => {
      const res = await app.request('/v1/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...devAuthHeader,
        },
        body: 'not json',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /v1/heartbeat/batch', () => {
    it('accepts batch of heartbeats', async () => {
      const res = await app.request('/v1/heartbeat/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...devAuthHeader,
        },
        body: JSON.stringify({
          heartbeats: [
            { ...validHeartbeat, timestamp: Date.now() - 60000 },
            { ...validHeartbeat, timestamp: Date.now() },
          ],
        }),
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.received).toBe(2);
    });

    it('rejects empty batch', async () => {
      const res = await app.request('/v1/heartbeat/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...devAuthHeader,
        },
        body: JSON.stringify({ heartbeats: [] }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/stats', () => {
    it('returns stats with default range', async () => {
      const res = await app.request('/v1/stats', {
        headers: devAuthHeader,
      });

      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('total_seconds');
      expect(body).toHaveProperty('by_tool');
      expect(body).toHaveProperty('by_project');
      expect(body).toHaveProperty('by_language');
      expect(body).toHaveProperty('by_day');
    });

    it('accepts range parameter', async () => {
      const res = await app.request('/v1/stats?range=today', {
        headers: devAuthHeader,
      });

      expect(res.status).toBe(200);
    });

    it('accepts filter parameters', async () => {
      const res = await app.request('/v1/stats?project=my-project&tool=vscode', {
        headers: devAuthHeader,
      });

      expect(res.status).toBe(200);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown routes outside v1', async () => {
      const res = await app.request('/unknown-route');
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe('Not found');
    });

    it('returns 401 for unknown routes inside v1 without auth', async () => {
      const res = await app.request('/v1/unknown');
      expect(res.status).toBe(401);
    });
  });
});
