
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

// Initialize Supabase client
const supabaseUrl = 'https://pnaskrgaijwmjkbvxlfo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchContent(page: number): Promise<PagedResponse> {
  try {
    console.log('Calling fetch-rss-feeds function with page:', page);
    const { data, error } = await supabase.functions.invoke('fetch-rss-feeds', {
      body: { page },
    });

    if (error) {
      console.error('Error fetching content:', error);
      throw error;
    }

    console.log('Content fetched successfully:', data);
    return {
      items: data.items,
      nextPage: data.nextPage
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error; // Let the error propagate to be handled by the UI
  }
}
