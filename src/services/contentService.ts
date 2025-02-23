
import { XMLParser } from 'fast-xml-parser';
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

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized');
} else {
  console.warn('Missing Supabase configuration');
}

export async function fetchContent(page: number): Promise<PagedResponse> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Using mock data.');
    return {
      items: MOCK_PODCASTS,
      nextPage: null
    };
  }

  try {
    console.log('Fetching content from Supabase function...');
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
    // Fall back to mock data in case of error
    return {
      items: MOCK_PODCASTS,
      nextPage: null
    };
  }
}

// For development, we'll use mock data until we set up a proper backend proxy
// to handle the CORS issues with the RSS feeds
const MOCK_PODCASTS: ContentItem[] = [
  {
    id: '1',
    title: 'How to Fix It with John Avalon',
    description: 'John Avalon discusses solutions to today\'s biggest challenges',
    type: 'podcast',
    imageUrl: 'https://www.thebulwark.com/wp-content/uploads/2024/02/how-to-fix-it.jpg',
    date: new Date().toISOString(),
    link: 'https://www.thebulwark.com/s/how-to-fix-it-with-john-avalon',
    tags: [
      {
        id: 'source-fix-it',
        name: 'How to Fix It',
        type: 'source'
      },
      {
        id: 'participant-john-avalon',
        name: 'John Avalon',
        type: 'participant'
      }
    ]
  },
  {
    id: '2',
    title: 'The Focus Group: Understanding American Politics',
    description: 'Sarah Longwell and a panel of voters discuss their views on current political events and what shapes their decision-making.',
    type: 'podcast',
    imageUrl: 'https://www.thebulwark.com/wp-content/uploads/2023/06/focus-group.jpg',
    date: new Date().toISOString(),
    link: 'https://www.thebulwark.com/s/fypod',
    tags: [
      {
        id: 'source-focus-group',
        name: 'The Focus Group',
        type: 'source'
      },
      {
        id: 'participant-sarah-longwell',
        name: 'Sarah Longwell',
        type: 'participant'
      },
      {
        id: 'topic-politics',
        name: 'Politics',
        type: 'topic'
      }
    ]
  },
  {
    id: '3',
    title: 'The Focus Group: What Voters Think About Trump\'s Legal Issues',
    description: 'Sarah Longwell explores voter perspectives on the various legal challenges facing former President Trump and their impact on the upcoming election.',
    type: 'podcast',
    imageUrl: 'https://www.thebulwark.com/wp-content/uploads/2023/06/focus-group.jpg',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    link: 'https://www.thebulwark.com/s/fypod',
    tags: [
      {
        id: 'source-focus-group',
        name: 'The Focus Group',
        type: 'source'
      },
      {
        id: 'participant-sarah-longwell',
        name: 'Sarah Longwell',
        type: 'participant'
      },
      {
        id: 'topic-politics',
        name: 'Politics',
        type: 'topic'
      },
      {
        id: 'topic-legal',
        name: 'Legal',
        type: 'topic'
      }
    ]
  }
];
