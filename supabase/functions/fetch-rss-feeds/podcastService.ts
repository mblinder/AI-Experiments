
import { ContentItem } from './types.ts';
import { createXmlParser, fetchRssFeed } from './rssUtils.ts';

const PODCAST_FEEDS = [
  'https://api.substack.com/feed/podcast/87281/s/87957/private/24cf0715-6d20-4abd-bd0b-1040d00de2d5.rss',
  'https://api.substack.com/feed/podcast/87281/s/87961/private/24cf0715-6d20-4abd-bd0b-1040d00de2d5.rss',
  'https://feeds.megaphone.fm/TPW1449071235'
];

export async function fetchPodcasts(): Promise<ContentItem[]> {
  try {
    const allPodcasts = await Promise.all(
      PODCAST_FEEDS.map(async (feedUrl) => {
        try {
          console.log(`Fetching podcast feed: ${feedUrl}`);
          
          const xmlData = await fetchRssFeed(feedUrl);
          console.log(`Podcast feed data length for ${feedUrl}:`, xmlData.length);
          
          const parser = createXmlParser();
          const result = parser.parse(xmlData);
          console.log('Podcast feed parsed:', result?.rss?.channel?.title);
          
          const items = result?.rss?.channel?.item || [];
          return items.map(item => ({
            id: item.guid || item.link,
            title: item.title,
            description: item.description?.toString() || '',
            type: 'podcast',
            imageUrl: item['itunes:image']?.['@_href'] || 
                     item.image?.url || 
                     result?.rss?.channel?.['itunes:image']?.['@_href'],
            date: new Date(item.pubDate).toISOString(),
            link: item.link,
            tags: [{ 
              id: 'source-podcast', 
              name: result?.rss?.channel?.title || 'Podcast', 
              type: 'source' 
            }]
          }));
        } catch (error) {
          console.error(`Error fetching podcast feed ${feedUrl}:`, error);
          return [];
        }
      })
    );
    
    return allPodcasts.flat();
  } catch (error) {
    console.error('Error in fetchPodcasts:', error);
    return [];
  }
}
