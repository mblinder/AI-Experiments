
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

const PODCAST_FEEDS = [
  'https://api.substack.com/feed/podcast/87281/s/87957/private/24cf0715-6d20-4abd-bd0b-1040d00de2d5.rss',
  'https://api.substack.com/feed/podcast/87281/s/87961/private/24cf0715-6d20-4abd-bd0b-1040d00de2d5.rss'
];

const parser = new XMLParser();

async function fetchPodcastContent(): Promise<ContentItem[]> {
  const podcastItems: ContentItem[] = [];
  
  for (const feed of PODCAST_FEEDS) {
    try {
      const response = await fetch(feed);
      const xml = await response.text();
      const result = parser.parse(xml);
      
      const channel = result.rss.channel;
      const items = Array.isArray(channel.item) ? channel.item : [channel.item];
      
      items.forEach((item: any) => {
        podcastItems.push({
          id: item.guid,
          title: item.title,
          description: item.description,
          type: 'podcast',
          imageUrl: channel.image?.url,
          date: new Date(item.pubDate).toISOString(),
          link: item.link,
          tags: [
            {
              id: `source-${channel.title}`,
              name: channel.title,
              type: 'source'
            }
          ]
        });
      });
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
    }
  }
  
  return podcastItems;
}

export async function fetchContent(page: number = 1): Promise<ContentItem[]> {
  // For now, we'll just implement podcast fetching
  // YouTube integration will need to be added later as it requires API keys
  const podcastContent = await fetchPodcastContent();
  return podcastContent;
}
