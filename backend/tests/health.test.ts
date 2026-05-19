import request from 'supertest';
import express from 'express';

const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Goal Setting API is running' });
});

describe('Health Endpoint', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Goal Setting API is running' });
  });
});
