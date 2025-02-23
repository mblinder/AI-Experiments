
import { ContentItem } from './types.ts';
import { createXmlParser, fetchRssFeed } from './rssUtils.ts';

const ARTICLES_FEEDS = [
  'https://thetriad.thebulwark.com/feed',
  'https://morningshots.thebulwark.com/feed'
];

export async function fetchArticles(): Promise<ContentItem[]> {
  try {
    const parser = createXmlParser();
    
    const allArticles = await Promise.all(
      ARTICLES_FEEDS.map(async (feedUrl) => {
        console.log(`Fetching article feed: ${feedUrl}`);
        
        try {
          const xmlData = await fetchRssFeed(feedUrl);
          const result = parser.parse(xmlData);
          
          const items = result?.rss?.channel?.item || [];
          return items.map(item => {
            const description = item['content:encoded']?.toString() || 
                              item.description?.toString() || '';
            
            return {
              id: item.guid || item.link,
              title: item.title,
              description: description,
              type: 'article',
              imageUrl: item.enclosure?.['@_url'] || 
                       item['media:content']?.['@_url'] || 
                       item['media:thumbnail']?.['@_url'],
              date: new Date(item.pubDate).toISOString(),
              link: item.link,
              tags: [{ 
                id: `source-${result?.rss?.channel?.title?.toLowerCase().replace(/\s+/g, '-') || 'article'}`,
                name: result?.rss?.channel?.title || 'Article', 
                type: 'source' 
              }]
            };
          });
        } catch (error) {
          console.error(`Error fetching article feed ${feedUrl}:`, error);
          return [];
        }
      })
    );
    
    return allArticles.flat();
  } catch (error) {
    console.error('Error in fetchArticles:', error);
    return [];
  }
}
