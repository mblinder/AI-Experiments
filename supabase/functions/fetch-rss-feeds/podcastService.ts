
import { ContentItem } from './types.ts';
import { createXmlParser, fetchRssFeed } from './rssUtils.ts';

const PODCAST_FEEDS: string[] = [];

export async function fetchPodcasts(since?: string | null): Promise<ContentItem[]> {
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
          return items
            .map(item => {
              const pubDate = new Date(item.pubDate);
              
              // Skip items older than the since date if provided
              if (since && pubDate <= new Date(since)) {
                return null;
              }
              
              return {
                id: item.guid || item.link,
                title: item.title,
                description: item.description?.toString() || '',
                type: 'podcast',
                imageUrl: item['itunes:image']?.['@_href'] || 
                         item.image?.url || 
                         result?.rss?.channel?.['itunes:image']?.['@_href'],
                date: pubDate.toISOString(),
                link: item.link,
                tags: [{ 
                  id: 'source-podcast', 
                  name: result?.rss?.channel?.title || 'Podcast', 
                  type: 'source' 
                }]
              };
            })
            .filter(Boolean); // Remove null items
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
