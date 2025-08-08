import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

interface User {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  contact_info?: string;
  phone_number?: string;
  yf_vendor_id?: string;
  user_type: 'Admin' | 'Staff' | 'Vendor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Item {
  item_id: number;
  title: string;
  description?: string;
  price?: number;
  vendor_id: number;
  location?: string;
  contact_info?: string;
  status: 'Available' | 'Pending' | 'Sold' | 'Removed';
  date_added: string;
  updated_at: string;
  url_slug?: string;
  view_count: number;
}

interface AuthenticatedRequest {
  userId: number;
  userType: 'Admin' | 'Staff' | 'Vendor';
}

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (path.startsWith('/auth/')) {
        return this.handleAuth(request, path, corsHeaders);
      } else if (path.startsWith('/items')) {
        return this.handleItems(request, path, corsHeaders);
      } else if (path.startsWith('/images')) {
        return this.handleImages(request, path, corsHeaders);
      } else if (path.startsWith('/tags')) {
        return this.handleTags(request, path, corsHeaders);
      } else if (path.startsWith('/messages')) {
        return this.handleMessages(request, path, corsHeaders);
      } else if (path.startsWith('/forum')) {
        return this.handleForum(request, path, corsHeaders);
      } else if (path.startsWith('/events')) {
        return this.handleEvents(request, path, corsHeaders);
      } else if (path.startsWith('/users')) {
        return this.handleUsers(request, path, corsHeaders);
      } else if (path.startsWith('/search')) {
        return this.handleSearch(request, path, corsHeaders);
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (error) {
      this.env.logger.error('API Error', { error: error as Error });
      return new Response('Internal server error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }

  // Authentication middleware
  private async authenticate(request: Request): Promise<AuthenticatedRequest | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    try {
      const secret = new TextEncoder().encode(this.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return {
        userId: payload.userId as number,
        userType: payload.userType as 'Admin' | 'Staff' | 'Vendor'
      };
    } catch (error) {
      return null;
    }
  }

  // Generate slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Authentication handlers
  private async handleAuth(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/auth/register' && method === 'POST') {
      return this.handleRegister(request, corsHeaders);
    } else if (path === '/auth/login' && method === 'POST') {
      return this.handleLogin(request, corsHeaders);
    } else if (path === '/auth/refresh' && method === 'POST') {
      return this.handleRefresh(request, corsHeaders);
    } else if (path === '/auth/logout' && method === 'POST') {
      return this.handleLogout(request, corsHeaders);
    } else if (path === '/auth/password-reset' && method === 'POST') {
      return this.handlePasswordReset(request, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleRegister(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json();
      const requestBody = body as any;
      const { name, email, password, contactInfo, phoneNumber, yfVendorId, userType = 'Vendor' } = requestBody;

      // Validation
      if (!name || !email || !password) {
        return new Response(JSON.stringify({ error: 'Name, email, and password are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user exists
      const existingUser = await this.env.MAIN_DB.prepare(
        'SELECT user_id FROM users WHERE email = ?'
      ).bind(email).first() as { user_id: number } | null;

      if (existingUser) {
        return new Response(JSON.stringify({ error: 'User already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const result = await this.env.MAIN_DB.prepare(`
        INSERT INTO users (name, email, password_hash, contact_info, phone_number, yf_vendor_id, user_type, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(name, email, passwordHash, contactInfo || null, phoneNumber || null, yfVendorId || null, userType).run();

      const userId = result.meta.last_row_id;

      // Generate JWT
      const secret = new TextEncoder().encode(this.env.JWT_SECRET);
      const token = await new SignJWT({ userId, userType })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

      // Store session
      await this.env.SESSION_CACHE.put(`session:${userId}`, token, { expirationTtl: 7 * 24 * 60 * 60 });

      return new Response(JSON.stringify({ 
        token, 
        user: { userId, name, email, userType } 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Register error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Registration failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleLogin(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json();
      const requestBody = body as any;
      const { email, password } = requestBody;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find user
      const user = await this.env.MAIN_DB.prepare(
        'SELECT user_id, name, email, password_hash, user_type, is_active FROM users WHERE email = ?'
      ).bind(email).first() as User | null;

      if (!user || !user.is_active) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate JWT
      const secret = new TextEncoder().encode(this.env.JWT_SECRET);
      const token = await new SignJWT({ userId: user.user_id, userType: user.user_type })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);

      // Store session
      await this.env.SESSION_CACHE.put(`session:${user.user_id}`, token, { expirationTtl: 7 * 24 * 60 * 60 });

      return new Response(JSON.stringify({ 
        token, 
        user: { 
          userId: user.user_id, 
          name: user.name, 
          email: user.email, 
          userType: user.user_type 
        } 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Login error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Login failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleRefresh(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new token
    const secret = new TextEncoder().encode(this.env.JWT_SECRET);
    const token = await new SignJWT({ userId: auth.userId, userType: auth.userType })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Update session
    await this.env.SESSION_CACHE.put(`session:${auth.userId}`, token, { expirationTtl: 7 * 24 * 60 * 60 });

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async handleLogout(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (auth) {
      await this.env.SESSION_CACHE.delete(`session:${auth.userId}`);
    }

    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  private async handlePasswordReset(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const body = await request.json();
      const requestBody = body as any;
      const { email } = requestBody;

      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user exists
      const user = await this.env.MAIN_DB.prepare(
        'SELECT user_id, name FROM users WHERE email = ? AND is_active = 1'
      ).bind(email).first() as User | null;

      if (!user) {
        // Don't reveal if user exists or not
        return new Response(JSON.stringify({ message: 'If the email exists, a reset link will be sent' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate reset token (expires in 1 hour)
      const secret = new TextEncoder().encode(this.env.JWT_SECRET);
      const resetToken = await new SignJWT({ userId: user.user_id, type: 'password-reset' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secret);

      // Store reset token
      await this.env.SESSION_CACHE.put(`reset:${user.user_id}`, resetToken, { expirationTtl: 60 * 60 });

      // Queue notification
      await this.env.NOTIFICATION_QUEUE.send({
        type: 'password-reset',
        userId: user.user_id,
        email: email,
        resetToken: resetToken
      });

      return new Response(JSON.stringify({ message: 'If the email exists, a reset link will be sent' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Password reset error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Password reset failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Item handlers
  private async handleItems(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;
    const url = new URL(request.url);

    if (path === '/items' && method === 'GET') {
      return this.handleGetItems(request, corsHeaders);
    } else if (path === '/items' && method === 'POST') {
      return this.handleCreateItem(request, corsHeaders);
    } else if (path.match(/^\/items\/[\w-]+$/) && method === 'GET') {
      const slug = path.split('/')[2] || '';
      return this.handleGetItem(slug, corsHeaders);
    } else if (path.match(/^\/items\/\d+$/) && method === 'PUT') {
      const itemId = parseInt(path.split('/')[2] || '0');
      return this.handleUpdateItem(request, itemId, corsHeaders);
    } else if (path.match(/^\/items\/\d+$/) && method === 'DELETE') {
      const itemId = parseInt(path.split('/')[2] || '0');
      return this.handleDeleteItem(request, itemId, corsHeaders);
    } else if (path.match(/^\/items\/\d+\/images$/) && method === 'POST') {
      const itemId = parseInt(path.split('/')[2] || '0');
      return this.handleUploadImages(request, itemId, corsHeaders);
    } else if (path.match(/^\/items\/\d+\/tags$/) && method === 'POST') {
      const itemId = parseInt(path.split('/')[2] || '0');
      return this.handleAddItemTags(request, itemId, corsHeaders);
    } else if (path.match(/^\/items\/\d+\/tags\/\d+$/) && method === 'DELETE') {
      const pathParts = path.split('/');
      const itemId = parseInt(pathParts[2] || '0');
      const tagId = parseInt(pathParts[4] || '0');
      return this.handleRemoveItemTag(request, itemId, tagId, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleGetItems(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;
      
      const status = url.searchParams.get('status') || 'Available';
      const vendorId = url.searchParams.get('vendorId');
      const minPrice = url.searchParams.get('minPrice');
      const maxPrice = url.searchParams.get('maxPrice');
      const search = url.searchParams.get('search');
      const tags = url.searchParams.get('tags')?.split(',');

      let query = `
        SELECT 
          i.item_id, i.title, i.description, i.price, i.vendor_id, i.location, 
          i.contact_info, i.status, i.date_added, i.updated_at, i.url_slug, i.view_count,
          u.name as vendor_name,
          (SELECT image_url FROM item_images WHERE item_id = i.item_id ORDER BY image_order LIMIT 1) as primary_image,
          (SELECT COUNT(*) FROM item_images WHERE item_id = i.item_id) as image_count
        FROM items i
        JOIN users u ON i.vendor_id = u.user_id
        WHERE i.status = ?
      `;
      const params: any[] = [status];

      if (vendorId) {
        query += ' AND i.vendor_id = ?';
        params.push(parseInt(vendorId));
      }

      if (minPrice) {
        query += ' AND i.price >= ?';
        params.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        query += ' AND i.price <= ?';
        params.push(parseFloat(maxPrice));
      }

      if (search) {
        query += ' AND (i.title LIKE ? OR i.description LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      if (tags && tags.length > 0) {
        query += ` AND i.item_id IN (
          SELECT DISTINCT item_id FROM item_tags it
          JOIN tags t ON it.tag_id = t.tag_id
          WHERE t.tag_name IN (${tags.map(() => '?').join(',')})
        )`;
        params.push(...tags);
      }

      query += ' ORDER BY i.date_added DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const items = await this.env.MAIN_DB.prepare(query).bind(...params).all();
      const itemResults = items.results as unknown as (Item & { vendor_name: string; primary_image?: string })[];

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM items i WHERE i.status = ?';
      const countParams = [status];

      if (vendorId) {
        countQuery += ' AND i.vendor_id = ?';
        countParams.push(parseInt(vendorId) as any);
      }

      const countResult = await this.env.MAIN_DB.prepare(countQuery).bind(...countParams).first() as { total: number };
      const total = countResult.total;

      return new Response(JSON.stringify({
        items: itemResults,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get items error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGetItem(slug: string, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const item = await this.env.MAIN_DB.prepare(`
        SELECT 
          i.item_id, i.title, i.description, i.price, i.vendor_id, i.location, 
          i.contact_info, i.status, i.date_added, i.updated_at, i.url_slug, i.view_count,
          u.name as vendor_name, u.email as vendor_email
        FROM items i
        JOIN users u ON i.vendor_id = u.user_id
        WHERE i.url_slug = ?
      `).bind(slug).first() as Item & { vendor_name: string; vendor_email: string } | null;

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get images
      const images = await this.env.MAIN_DB.prepare(
        'SELECT image_id, image_url, image_order, alt_text FROM item_images WHERE item_id = ? ORDER BY image_order'
      ).bind(item.item_id).all();

      // Get tags
      const tags = await this.env.MAIN_DB.prepare(`
        SELECT t.tag_id, t.tag_name
        FROM tags t
        JOIN item_tags it ON t.tag_id = it.tag_id
        WHERE it.item_id = ?
      `).bind(item.item_id).all();
      const tagResults = tags.results as unknown as { tag_id: number; tag_name: string }[];

      // Increment view count
      await this.env.MAIN_DB.prepare(
        'UPDATE items SET view_count = view_count + 1 WHERE item_id = ?'
      ).bind(item.item_id).run();

      return new Response(JSON.stringify({
        ...item,
        images: images.results as unknown as any[],
        tags: tagResults
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get item error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch item' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCreateItem(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { title, description, price, location, contactInfo } = requestBody;

      if (!title) {
        return new Response(JSON.stringify({ error: 'Title is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate unique slug
      let baseSlug = this.generateSlug(title);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await this.env.MAIN_DB.prepare(
          'SELECT item_id FROM items WHERE url_slug = ?'
        ).bind(slug).first() as { item_id: number } | null;

        if (!existing) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const result = await this.env.MAIN_DB.prepare(`
        INSERT INTO items (title, description, price, vendor_id, location, contact_info, url_slug, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        title,
        description || null,
        price ? parseFloat(price.toString()) : null,
        auth.userId,
        location || null,
        contactInfo || null,
        slug
      ).run();

      const itemId = result.meta.last_row_id;

      return new Response(JSON.stringify({ 
        itemId, 
        slug,
        message: 'Item created successfully' 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Create item error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to create item' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateItem(request: Request, itemId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Check if item exists and user has permission
      const item = await this.env.MAIN_DB.prepare(
        'SELECT item_id, vendor_id FROM items WHERE item_id = ?'
      ).bind(itemId).first() as Item | null;

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permissions
      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && item.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const requestBody = body as any;
      const { title, description, price, location, contactInfo, status } = requestBody;

      let updateQuery = `
        UPDATE items 
        SET updated_at = CURRENT_TIMESTAMP
      `;
      const params: any[] = [];

      if (title !== undefined) {
        updateQuery += ', title = ?';
        params.push(title);
      }

      if (description !== undefined) {
        updateQuery += ', description = ?';
        params.push(description || null);
      }

      if (price !== undefined) {
        updateQuery += ', price = ?';
        params.push(price ? parseFloat(price.toString()) : null);
      }

      if (location !== undefined) {
        updateQuery += ', location = ?';
        params.push(location || null);
      }

      if (contactInfo !== undefined) {
        updateQuery += ', contact_info = ?';
        params.push(contactInfo || null);
      }

      if (status !== undefined && ['Available', 'Pending', 'Sold', 'Removed'].includes(status)) {
        updateQuery += ', status = ?';
        params.push(status);
      }

      updateQuery += ' WHERE item_id = ?';
      params.push(itemId);

      await this.env.MAIN_DB.prepare(updateQuery).bind(...params).run();

      return new Response(JSON.stringify({ message: 'Item updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update item error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to update item' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleDeleteItem(request: Request, itemId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const item = await this.env.MAIN_DB.prepare(
        'SELECT item_id, vendor_id FROM items WHERE item_id = ?'
      ).bind(itemId).first() as Item | null;

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permissions
      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && item.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get images to delete from bucket
      const images = await this.env.MAIN_DB.prepare(
        'SELECT image_url FROM item_images WHERE item_id = ?'
      ).bind(itemId).all();
      const imageUrls = images.results as unknown as { image_url: string }[];

      // Delete from bucket
      for (const image of imageUrls) {
        try {
          await this.env.ITEM_IMAGES.delete(image.image_url);
        } catch (deleteError) {
          this.env.logger.warn('Failed to delete image from bucket', { deleteError: deleteError as Error });
        }
      }

      // Delete item (cascade will delete related records)
      await this.env.MAIN_DB.prepare('DELETE FROM items WHERE item_id = ?').bind(itemId).run();

      return new Response(JSON.stringify({ message: 'Item deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Delete item error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to delete item' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUploadImages(request: Request, itemId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Check if item exists and user has permission
      const item = await this.env.MAIN_DB.prepare(
        'SELECT item_id, vendor_id FROM items WHERE item_id = ?'
      ).bind(itemId).first() as Item | null;

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && item.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check current image count
      const currentCount = await this.env.MAIN_DB.prepare(
        'SELECT COUNT(*) as count FROM item_images WHERE item_id = ?'
      ).bind(itemId).first() as { count: number };

      if (currentCount.count >= 6) {
        return new Response(JSON.stringify({ error: 'Maximum 6 images allowed per item' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const formData = await request.formData();
      const files = formData.getAll('images') as File[];

      if (!files.length) {
        return new Response(JSON.stringify({ error: 'No images provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const uploadedImages = [];
      const maxImages = Math.min(files.length, 6 - currentCount.count);

      for (let i = 0; i < maxImages; i++) {
        const file = files[i];
        if (!file) continue;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          continue;
        }

        // Generate filename
        const extension = file.name.split('.').pop();
        const filename = `item_${itemId}_${Date.now()}_${i}.${extension}`;

        // Upload to bucket
        const arrayBuffer = await file.arrayBuffer();
        await this.env.ITEM_IMAGES.put(filename, arrayBuffer, {
          httpMetadata: {
            contentType: file.type
          }
        });

        // Get next order
        const orderResult = await this.env.MAIN_DB.prepare(
          'SELECT COALESCE(MAX(image_order), 0) + 1 as next_order FROM item_images WHERE item_id = ?'
        ).bind(itemId).first() as { next_order: number };

        // Save to database
        await this.env.MAIN_DB.prepare(`
          INSERT INTO item_images (item_id, image_url, image_order, alt_text)
          VALUES (?, ?, ?, ?)
        `).bind(itemId, filename, orderResult.next_order, file.name).run();

        uploadedImages.push({
          filename,
          originalName: file.name,
          order: orderResult.next_order
        });
      }

      return new Response(JSON.stringify({ 
        message: 'Images uploaded successfully',
        uploadedImages 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Upload images error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to upload images' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Image handlers
  private async handleImages(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path.match(/^\/images\/\d+$/) && method === 'DELETE') {
      const imageId = parseInt(path.split('/')[2] || '0');
      return this.handleDeleteImage(request, imageId, corsHeaders);
    } else if (path.match(/^\/images\/\d+\/order$/) && method === 'PUT') {
      const imageId = parseInt(path.split('/')[2] || '0');
      return this.handleUpdateImageOrder(request, imageId, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleDeleteImage(request: Request, imageId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Get image and check permissions
      const image = await this.env.MAIN_DB.prepare(`
        SELECT ii.image_id, ii.image_url, ii.item_id, i.vendor_id
        FROM item_images ii
        JOIN items i ON ii.item_id = i.item_id
        WHERE ii.image_id = ?
      `).bind(imageId).first() as { 
        image_id: number; 
        image_url: string; 
        item_id: number; 
        vendor_id: number 
      } | null;

      if (!image) {
        return new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && image.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete from bucket
      try {
        await this.env.ITEM_IMAGES.delete(image.image_url);
      } catch (deleteError) {
        this.env.logger.warn('Failed to delete image from bucket', { deleteError: deleteError as Error });
      }

      // Delete from database
      await this.env.MAIN_DB.prepare('DELETE FROM item_images WHERE image_id = ?').bind(imageId).run();

      return new Response(JSON.stringify({ message: 'Image deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Delete image error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to delete image' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateImageOrder(request: Request, imageId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { order } = requestBody;

      if (!order || order < 1 || order > 6) {
        return new Response(JSON.stringify({ error: 'Order must be between 1 and 6' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get image and check permissions
      const image = await this.env.MAIN_DB.prepare(`
        SELECT ii.image_id, ii.item_id, i.vendor_id
        FROM item_images ii
        JOIN items i ON ii.item_id = i.item_id
        WHERE ii.image_id = ?
      `).bind(imageId).first() as { 
        image_id: number; 
        item_id: number; 
        vendor_id: number 
      } | null;

      if (!image) {
        return new Response(JSON.stringify({ error: 'Image not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && image.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update image order
      await this.env.MAIN_DB.prepare(
        'UPDATE item_images SET image_order = ? WHERE image_id = ?'
      ).bind(order, imageId).run();

      return new Response(JSON.stringify({ message: 'Image order updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update image order error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to update image order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Tag handlers
  private async handleTags(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/tags' && method === 'GET') {
      return this.handleGetTags(corsHeaders);
    } else if (path === '/tags' && method === 'POST') {
      return this.handleCreateTag(request, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleGetTags(corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const tags = await this.env.MAIN_DB.prepare(`
        SELECT t.tag_id, t.tag_name, COUNT(it.item_id) as item_count
        FROM tags t
        LEFT JOIN item_tags it ON t.tag_id = it.tag_id
        LEFT JOIN items i ON it.item_id = i.item_id AND i.status = 'Available'
        GROUP BY t.tag_id, t.tag_name
        ORDER BY item_count DESC, t.tag_name
      `).all();
      const allTags = tags.results as unknown as { tag_id: number; tag_name: string; item_count: number }[];

      return new Response(JSON.stringify(tags.results), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get tags error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch tags' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCreateTag(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { tagName } = requestBody;

      if (!tagName || tagName.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Tag name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const cleanTagName = tagName.trim().toLowerCase();

      // Check if tag already exists
      const existingTag = await this.env.MAIN_DB.prepare(
        'SELECT tag_id FROM tags WHERE LOWER(tag_name) = ?'
      ).bind(cleanTagName).first() as { tag_id: number } | null;

      if (existingTag) {
        return new Response(JSON.stringify({ error: 'Tag already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await this.env.MAIN_DB.prepare(
        'INSERT INTO tags (tag_name) VALUES (?)'
      ).bind(cleanTagName).run();

      const tagId = result.meta.last_row_id;

      return new Response(JSON.stringify({ 
        tagId, 
        tagName: cleanTagName,
        message: 'Tag created successfully' 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Create tag error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to create tag' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleAddItemTags(request: Request, itemId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { tagIds } = requestBody;

      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        return new Response(JSON.stringify({ error: 'Tag IDs array is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if item exists and user has permission
      const item = await this.env.MAIN_DB.prepare(
        'SELECT item_id, vendor_id FROM items WHERE item_id = ?'
      ).bind(itemId).first() as Item | null;

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && item.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add tags
      const addedTags = [];
      for (const tagId of tagIds) {
        try {
          await this.env.MAIN_DB.prepare(`
            INSERT OR IGNORE INTO item_tags (item_id, tag_id, added_by_user_id)
            VALUES (?, ?, ?)
          `).bind(itemId, tagId, auth.userId).run();
          addedTags.push(tagId);
        } catch (error) {
          this.env.logger.warn('Failed to add tag', { tagId, error: error as Error });
        }
      }

      return new Response(JSON.stringify({ 
        message: 'Tags added successfully',
        addedTags 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Add item tags error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to add tags' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleRemoveItemTag(request: Request, itemId: number, tagId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Check if item exists and user has permission
      const item = await this.env.MAIN_DB.prepare(
        'SELECT item_id, vendor_id FROM items WHERE item_id = ?'
      ).bind(itemId).first() as Item | null;

      if (!item) {
        return new Response(JSON.stringify({ error: 'Item not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && item.vendor_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Remove tag
      await this.env.MAIN_DB.prepare(
        'DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?'
      ).bind(itemId, tagId).run();

      return new Response(JSON.stringify({ message: 'Tag removed successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Remove item tag error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to remove tag' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Message handlers
  private async handleMessages(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/messages' && method === 'GET') {
      return this.handleGetMessages(request, corsHeaders);
    } else if (path === '/messages' && method === 'POST') {
      return this.handleSendMessage(request, corsHeaders);
    } else if (path.match(/^\/messages\/\d+$/) && method === 'GET') {
      const messageId = parseInt(path.split('/')[2] || '0');
      return this.handleGetMessage(request, messageId, corsHeaders);
    } else if (path.match(/^\/messages\/\d+\/read$/) && method === 'PUT') {
      const messageId = parseInt(path.split('/')[2] || '0');
      return this.handleMarkMessageRead(request, messageId, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleGetMessages(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      const messages = await this.env.MAIN_DB.prepare(`
        SELECT 
          m.message_id, m.item_id, m.sender_id, m.recipient_id, m.subject, 
          m.message_text, m.is_read, m.sent_at,
          sender.name as sender_name,
          recipient.name as recipient_name,
          i.title as item_title, i.url_slug as item_slug
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        JOIN users recipient ON m.recipient_id = recipient.user_id
        LEFT JOIN items i ON m.item_id = i.item_id
        WHERE m.sender_id = ? OR m.recipient_id = ?
        ORDER BY m.sent_at DESC
        LIMIT ? OFFSET ?
      `).bind(auth.userId, auth.userId, limit, offset).all();

      const totalResult = await this.env.MAIN_DB.prepare(`
        SELECT COUNT(*) as total 
        FROM messages 
        WHERE sender_id = ? OR recipient_id = ?
      `).bind(auth.userId, auth.userId).first() as { total: number };

      return new Response(JSON.stringify({
        messages: messages.results,
        pagination: {
          page,
          limit,
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get messages error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGetMessage(request: Request, messageId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const message = await this.env.MAIN_DB.prepare(`
        SELECT 
          m.message_id, m.item_id, m.sender_id, m.recipient_id, m.subject, 
          m.message_text, m.is_read, m.sent_at,
          sender.name as sender_name, sender.email as sender_email,
          recipient.name as recipient_name, recipient.email as recipient_email,
          i.title as item_title, i.url_slug as item_slug
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        JOIN users recipient ON m.recipient_id = recipient.user_id
        LEFT JOIN items i ON m.item_id = i.item_id
        WHERE m.message_id = ? AND (m.sender_id = ? OR m.recipient_id = ?)
      `).bind(messageId, auth.userId, auth.userId).first() as any;

      if (!message) {
        return new Response(JSON.stringify({ error: 'Message not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(message), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get message error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleSendMessage(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { recipientId, itemId, subject, messageText } = requestBody;

      if (!recipientId || !messageText) {
        return new Response(JSON.stringify({ error: 'Recipient and message text are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if recipient exists
      const recipient = await this.env.MAIN_DB.prepare(
        'SELECT user_id, email FROM users WHERE user_id = ? AND is_active = 1'
      ).bind(recipientId).first() as { user_id: number; email: string } | null;

      if (!recipient) {
        return new Response(JSON.stringify({ error: 'Recipient not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If itemId provided, check if it exists
      if (itemId) {
        const item = await this.env.MAIN_DB.prepare(
          'SELECT item_id FROM items WHERE item_id = ?'
        ).bind(itemId).first() as { item_id: number } | null;

        if (!item) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      const result = await this.env.MAIN_DB.prepare(`
        INSERT INTO messages (sender_id, recipient_id, item_id, subject, message_text)
        VALUES (?, ?, ?, ?, ?)
      `).bind(auth.userId, recipientId, itemId || null, subject || null, messageText).run();

      const messageId = result.meta.last_row_id;

      // Queue notification
      await this.env.NOTIFICATION_QUEUE.send({
        type: 'new-message',
        messageId: messageId,
        recipientId: recipientId,
        senderId: auth.userId
      });

      return new Response(JSON.stringify({ 
        messageId,
        message: 'Message sent successfully' 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Send message error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to send message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleMarkMessageRead(request: Request, messageId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const result = await this.env.MAIN_DB.prepare(
        'UPDATE messages SET is_read = 1 WHERE message_id = ? AND recipient_id = ?'
      ).bind(messageId, auth.userId).run();

      if (result.meta.changes === 0) {
        return new Response(JSON.stringify({ error: 'Message not found or not authorized' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ message: 'Message marked as read' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Mark message read error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to mark message as read' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Forum handlers
  private async handleForum(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/forum/posts' && method === 'GET') {
      return this.handleGetForumPosts(request, corsHeaders);
    } else if (path === '/forum/posts' && method === 'POST') {
      return this.handleCreateForumPost(request, corsHeaders);
    } else if (path.match(/^\/forum\/posts\/\d+$/) && method === 'PUT') {
      const postId = parseInt(path.split('/')[3] || '0');
      return this.handleUpdateForumPost(request, postId, corsHeaders);
    } else if (path.match(/^\/forum\/posts\/\d+$/) && method === 'DELETE') {
      const postId = parseInt(path.split('/')[3] || '0');
      return this.handleDeleteForumPost(request, postId, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleGetForumPosts(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;
      const itemId = url.searchParams.get('itemId');
      const parentPostId = url.searchParams.get('parentPostId');

      let query = `
        SELECT 
          fp.post_id, fp.item_id, fp.user_id, fp.parent_post_id, fp.title, 
          fp.content, fp.is_pinned, fp.created_at, fp.updated_at,
          u.name as author_name,
          i.title as item_title, i.url_slug as item_slug
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.user_id
        LEFT JOIN items i ON fp.item_id = i.item_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (itemId) {
        query += ' AND fp.item_id = ?';
        params.push(parseInt(itemId));
      }

      if (parentPostId) {
        query += ' AND fp.parent_post_id = ?';
        params.push(parseInt(parentPostId));
      } else if (!itemId) {
        // Only show top-level posts if no specific item or parent
        query += ' AND fp.parent_post_id IS NULL';
      }

      query += ' ORDER BY fp.is_pinned DESC, fp.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const posts = await this.env.MAIN_DB.prepare(query).bind(...params).all();
      const forumPosts = posts.results as unknown as any[];

      // Get reply counts for each post
      const postsWithReplies = [];
      for (const post of forumPosts) {
        const replyCount = await this.env.MAIN_DB.prepare(
          'SELECT COUNT(*) as count FROM forum_posts WHERE parent_post_id = ?'
        ).bind(post.post_id).first() as { count: number };

        postsWithReplies.push({
          ...post,
          reply_count: replyCount.count
        });
      }

      return new Response(JSON.stringify({
        posts: postsWithReplies
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get forum posts error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch forum posts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCreateForumPost(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { itemId, parentPostId, title, content } = requestBody;

      if (!content) {
        return new Response(JSON.stringify({ error: 'Content is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If parentPostId is provided, check if it exists
      if (parentPostId) {
        const parentPost = await this.env.MAIN_DB.prepare(
          'SELECT post_id FROM forum_posts WHERE post_id = ?'
        ).bind(parentPostId).first() as { post_id: number } | null;

        if (!parentPost) {
          return new Response(JSON.stringify({ error: 'Parent post not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // If itemId is provided, check if it exists
      if (itemId) {
        const item = await this.env.MAIN_DB.prepare(
          'SELECT item_id FROM items WHERE item_id = ?'
        ).bind(itemId).first() as { item_id: number } | null;

        if (!item) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      const result = await this.env.MAIN_DB.prepare(`
        INSERT INTO forum_posts (item_id, user_id, parent_post_id, title, content, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        itemId || null,
        auth.userId,
        parentPostId || null,
        title || null,
        content
      ).run();

      const postId = result.meta.last_row_id;

      return new Response(JSON.stringify({ 
        postId,
        message: 'Post created successfully' 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Create forum post error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to create post' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateForumPost(request: Request, postId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { title, content, isPinned } = requestBody;

      // Check if post exists and user has permission
      const post = await this.env.MAIN_DB.prepare(
        'SELECT post_id, user_id FROM forum_posts WHERE post_id = ?'
      ).bind(postId).first() as { post_id: number; user_id: number } | null;

      if (!post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permissions - only author, staff, or admin can edit
      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && post.user_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let updateQuery = 'UPDATE forum_posts SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];

      if (title !== undefined) {
        updateQuery += ', title = ?';
        params.push(title || null);
      }

      if (content !== undefined) {
        updateQuery += ', content = ?';
        params.push(content);
      }

      // Only staff and admin can pin posts
      if (isPinned !== undefined && (auth.userType === 'Admin' || auth.userType === 'Staff')) {
        updateQuery += ', is_pinned = ?';
        params.push(isPinned ? 1 : 0);
      }

      updateQuery += ' WHERE post_id = ?';
      params.push(postId);

      await this.env.MAIN_DB.prepare(updateQuery).bind(...params).run();

      return new Response(JSON.stringify({ message: 'Post updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update forum post error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to update post' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleDeleteForumPost(request: Request, postId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Check if post exists and user has permission
      const post = await this.env.MAIN_DB.prepare(
        'SELECT post_id, user_id FROM forum_posts WHERE post_id = ?'
      ).bind(postId).first() as { post_id: number; user_id: number } | null;

      if (!post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permissions - only author, staff, or admin can delete
      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && post.user_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete post (cascade will delete replies)
      await this.env.MAIN_DB.prepare('DELETE FROM forum_posts WHERE post_id = ?').bind(postId).run();

      return new Response(JSON.stringify({ message: 'Post deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Delete forum post error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Event handlers
  private async handleEvents(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/events' && method === 'GET') {
      return this.handleGetEvents(request, corsHeaders);
    } else if (path === '/events' && method === 'POST') {
      return this.handleCreateEvent(request, corsHeaders);
    } else if (path.match(/^\/events\/\d+$/) && method === 'GET') {
      const eventId = parseInt(path.split('/')[2] || '0');
      return this.handleGetEvent(eventId, corsHeaders);
    } else if (path.match(/^\/events\/\d+$/) && method === 'PUT') {
      const eventId = parseInt(path.split('/')[2] || '0');
      return this.handleUpdateEvent(request, eventId, corsHeaders);
    } else if (path.match(/^\/events\/\d+$/) && method === 'DELETE') {
      const eventId = parseInt(path.split('/')[2] || '0');
      return this.handleDeleteEvent(request, eventId, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleGetEvents(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const url = new URL(request.url);
      const fromDate = url.searchParams.get('fromDate');
      const toDate = url.searchParams.get('toDate');

      let query = `
        SELECT 
          e.event_id, e.title, e.description, e.event_date, e.start_time, 
          e.end_time, e.location, e.created_by_user_id, e.is_active, e.created_at,
          u.name as created_by_name
        FROM events e
        JOIN users u ON e.created_by_user_id = u.user_id
        WHERE e.is_active = 1
      `;
      const params: any[] = [];

      if (fromDate) {
        query += ' AND e.event_date >= ?';
        params.push(fromDate);
      }

      if (toDate) {
        query += ' AND e.event_date <= ?';
        params.push(toDate);
      }

      query += ' ORDER BY e.event_date, e.start_time';

      const events = await this.env.MAIN_DB.prepare(query).bind(...params).all();
      const eventResults = events.results as unknown as any[];

      return new Response(JSON.stringify(eventResults), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get events error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGetEvent(eventId: number, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const event = await this.env.MAIN_DB.prepare(`
        SELECT 
          e.event_id, e.title, e.description, e.event_date, e.start_time, 
          e.end_time, e.location, e.created_by_user_id, e.is_active, e.created_at,
          u.name as created_by_name, u.email as created_by_email
        FROM events e
        JOIN users u ON e.created_by_user_id = u.user_id
        WHERE e.event_id = ? AND e.is_active = 1
      `).bind(eventId).first() as any;

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(event), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get event error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCreateEvent(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only staff and admin can create events
    if (auth.userType === 'Vendor') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { title, description, eventDate, startTime, endTime, location } = requestBody;

      if (!title || !eventDate) {
        return new Response(JSON.stringify({ error: 'Title and event date are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await this.env.MAIN_DB.prepare(`
        INSERT INTO events (title, description, event_date, start_time, end_time, location, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        title,
        description || null,
        eventDate,
        startTime || null,
        endTime || null,
        location || null,
        auth.userId
      ).run();

      const eventId = result.meta.last_row_id;

      // Queue notification for all users
      await this.env.NOTIFICATION_QUEUE.send({
        type: 'new-event',
        eventId: eventId,
        createdBy: auth.userId
      });

      return new Response(JSON.stringify({ 
        eventId,
        message: 'Event created successfully' 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Create event error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to create event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateEvent(request: Request, eventId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { title, description, eventDate, startTime, endTime, location, isActive } = requestBody;

      // Check if event exists and user has permission
      const event = await this.env.MAIN_DB.prepare(
        'SELECT event_id, created_by_user_id FROM events WHERE event_id = ?'
      ).bind(eventId).first() as { event_id: number; created_by_user_id: number } | null;

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permissions - only creator, staff, or admin can edit
      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && event.created_by_user_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let updateQuery = 'UPDATE events SET';
      const params: any[] = [];
      const updates: string[] = [];

      if (title !== undefined) {
        updates.push(' title = ?');
        params.push(title);
      }

      if (description !== undefined) {
        updates.push(' description = ?');
        params.push(description || null);
      }

      if (eventDate !== undefined) {
        updates.push(' event_date = ?');
        params.push(eventDate);
      }

      if (startTime !== undefined) {
        updates.push(' start_time = ?');
        params.push(startTime || null);
      }

      if (endTime !== undefined) {
        updates.push(' end_time = ?');
        params.push(endTime || null);
      }

      if (location !== undefined) {
        updates.push(' location = ?');
        params.push(location || null);
      }

      if (isActive !== undefined) {
        updates.push(' is_active = ?');
        params.push(isActive ? 1 : 0);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: 'No updates provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      updateQuery += updates.join(',') + ' WHERE event_id = ?';
      params.push(eventId);

      await this.env.MAIN_DB.prepare(updateQuery).bind(...params).run();

      return new Response(JSON.stringify({ message: 'Event updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update event error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to update event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleDeleteEvent(request: Request, eventId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Check if event exists and user has permission
      const event = await this.env.MAIN_DB.prepare(
        'SELECT event_id, created_by_user_id FROM events WHERE event_id = ?'
      ).bind(eventId).first() as { event_id: number; created_by_user_id: number } | null;

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permissions - only creator, staff, or admin can delete
      if (auth.userType !== 'Admin' && auth.userType !== 'Staff' && event.created_by_user_id !== auth.userId) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Soft delete by setting is_active to false
      await this.env.MAIN_DB.prepare(
        'UPDATE events SET is_active = 0 WHERE event_id = ?'
      ).bind(eventId).run();

      return new Response(JSON.stringify({ message: 'Event deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Delete event error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to delete event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // User handlers
  private async handleUsers(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/users/profile' && method === 'GET') {
      return this.handleGetProfile(request, corsHeaders);
    } else if (path === '/users/profile' && method === 'PUT') {
      return this.handleUpdateProfile(request, corsHeaders);
    } else if (path === '/users' && method === 'GET') {
      return this.handleGetUsers(request, corsHeaders);
    } else if (path.match(/^\/users\/\d+$/) && method === 'PUT') {
      const userId = parseInt(path.split('/')[2] || '0');
      return this.handleUpdateUser(request, userId, corsHeaders);
    } else if (path.match(/^\/users\/\d+$/) && method === 'DELETE') {
      const userId = parseInt(path.split('/')[2] || '0');
      return this.handleDeleteUser(request, userId, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleGetProfile(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const user = await this.env.MAIN_DB.prepare(`
        SELECT user_id, name, email, contact_info, phone_number, yf_vendor_id, user_type, is_active, created_at
        FROM users 
        WHERE user_id = ?
      `).bind(auth.userId).first() as any;

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get profile error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateProfile(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { name, contactInfo, phoneNumber, yfVendorId } = requestBody;

      let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];

      if (name !== undefined) {
        updateQuery += ', name = ?';
        params.push(name);
      }

      if (contactInfo !== undefined) {
        updateQuery += ', contact_info = ?';
        params.push(contactInfo || null);
      }

      if (phoneNumber !== undefined) {
        updateQuery += ', phone_number = ?';
        params.push(phoneNumber || null);
      }

      if (yfVendorId !== undefined) {
        updateQuery += ', yf_vendor_id = ?';
        params.push(yfVendorId || null);
      }

      updateQuery += ' WHERE user_id = ?';
      params.push(auth.userId);

      await this.env.MAIN_DB.prepare(updateQuery).bind(...params).run();

      return new Response(JSON.stringify({ message: 'Profile updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update profile error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleGetUsers(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth || auth.userType !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;
      const userType = url.searchParams.get('userType');
      const isActive = url.searchParams.get('isActive');

      let query = `
        SELECT user_id, name, email, contact_info, phone_number, yf_vendor_id, 
               user_type, is_active, created_at
        FROM users 
        WHERE 1=1
      `;
      const params: any[] = [];

      if (userType) {
        query += ' AND user_type = ?';
        params.push(userType);
      }

      if (isActive !== null) {
        query += ' AND is_active = ?';
        params.push(isActive === 'true' ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const users = await this.env.MAIN_DB.prepare(query).bind(...params).all();
      const userResults = users.results as unknown as User[];

      const totalResult = await this.env.MAIN_DB.prepare(
        'SELECT COUNT(*) as total FROM users WHERE 1=1' + 
        (userType ? ' AND user_type = ?' : '') +
        (isActive !== null ? ' AND is_active = ?' : '')
      ).bind(...params.slice(0, -2)).first() as { total: number };

      return new Response(JSON.stringify({
        users: userResults,
        pagination: {
          page,
          limit,
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Get users error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateUser(request: Request, userId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth || auth.userType !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const requestBody = body as any;
      const { name, contactInfo, phoneNumber, yfVendorId, userType, isActive } = requestBody;

      // Check if user exists
      const user = await this.env.MAIN_DB.prepare(
        'SELECT user_id FROM users WHERE user_id = ?'
      ).bind(userId).first() as { user_id: number } | null;

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];

      if (name !== undefined) {
        updateQuery += ', name = ?';
        params.push(name);
      }

      if (contactInfo !== undefined) {
        updateQuery += ', contact_info = ?';
        params.push(contactInfo || null);
      }

      if (phoneNumber !== undefined) {
        updateQuery += ', phone_number = ?';
        params.push(phoneNumber || null);
      }

      if (yfVendorId !== undefined) {
        updateQuery += ', yf_vendor_id = ?';
        params.push(yfVendorId || null);
      }

      if (userType !== undefined && ['Admin', 'Staff', 'Vendor'].includes(userType)) {
        updateQuery += ', user_type = ?';
        params.push(userType);
      }

      if (isActive !== undefined) {
        updateQuery += ', is_active = ?';
        params.push(isActive ? 1 : 0);
      }

      updateQuery += ' WHERE user_id = ?';
      params.push(userId);

      await this.env.MAIN_DB.prepare(updateQuery).bind(...params).run();

      return new Response(JSON.stringify({ message: 'User updated successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update user error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to update user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleDeleteUser(request: Request, userId: number, corsHeaders: Record<string, string>): Promise<Response> {
    const auth = await this.authenticate(request);
    if (!auth || auth.userType !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Prevent deleting self
      if (userId === auth.userId) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if user exists
      const user = await this.env.MAIN_DB.prepare(
        'SELECT user_id FROM users WHERE user_id = ?'
      ).bind(userId).first() as { user_id: number } | null;

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Soft delete by setting is_active to false
      await this.env.MAIN_DB.prepare(
        'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(userId).run();

      // Remove user session
      await this.env.SESSION_CACHE.delete(`session:${userId}`);

      return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Delete user error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Search handlers
  private async handleSearch(request: Request, path: string, corsHeaders: Record<string, string>): Promise<Response> {
    const method = request.method;

    if (path === '/search' && method === 'GET') {
      return this.handleSearchItems(request, corsHeaders);
    } else if (path === '/search/suggestions' && method === 'GET') {
      return this.handleSearchSuggestions(request, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  private async handleSearchItems(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

      if (!query) {
        return new Response(JSON.stringify({ error: 'Search query is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Call search service
      const searchResponse = await this.env.SEARCH_SERVICE.fetch(new Request(`http://localhost/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`));
      const searchResults = await searchResponse.json();

      return new Response(JSON.stringify(searchResults), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Search items error', { error: error as Error });
      return new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleSearchSuggestions(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

      if (!query || query.length < 2) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get popular tags that match the query
      const tags = await this.env.MAIN_DB.prepare(`
        SELECT DISTINCT t.tag_name
        FROM tags t
        WHERE t.tag_name LIKE ?
        ORDER BY (
          SELECT COUNT(*) FROM item_tags it 
          JOIN items i ON it.item_id = i.item_id 
          WHERE it.tag_id = t.tag_id AND i.status = 'Available'
        ) DESC
        LIMIT ?
      `).bind(`%${query}%`, Math.floor(limit / 2)).all();
      const tagSuggestions = tags.results as unknown as { tag_name: string }[];

      // Get item titles that match the query
      const items = await this.env.MAIN_DB.prepare(`
        SELECT DISTINCT title
        FROM items
        WHERE title LIKE ? AND status = 'Available'
        ORDER BY view_count DESC
        LIMIT ?
      `).bind(`%${query}%`, Math.floor(limit / 2)).all();
      const itemSuggestions = items.results as unknown as { title: string }[];

      const suggestions = [
        ...tagSuggestions.map((tag) => ({ type: 'tag', value: tag.tag_name })),
        ...itemSuggestions.map((item) => ({ type: 'item', value: item.title }))
      ];

      return new Response(JSON.stringify(suggestions), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Search suggestions error', { error: error as Error });
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}