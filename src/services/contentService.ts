
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

// Initialize Supabase client with direct values
const supabaseUrl = 'https://pnaskrgaijwmjkbvxlfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuYXNrcmdhaWp3bWprYnZ4bGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMDIzMjMsImV4cCI6MjA1NTg3ODMyM30.jpwQ5ENqgZVRg7LSpMt0fvrVVAu7cwOU7GkjaGCWKDA';

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
