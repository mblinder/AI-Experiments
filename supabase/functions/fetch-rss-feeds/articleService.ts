
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
          console.log(`Article feed data length for ${feedUrl}:`, xmlData.length);
          
          const result = parser.parse(xmlData);
          console.log('Article feed parsed:', result?.rss?.channel?.title);
          
          const items = result?.rss?.channel?.item || [];
          return items.map(item => {
            // First try to get content from content:encoded, then description
            let content = '';
            if (item['content:encoded']) {
              content = item['content:encoded'].toString();
            } else if (item.description) {
              content = item.description.toString();
            }
            
            console.log('Content length for article:', content.length);
            
            return {
              id: item.guid || item.link,
              title: item.title,
              description: content,
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
