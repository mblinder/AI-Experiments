
import { createClient } from '@supabase/supabase-js';

export interface ContentTag {
  id: string;
  name: string;
  type: 'participant' | 'topic' | 'source' | 'author';
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'podcast';
  imageUrl?: string;
  date: string;
  link: string;
  tags: ContentTag[];
}

interface PagedResponse {
  items: ContentItem[];
  nextPage: number | null;
}

const supabaseUrl = 'https://pnaskrgaijwmjkbvxlfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuYXNrcmdhaWp3bWprYnZ4bGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMDIzMjMsImV4cCI6MjA1NTg3ODMyM30.jpwQ5ENqgZVRg7LSpMt0fvrVVAu7cwOU7GkjaGCWKDA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchContent(page: number, contentType?: string): Promise<PagedResponse> {
  try {
    const initialPageSize = 25;
    const subsequentPageSize = 10;
    const itemsPerPage = page === 1 ? initialPageSize : subsequentPageSize;
    const start = page === 1 ? 0 : initialPageSize + ((page - 2) * subsequentPageSize);
    const end = start + itemsPerPage - 1;

    // First, trigger the feed fetch function to update the database
    await supabase.functions.invoke('fetch-rss-feeds', {
      body: { updateDb: true },
    });

    // Build the query with date as the primary sort criterion
    let query = supabase
      .from('content_items')
      .select(`
        *,
        content_item_tags:content_item_tags (
          content_tags (
            id,
            name,
            type
          )
        )
      `, { count: 'exact' })
      .order('date', { ascending: false }) // Primary sort by date
      .order('id', { ascending: false }); // Secondary sort by ID to ensure consistent ordering

    // Add content type filter if specified
    if (contentType && contentType !== 'all') {
      query = query.eq('type', contentType);
    }

    // Add pagination
    query = query.range(start, end);

    const { data: items, error, count } = await query;

    if (error) {
      console.error('Error fetching content:', error);
      throw error;
    }

    // Transform the data to match the ContentItem interface
    const transformedItems: ContentItem[] = items.map(item => {
      const tags: ContentTag[] = item.content_item_tags?.map((tag: any) => ({
        id: tag.content_tags.id,
        name: tag.content_tags.name,
        type: tag.content_tags.type as ContentTag['type']
      })).filter(Boolean) || [];

      if (item.source_tag_id && item.source_tag_name) {
        tags.push({
          id: item.source_tag_id,
          name: item.source_tag_name,
          type: 'source' as const
        });
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type as 'article' | 'video' | 'podcast',
        imageUrl: item.image_url,
        date: item.date,
        link: item.link,
        tags
      };
    });

    const totalItems = count || 0;
    const currentPosition = start + transformedItems.length;
    const hasMore = currentPosition < totalItems;

    return {
      items: transformedItems,
      nextPage: hasMore ? page + 1 : null
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}
