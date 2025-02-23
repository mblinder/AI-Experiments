
import { createClient } from '@supabase/supabase-js';

export interface ContentTag {
  id: string;
  name: string;
  type: 'participant' | 'topic' | 'source';
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

export async function fetchContent(page: number): Promise<PagedResponse> {
  try {
    const itemsPerPage = 25;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;

    // First, trigger the feed fetch function to update the database
    await supabase.functions.invoke('fetch-rss-feeds', {
      body: { updateDb: true },
    });

    // Then fetch paginated results from the database
    const { data: items, error, count } = await supabase
      .from('content_items')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(start, end);

    if (error) {
      console.error('Error fetching content:', error);
      throw error;
    }

    // Transform the data to match the ContentItem interface with proper typing
    const transformedItems: ContentItem[] = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: item.type as 'article' | 'video' | 'podcast',
      imageUrl: item.image_url,
      date: item.date,
      link: item.link,
      tags: [{
        id: item.source_tag_id || `source-${item.type}`,
        name: item.source_tag_name || item.type,
        type: 'source' as const // Explicitly type this as a literal 'source'
      }]
    }));

    const hasMore = count ? count > (page * itemsPerPage) : false;

    return {
      items: transformedItems,
      nextPage: hasMore ? page + 1 : null
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}
