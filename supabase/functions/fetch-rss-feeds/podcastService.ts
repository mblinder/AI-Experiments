
import { ContentItem } from './types.ts';
import { createXmlParser, fetchRssFeed } from './rssUtils.ts';

const PODCAST_FEED_URL = 'https://feeds.megaphone.fm/TPW1449071235';

export async function fetchPodcasts(): Promise<ContentItem[]> {
  try {
    console.log(`Fetching podcast feed: ${PODCAST_FEED_URL}`);
    
    const xmlData = await fetchRssFeed(PODCAST_FEED_URL);
    console.log(`Podcast feed data length:`, xmlData.length);
    
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
      tags: [{ id: 'source-podcast', name: 'Podcast', type: 'source' }]
    }));
  } catch (error) {
    console.error('Error in fetchPodcasts:', error);
    return [];
  }
}
