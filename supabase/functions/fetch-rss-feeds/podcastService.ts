
import { ContentItem } from './types.ts';
import { createXmlParser, fetchRssFeed } from './rssUtils.ts';

const PODCAST_FEEDS = [
  'https://thebulwark.substack.com/podcast/87957',  // Public URL for Bulwark podcast
  'https://thebulwark.substack.com/podcast/87961'   // Public URL for Focus Group podcast
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
