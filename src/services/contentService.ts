
import { XMLParser } from 'fast-xml-parser';

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
  }
];

export async function fetchContent(page: number): Promise<PagedResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For now, return mock data
  // In production, this would fetch from the RSS feeds via a backend proxy
  return {
    items: MOCK_PODCASTS,
    nextPage: null // No more pages in our mock data
  };
}
