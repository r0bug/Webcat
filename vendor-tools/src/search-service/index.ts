import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

interface SearchResult {
  item_id: number;
  title: string;
  description?: string;
  price?: number;
  vendor_id: number;
  location?: string;
  status: string;
  url_slug?: string;
  vendor_name: string;
  primary_image?: string;
  score: number;
}

interface EmbeddingData {
  item_id: number;
  title: string;
  description?: string;
  tags: string[];
  embedding?: number[];
}

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/search' && method === 'GET') {
        return this.handleSearch(request);
      } else if (path === '/embed' && method === 'POST') {
        return this.handleEmbed(request);
      } else if (path === '/update-embeddings' && method === 'POST') {
        return this.handleUpdateEmbeddings(request);
      } else if (path === '/reindex' && method === 'POST') {
        return this.handleReindex(request);
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      this.env.logger.error('Search service error', { error: error as Error });
      return new Response('Internal server error', { status: 500 });
    }
  }

  private async handleSearch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      if (!query || query.trim().length === 0) {
        return new Response(JSON.stringify({ 
          error: 'Search query is required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // First, try semantic search using embeddings
      const semanticResults = await this.performSemanticSearch(query, limit);
      
      // If semantic search doesn't return enough results, fall back to text search
      let textResults: SearchResult[] = [];
      if (semanticResults.length < limit / 2) {
        textResults = await this.performTextSearch(query, limit - semanticResults.length);
      }

      // Combine and deduplicate results
      const combinedResults = this.combineAndDeduplicateResults(semanticResults, textResults);
      
      // Apply pagination
      const paginatedResults = combinedResults.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        results: paginatedResults,
        total: combinedResults.length,
        page,
        limit,
        pages: Math.ceil(combinedResults.length / limit),
        query
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Search error', { error: error as Error });
      return new Response(JSON.stringify({ 
        error: 'Search failed' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async performSemanticSearch(query: string, limit: number): Promise<SearchResult[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query);
      
      if (!queryEmbedding || queryEmbedding.length === 0) {
        this.env.logger.warn('Failed to generate embedding for query');
        return [];
      }

      // Search in vector index
      const vectorResults = await this.env.ITEM_EMBEDDINGS.query(queryEmbedding, {
        topK: limit * 2, // Get more results to allow for filtering
        returnMetadata: true
      });

      if (!vectorResults.matches || vectorResults.matches.length === 0) {
        return [];
      }

      // Extract item IDs and scores
      const itemIds = vectorResults.matches.map(match => parseInt(match.id));
      const scoreMap = new Map(
        vectorResults.matches.map(match => [
          parseInt(match.id), 
          match.score || 0
        ])
      );

      if (itemIds.length === 0) {
        return [];
      }

      // Fetch full item details from database
      const placeholders = itemIds.map(() => '?').join(',');
      const items = await this.env.MAIN_DB.prepare(`
        SELECT 
          i.item_id, i.title, i.description, i.price, i.vendor_id, i.location, 
          i.status, i.url_slug, u.name as vendor_name,
          (SELECT image_url FROM item_images WHERE item_id = i.item_id ORDER BY image_order LIMIT 1) as primary_image
        FROM items i
        JOIN users u ON i.vendor_id = u.user_id
        WHERE i.item_id IN (${placeholders}) AND i.status = 'Available'
        ORDER BY i.date_added DESC
      `).bind(...itemIds).all();
      const itemsResult = items.results as any[];

      // Add scores to results
      return itemsResult.map(item => ({
        ...item,
        score: scoreMap.get(item.item_id) || 0
      })).sort((a, b) => b.score - a.score);

    } catch (error) {
      this.env.logger.error('Semantic search error', { error: error as Error });
      return [];
    }
  }

  private async performTextSearch(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      const searchPattern = `%${searchTerms.join('%')}%`;

      const items = await this.env.MAIN_DB.prepare(`
        SELECT DISTINCT
          i.item_id, i.title, i.description, i.price, i.vendor_id, i.location, 
          i.status, i.url_slug, u.name as vendor_name,
          (SELECT image_url FROM item_images WHERE item_id = i.item_id ORDER BY image_order LIMIT 1) as primary_image,
          -- Scoring based on text matches
          (
            CASE WHEN LOWER(i.title) LIKE ? THEN 10 ELSE 0 END +
            CASE WHEN LOWER(i.description) LIKE ? THEN 5 ELSE 0 END +
            (SELECT COUNT(*) * 3 FROM item_tags it 
             JOIN tags t ON it.tag_id = t.tag_id 
             WHERE it.item_id = i.item_id AND LOWER(t.tag_name) LIKE ?)
          ) as score
        FROM items i
        JOIN users u ON i.vendor_id = u.user_id
        WHERE i.status = 'Available' AND (
          LOWER(i.title) LIKE ? OR 
          LOWER(i.description) LIKE ? OR
          i.item_id IN (
            SELECT DISTINCT it.item_id 
            FROM item_tags it 
            JOIN tags t ON it.tag_id = t.tag_id 
            WHERE LOWER(t.tag_name) LIKE ?
          )
        )
        HAVING score > 0
        ORDER BY score DESC, i.view_count DESC, i.date_added DESC
        LIMIT ?
      `).bind(
        searchPattern, searchPattern, searchPattern,
        searchPattern, searchPattern, searchPattern,
        limit
      ).all();
      const textResults = items.results as unknown as SearchResult[];

      return textResults;
    } catch (error) {
      this.env.logger.error('Text search error', { error: error as Error });
      return [];
    }
  }

  private combineAndDeduplicateResults(semanticResults: SearchResult[], textResults: SearchResult[]): SearchResult[] {
    const seenIds = new Set<number>();
    const combined: SearchResult[] = [];

    // Add semantic results first (higher priority)
    for (const result of semanticResults) {
      if (!seenIds.has(result.item_id)) {
        seenIds.add(result.item_id);
        combined.push(result);
      }
    }

    // Add text results that weren't already found
    for (const result of textResults) {
      if (!seenIds.has(result.item_id)) {
        seenIds.add(result.item_id);
        combined.push(result);
      }
    }

    // Sort by score if available, otherwise by recency
    return combined.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      // If scores are equal, prioritize by ID (newer items have higher IDs)
      return b.item_id - a.item_id;
    });
  }

  private async handleEmbed(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const requestBody = body as { text?: string };
      const { text } = requestBody;

      if (!text || typeof text !== 'string') {
        return new Response(JSON.stringify({ 
          error: 'Text is required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const embedding = await this.generateEmbedding(text);

      return new Response(JSON.stringify({ 
        embedding,
        dimensions: embedding.length 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Embed error', { error: error as Error });
      return new Response(JSON.stringify({ 
        error: 'Failed to generate embedding' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleUpdateEmbeddings(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const requestBody = body as { itemIds?: number[] };
      const { itemIds } = requestBody;

      if (!itemIds || !Array.isArray(itemIds)) {
        return new Response(JSON.stringify({ 
          error: 'Item IDs array is required' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const updated = await this.updateItemEmbeddings(itemIds);

      return new Response(JSON.stringify({ 
        message: 'Embeddings updated successfully',
        updated 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Update embeddings error', { error: error as Error });
      return new Response(JSON.stringify({ 
        error: 'Failed to update embeddings' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleReindex(request: Request): Promise<Response> {
    try {
      this.env.logger.info('Starting full reindex of item embeddings');

      // Get all available items
      const items = await this.env.MAIN_DB.prepare(`
        SELECT 
          i.item_id, i.title, i.description,
          GROUP_CONCAT(t.tag_name, ', ') as tags
        FROM items i
        LEFT JOIN item_tags it ON i.item_id = it.item_id
        LEFT JOIN tags t ON it.tag_id = t.tag_id
        WHERE i.status = 'Available'
        GROUP BY i.item_id, i.title, i.description
        ORDER BY i.item_id
      `).all();

      const itemsData = items.results as unknown as EmbeddingData[];
      this.env.logger.info('Found items to reindex', { count: itemsData.length });

      let processed = 0;
      let errors = 0;
      const batchSize = 10;

      // Process items in batches to avoid overwhelming the AI service
      for (let i = 0; i < itemsData.length; i += batchSize) {
        const batch = itemsData.slice(i, i + batchSize);
        
        const embedPromises = batch.map(async (item) => {
          try {
            await this.updateItemEmbedding(item);
            processed++;
            
            // Log progress every 50 items
            if (processed % 50 === 0) {
              this.env.logger.info('Processing progress', { processed, total: itemsData.length });
            }
          } catch (error) {
            this.env.logger.error('Failed to update embedding for item', { itemId: item.item_id, error: error as Error });
            errors++;
          }
        });

        await Promise.all(embedPromises);

        // Small delay between batches to be respectful to the AI service
        if (i + batchSize < itemsData.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.env.logger.info('Reindex completed', { processed, errors, total: itemsData.length });

      return new Response(JSON.stringify({
        message: 'Reindex completed successfully',
        processed,
        errors,
        total: itemsData.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      this.env.logger.error('Reindex error', { error: error as Error });
      return new Response(JSON.stringify({ 
        error: 'Failed to reindex embeddings' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      // Clean and prepare text
      const cleanText = text.trim().replace(/\s+/g, ' ').substring(0, 2000);

      // Generate embedding using the AI model
      const response = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [cleanText]
      });

      if (!response || !response.data || !Array.isArray(response.data[0])) {
        throw new Error('Invalid embedding response format');
      }

      return response.data[0] as number[];
    } catch (error) {
      this.env.logger.error('Generate embedding error', { error: error as Error });
      throw error;
    }
  }

  private async updateItemEmbeddings(itemIds: number[]): Promise<number> {
    let updated = 0;

    for (const itemId of itemIds) {
      try {
        // Get item data
        const item = await this.env.MAIN_DB.prepare(`
          SELECT 
            i.item_id, i.title, i.description,
            GROUP_CONCAT(t.tag_name, ', ') as tags
          FROM items i
          LEFT JOIN item_tags it ON i.item_id = it.item_id
          LEFT JOIN tags t ON it.tag_id = t.tag_id
          WHERE i.item_id = ? AND i.status = 'Available'
          GROUP BY i.item_id, i.title, i.description
        `).bind(itemId).first() as EmbeddingData | null;

        if (item) {
          await this.updateItemEmbedding(item);
          updated++;
        }
      } catch (error) {
        this.env.logger.error('Failed to update embedding for item', { itemId, error: error as Error });
      }
    }

    return updated;
  }

  private async updateItemEmbedding(item: EmbeddingData): Promise<void> {
    try {
      // Create searchable text combining title, description, and tags
      const searchableText = [
        item.title,
        item.description || '',
        item.tags || ''
      ].filter(text => text && typeof text === 'string' && text.trim().length > 0).join(' ');

      if (!searchableText.trim()) {
        this.env.logger.warn(`No searchable text for item ${item.item_id}`);
        return;
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(searchableText);

      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding');
      }

      // Store embedding in vector index
      await this.env.ITEM_EMBEDDINGS.upsert([{
        id: item.item_id.toString(),
        values: embedding,
        metadata: {
          title: item.title,
          description: item.description || '',
          tags: item.tags || '',
          searchableText: searchableText.substring(0, 1000) // Truncate for metadata
        }
      }]);

      this.env.logger.debug('Updated embedding for item', { itemId: item.item_id });
    } catch (error) {
      this.env.logger.error('Error updating embedding for item', { itemId: item.item_id, error: error as Error });
      throw error;
    }
  }

  // Method to be called by the API service when items are created/updated
  async updateItemEmbeddingForId(itemId: number): Promise<void> {
    try {
      const item = await this.env.MAIN_DB.prepare(`
        SELECT 
          i.item_id, i.title, i.description,
          GROUP_CONCAT(t.tag_name, ', ') as tags
        FROM items i
        LEFT JOIN item_tags it ON i.item_id = it.item_id
        LEFT JOIN tags t ON it.tag_id = t.tag_id
        WHERE i.item_id = ? AND i.status = 'Available'
        GROUP BY i.item_id, i.title, i.description
      `).bind(itemId).first() as EmbeddingData | null;

      if (item) {
        await this.updateItemEmbedding(item);
      }
    } catch (error) {
      this.env.logger.error(`Failed to update embedding for item ${itemId}:`, { error: error as Error });
    }
  }

  // Method to be called when items are deleted
  async deleteItemEmbedding(itemId: number): Promise<void> {
    try {
      await this.env.ITEM_EMBEDDINGS.deleteByIds([itemId.toString()]);
      this.env.logger.debug('Deleted embedding for item', { itemId });
    } catch (error) {
      this.env.logger.error('Failed to delete embedding for item', { itemId, error: error as Error });
    }
  }
}