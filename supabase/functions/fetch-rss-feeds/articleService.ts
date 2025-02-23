
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
            // Extract full content from either 'content:encoded' or 'description'
            const content = item['content:encoded'] || item.description;
            
            return {
              id: item.guid || item.link,
              title: item.title,
              description: content?.toString() || '',
              type: 'article',
              imageUrl: item.enclosure?.['@_url'] || 
                       item['media:content']?.['@_url'] || 
                       item['media:thumbnail']?.['@_url'],
              date: new Date(item.pubDate).toISOString(),
              link: item.link,
              tags: [{ 
                id: 'source-article', 
                name: feedUrl.includes('thetriad') ? 'The Triad' : 'Morning Shots', 
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
