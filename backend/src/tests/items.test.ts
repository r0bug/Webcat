import request from 'supertest';
import app from '../app';
import sequelize from '../config/database';
import { User, Item } from '../models';

describe('Item Endpoints', () => {
  let vendorToken: string;
  let vendorId: number;
  let adminToken: string;
  let itemId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create vendor user
    const vendorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Vendor',
        email: 'vendor@test.com',
        password: 'Test123!',
        userType: 'Vendor'
      });
    vendorToken = vendorRes.body.token;
    vendorId = vendorRes.body.user.userId;

    // Create admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'Test123!',
        userType: 'Admin'
      });
    adminToken = adminRes.body.token;

    // Update admin user type manually (since registration doesn't allow Admin)
    await User.update({ userType: 'Admin' }, { where: { email: 'admin@test.com' } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          title: 'Test Item',
          description: 'This is a test item',
          price: 99.99,
          location: 'A-12',
          contactInfo: 'Call 555-1234'
        });

      expect(res.status).toBe(201);
      expect(res.body.item).toHaveProperty('title', 'Test Item');
      expect(res.body.item).toHaveProperty('vendorId', vendorId);
      expect(res.body.item).toHaveProperty('urlSlug');
      itemId = res.body.item.itemId;
    });

    it('should not create item without authentication', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({
          title: 'Another Item',
          description: 'Should fail'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/items', () => {
    it('should get all items', async () => {
      const res = await request(app)
        .get('/api/items');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should filter items by status', async () => {
      const res = await request(app)
        .get('/api/items?status=Available');

      expect(res.status).toBe(200);
      expect(res.body.data.every((item: any) => item.status === 'Available')).toBe(true);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/items?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 10);
    });
  });

  describe('GET /api/items/id/:id', () => {
    it('should get item by ID', async () => {
      const res = await request(app)
        .get(`/api/items/id/${itemId}`);

      expect(res.status).toBe(200);
      expect(res.body.item).toHaveProperty('itemId', itemId);
      expect(res.body.item).toHaveProperty('title', 'Test Item');
    });

    it('should increment view count', async () => {
      const beforeRes = await request(app)
        .get(`/api/items/id/${itemId}`);
      const beforeCount = beforeRes.body.item.viewCount;

      await request(app)
        .get(`/api/items/id/${itemId}`);

      const afterRes = await request(app)
        .get(`/api/items/id/${itemId}`);
      const afterCount = afterRes.body.item.viewCount;

      expect(afterCount).toBe(beforeCount + 2); // +2 because we made 2 more requests
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update own item', async () => {
      const res = await request(app)
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          title: 'Updated Item',
          price: 149.99
        });

      expect(res.status).toBe(200);
      expect(res.body.item).toHaveProperty('title', 'Updated Item');
      expect(res.body.item).toHaveProperty('price', '149.99');
    });

    it('should not update another vendor\'s item', async () => {
      // Create another vendor
      const otherVendorRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other Vendor',
          email: 'other@test.com',
          password: 'Test123!',
          userType: 'Vendor'
        });

      const res = await request(app)
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${otherVendorRes.body.token}`)
        .send({
          title: 'Should not work'
        });

      expect(res.status).toBe(403);
    });

    it('admin should be able to update any item', async () => {
      const res = await request(app)
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Pending'
        });

      expect(res.status).toBe(200);
      expect(res.body.item).toHaveProperty('status', 'Pending');
    });
  });

  describe('POST /api/items/:id/tags', () => {
    it('should add tags to item', async () => {
      const res = await request(app)
        .post(`/api/items/${itemId}/tags`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          tags: ['furniture', 'vintage', 'wood']
        });

      expect(res.status).toBe(200);
      expect(res.body.item.tags).toHaveLength(3);
      expect(res.body.item.tags.some((tag: any) => tag.tagName === 'furniture')).toBe(true);
    });
  });

  describe('GET /api/items/my-items', () => {
    it('should get vendor\'s own items', async () => {
      const res = await request(app)
        .get('/api/items/my-items')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((item: any) => item.vendorId === vendorId)).toBe(true);
    });
  });
});