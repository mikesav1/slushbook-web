import request from 'supertest';
import app from '../src/index';
import db from '../src/db';
import * as dbService from '../src/services/db.service';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-token';

beforeAll(() => {
  // Seed test data
  dbService.upsertMapping({ id: 'test-mapping', name: 'Test Product' });
  dbService.upsertOption({
    id: 'test-option-active',
    mappingId: 'test-mapping',
    supplier: 'power',
    title: 'Test Product',
    url: 'https://example.com/product',
    status: 'active'
  });
  dbService.upsertOption({
    id: 'test-option-inactive',
    mappingId: 'test-mapping-2',
    supplier: 'power',
    title: 'Inactive Product',
    url: 'https://example.com/inactive',
    status: 'inactive'
  });
});

afterAll(() => {
  db.close();
});

describe('Redirect Service Tests', () => {
  
  test('GET /go/:mappingId should redirect to active option', async () => {
    const response = await request(app)
      .get('/go/test-mapping')
      .expect(302);
    
    expect(response.headers.location).toContain('https://example.com/product');
    expect(response.headers.location).toContain('utm_source=slushbook');
  });
  
  test('GET /go/:mappingId should fallback when no active option', async () => {
    const response = await request(app)
      .get('/go/nonexistent-mapping')
      .expect(302);
    
    expect(response.headers.location).toContain('power.dk');
    expect(response.headers.location).toContain('smagsekstrakter');
  });
  
  test('POST /admin/mapping should create/update mapping with options', async () => {
    const response = await request(app)
      .post('/admin/mapping')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        mapping: { id: 'new-mapping', name: 'New Product', ean: '123456' },
        options: [
          {
            id: 'new-option',
            supplier: 'power',
            title: 'New Product',
            url: 'https://example.com/new',
            status: 'active'
          }
        ]
      })
      .expect(200);
    
    expect(response.body.mapping.id).toBe('new-mapping');
    expect(response.body.options.length).toBeGreaterThan(0);
    expect(response.body.options[0].id).toBe('new-option');
  });
  
  test('PATCH /admin/option/:id should update option status', async () => {
    const response = await request(app)
      .patch('/admin/option/test-option-active')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ status: 'inactive' })
      .expect(200);
    
    expect(response.body.status).toBe('inactive');
    
    // Verify redirect now falls back
    const redirectResponse = await request(app)
      .get('/go/test-mapping')
      .expect(302);
    
    expect(redirectResponse.headers.location).toContain('power.dk');
  });
  
  test('GET /health should return ok', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.ok).toBe(true);
    expect(response.body.db).toBe(true);
  });
  
  test('Admin routes should require auth', async () => {
    await request(app)
      .post('/admin/mapping')
      .send({ mapping: { id: 'test', name: 'Test' } })
      .expect(401);
  });
  
});
