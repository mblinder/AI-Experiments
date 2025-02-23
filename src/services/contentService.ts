
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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

export async function refreshFeeds() {
  // Call the edge function without a since parameter - it will use the global config
  const { data, error } = await supabase.functions.invoke('fetch-rss-feeds', {
    body: { 
      updateDb: true
    }
  });
  
  if (error) {
    console.error('Error refreshing feeds:', error);
    throw error;
  }
  
  return data;
}

export async function fetchContent(page: number, contentType?: ContentType | 'all'): Promise<PagedResponse> {
  try {
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
      throw error;
    }

    const transformedItems: ContentItem[] = items.map(item => ({
      id: String(item.id),
      title: item.title,
      description: item.description || '',
      type: item.content_type as ContentItem['type'],
      imageUrl: item.videos?.[0]?.thumbnail_url || undefined,
      date: item.published_at,
      link: item.source_url,
      tags: item.content_tags?.map((tag: any) => ({
        id: String(tag.tags.id),
        name: tag.tags.name,
        type: tag.tags.type
      })) || []
    }));

    return {
      items: transformedItems,
      nextPage: null
    };
  } catch (error) {
    console.error('Error in fetchContent:', error);
    throw error;
  }
}
