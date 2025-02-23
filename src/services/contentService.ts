
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

const INITIAL_PAGE_SIZE = 10;
const SUBSEQUENT_PAGE_SIZE = 10;
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

let lastUpdateTime = 0;

async function checkForNewContent() {
  const now = Date.now();
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }

  try {
    const { data: latestItem, error: latestError } = await supabase
      .from('content_items')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error('Error fetching latest content:', latestError);
      return;
    }

    if (latestItem) {
      console.log('Checking for new content since:', new Date(latestItem.date).toISOString());
      await supabase.functions.invoke('fetch-rss-feeds', {
        body: { 
          updateDb: true,
          since: latestItem.date 
        },
      });
    } else {
      console.log('No existing content, performing full fetch');
      await supabase.functions.invoke('fetch-rss-feeds', {
        body: { updateDb: true },
      });
    }
    
    lastUpdateTime = now;
  } catch (error) {
    console.error('Error checking for new content:', error);
  }
}

export async function fetchContent(page: number, contentType?: string): Promise<PagedResponse> {
  try {
    const itemsPerPage = page === 1 ? INITIAL_PAGE_SIZE : SUBSEQUENT_PAGE_SIZE;
    const start = page === 1 ? 0 : INITIAL_PAGE_SIZE + ((page - 2) * SUBSEQUENT_PAGE_SIZE);
    const end = start + itemsPerPage - 1;

    if (page === 1) {
      await checkForNewContent();
    }

    // Modified query to use left join
    let query = supabase
      .from('content_items')
      .select(`
        id,
        title,
        description,
        type,
        image_url,
        date,
        link,
        content_item_tags:content_item_tags (
          content_tags (
            id,
            name,
            type
          )
        )
      `)
      .order('date', { ascending: false });

    if (contentType && contentType !== 'all') {
      query = query.eq('type', contentType);
    }

    const { data: items, error } = await query
      .range(start, end);

    if (error) {
      console.error('Error fetching content:', error);
      throw error;
    }

    const transformedItems: ContentItem[] = items?.map(item => {
      const tags: ContentTag[] = item.content_item_tags
        ?.map((tag: any) => ({
          id: tag.content_tags.id.toString(),
          name: tag.content_tags.name,
          type: tag.content_tags.type
        }))
        .filter(Boolean) || [];

      return {
        id: item.id.toString(),
        title: item.title,
        description: item.description || '',
        type: item.type,
        imageUrl: item.image_url,
        date: item.date,
        link: item.link,
        tags
      };
    }) || [];

    const hasMore = items && items.length === itemsPerPage;

    return {
      items: transformedItems,
      nextPage: hasMore ? page + 1 : null
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}
