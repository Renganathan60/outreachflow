import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('OutreachFlow REST API (Integration Tests)', () => {
  const app = createApp();
  let authToken = '';

  it('GET /api/health - should return healthy server status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('POST /api/auth/login - should authenticate admin and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@outreachflow.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');

    authToken = res.body.data.token;
  });

  it('GET /api/leads - should return paginated leads with valid JWT', async () => {
    const res = await request(app)
      .get('/api/leads?page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
  });

  it('GET /api/campaigns - should list all campaigns', async () => {
    const res = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/analytics/overview - should return dashboard KPI overview', async () => {
    const res = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalLeads).toBeGreaterThan(0);
    expect(res.body.data.priorityDistribution).toBeDefined();
  });

  it('GET /api/leads without token - should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
