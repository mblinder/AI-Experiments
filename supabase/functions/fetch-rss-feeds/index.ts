
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { XMLParser } from 'npm:fast-xml-parser';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ARTICLES_FEED_URL = 'https://thebulwark.com/category/articles/feed/';
const PODCAST_FEED_URL = 'https://feeds.megaphone.fm/TPW1449071235';

// Bulwark Media channel ID
const YOUTUBE_CHANNEL_ID = 'UCG4Hp1KbGw4e02N7FpPXDgQ';
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

serve(async (req) => {
  console.log('Edge Function started');
  console.log('Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page = 1 } = await req.json();
    console.log('Fetching content for page:', page);

    // Configure XML parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      parseTrueNumberOnly: true,
      cdataTagName: '__cdata',
      cdataPositionChar: '\\c'
    });

    // Fetch and parse articles feed
    console.log('Starting to fetch articles feed...');
    const fetchArticles = async () => {
      try {
        console.log(`Fetching feed: ${ARTICLES_FEED_URL}`);
        const response = await fetch(ARTICLES_FEED_URL);
        console.log(`Articles feed status:`, response.status);
        
        if (!response.ok) {
          console.error(`Failed to fetch articles feed: ${response.status}`);
          return [];
        }
        
        const xmlData = await response.text();
        console.log(`Articles feed data length:`, xmlData.length);
        
        const result = parser.parse(xmlData);
        console.log('Articles feed parsed:', result?.rss?.channel?.title);
        const items = result?.rss?.channel?.item || [];
        return items.map(item => ({
          id: item.guid || item.link,
          title: item.title,
          description: item.description?.toString() || '',
          type: 'article',
          imageUrl: item.enclosure?.['@_url'] || 
                   item['media:content']?.['@_url'] || 
                   item['media:thumbnail']?.['@_url'],
          date: item.pubDate || new Date().toISOString(),
          link: item.link,
          tags: [{ id: 'source-article', name: 'Article', type: 'source' }]
        }));
      } catch (error) {
        console.error(`Error fetching articles feed:`, error);
        return [];
      }
    };

    // Fetch and parse podcast feed
    console.log('Starting to fetch podcast feed...');
    const fetchPodcasts = async () => {
      try {
        console.log(`Fetching feed: ${PODCAST_FEED_URL}`);
        const response = await fetch(PODCAST_FEED_URL);
        console.log(`Podcast feed status:`, response.status);
        
        if (!response.ok) {
          console.error(`Failed to fetch podcast feed: ${response.status}`);
          return [];
        }
        
        const xmlData = await response.text();
        console.log(`Podcast feed data length:`, xmlData.length);
        
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
          date: item.pubDate || new Date().toISOString(),
          link: item.link,
          tags: [{ id: 'source-podcast', name: 'Podcast', type: 'source' }]
        }));
      } catch (error) {
        console.error(`Error fetching podcast feed:`, error);
        return [];
      }
    };

    // Fetch and parse YouTube feed
    console.log('Starting to fetch YouTube feed...');
    const fetchYouTubeVideos = async () => {
      try {
        console.log('YouTube feed URL:', YOUTUBE_RSS_URL);
        const response = await fetch(YOUTUBE_RSS_URL);
        console.log('YouTube response status:', response.status);
        
        if (!response.ok) {
          console.error(`Failed to fetch YouTube feed: ${response.status}`);
          return [];
        }
        
        const xmlData = await response.text();
        console.log('YouTube data length:', xmlData.length);
        
        const result = parser.parse(xmlData);
        const entries = result?.feed?.entry || [];
        return entries.map(item => ({
          id: item.id,
          title: item.title,
          description: item.summary?.__cdata || item.summary || '',
          type: 'video',
          imageUrl: item['media:group']?.['media:thumbnail']?.['@_url'] || item['media:thumbnail']?.['@_url'] || '',
          date: item.published,
          link: item.link?.['@_href'] || item.link,
          tags: [{ id: 'source-video', name: 'Video', type: 'source' }]
        }));
      } catch (error) {
        console.error('Error fetching YouTube feed:', error);
        return [];
      }
    };

    console.log('Waiting for all feeds to be fetched...');
    const [articles, podcasts, videos] = await Promise.all([
      fetchArticles(),
      fetchPodcasts(),
      fetchYouTubeVideos()
    ]);
    console.log('All feeds fetched successfully');

    // Process items
    console.log('Processing all items...');
    console.log('Number of articles:', articles.length);
    console.log('Number of podcasts:', podcasts.length);
    console.log('Number of videos:', videos.length);

    // Combine and sort all items
    const allItems = [...articles, ...podcasts, ...videos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log(`Total items found: ${allItems.length}`);

    // Implement pagination
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    const hasMorePages = endIndex < allItems.length;
    
    console.log('Sending response with items:', paginatedItems.length);
    return new Response(
      JSON.stringify({
        items: paginatedItems,
        nextPage: hasMorePages ? page + 1 : null,
        total: allItems.length
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
