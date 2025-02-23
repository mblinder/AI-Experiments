
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

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

type ContentType = Database['public']['Enums']['content_type'];

// Array of placeholder images for articles
const ARTICLE_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7'
];

// Get a consistent placeholder image based on the article ID
function getPlaceholderImage(id: string): string {
  const index = parseInt(id, 10) % ARTICLE_PLACEHOLDERS.length;
  return ARTICLE_PLACEHOLDERS[index];
}

export async function refreshFeeds() {
  console.log('Starting feed refresh...');
  
  try {
    const { data, error } = await supabase.functions.invoke('fetch-rss-feeds', {
      body: { 
        updateDb: true
      }
    });
    
    if (error) {
      console.error('Error refreshing feeds:', error);
      toast.error('Failed to refresh feeds');
      throw error;
    }
    
    console.log('Feed refresh completed:', data);
    toast.success('Feeds refreshed successfully');
    return data;
  } catch (error) {
    console.error('Failed to refresh feeds:', error);
    toast.error('Failed to refresh feeds');
    throw error;
  }
}

export async function fetchContent(page: number, contentType?: ContentType | 'all'): Promise<PagedResponse> {
  try {
    console.log('Fetching content with params:', { page, contentType });
    
    let query = supabase
      .from('content_items')
      .select(`
        *,
        articles (
          content
        ),
        videos (
          video_url,
          thumbnail_url,
          duration
        ),
        podcasts (
          audio_url,
          duration,
          episode_number,
          season_number
        ),
        content_tags (
          tags (
            id,
            name,
            type
          )
        )
      `)
      .order('published_at', { ascending: false });

    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
      throw error;
    }

    console.log('Fetched items:', items);

    const transformedItems: ContentItem[] = items.map(item => {
      let imageUrl: string | undefined;

      // Set the imageUrl based on content type
      if (item.content_type === 'video' && item.videos?.[0]?.thumbnail_url) {
        imageUrl = item.videos[0].thumbnail_url;
      } else if (item.content_type === 'article') {
        imageUrl = getPlaceholderImage(String(item.id)); // Convert number to string here
      } else if (item.content_type === 'podcast') {
        // You might want to add a default podcast artwork here if needed
        imageUrl = undefined;
      }

      return {
        id: String(item.id),
        title: item.title,
        description: item.description || '',
        type: item.content_type as ContentItem['type'],
        imageUrl,
        date: item.published_at,
        link: item.source_url,
        tags: item.content_tags?.map((tag: any) => ({
          id: String(tag.tags.id),
          name: tag.tags.name,
          type: tag.tags.type
        })) || []
      };
    });

    return {
      items: transformedItems,
      nextPage: null
    };
  } catch (error) {
    console.error('Error in fetchContent:', error);
    toast.error('Failed to fetch content');
    throw error;
  }
}

// Create and expose the content service immediately
const contentService = {
  refreshFeeds,
  fetchContent
};

// Expose to window object
if (typeof window !== 'undefined') {
  (window as any).contentService = contentService;
}

// Export for use in components
export default contentService;
