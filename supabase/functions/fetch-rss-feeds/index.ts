
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { XMLParser } from 'npm:fast-xml-parser';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PODCAST_FEEDS = [
  'https://api.substack.com/feed/podcast/87281/s/87957/private/24cf0715-6d20-4abd-bd0b-1040d00de2d5.rss',
  'https://api.substack.com/feed/podcast/87281/s/87961/private/24cf0715-6d20-4abd-bd0b-1040d00de2d5.rss'
];

// Bulwark Media channel
const YOUTUBE_CHANNEL = '@bulwarkmedia';
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?user=${YOUTUBE_CHANNEL}`;

serve(async (req) => {
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

    // Fetch and parse podcast feeds
    const podcastPromises = PODCAST_FEEDS.map(async (feedUrl) => {
      try {
        console.log(`Fetching podcast feed: ${feedUrl}`);
        const response = await fetch(feedUrl);
        if (!response.ok) {
          console.error(`Failed to fetch podcast feed ${feedUrl}: ${response.status}`);
          return [];
        }
        const xmlData = await response.text();
        const result = parser.parse(xmlData);
        console.log('Podcast feed parsed:', result?.rss?.channel?.title);
        return result?.rss?.channel?.item || [];
      } catch (error) {
        console.error(`Error fetching podcast feed ${feedUrl}:`, error);
        return [];
      }
    });

    // Fetch and parse YouTube feed
    const fetchYouTubeVideos = async () => {
      try {
        console.log('Fetching YouTube feed:', YOUTUBE_RSS_URL);
        const response = await fetch(YOUTUBE_RSS_URL);
        
        // Log the response status and URL
        console.log('YouTube response status:', response.status);
        console.log('YouTube response URL:', response.url);
        
        if (!response.ok) {
          console.error(`Failed to fetch YouTube feed: ${response.status}`);
          return [];
        }
        
        const xmlData = await response.text();
        console.log('YouTube XML data received:', xmlData.substring(0, 200) + '...'); // Log first 200 chars
        
        const result = parser.parse(xmlData);
        console.log('YouTube feed parsed result:', JSON.stringify(result, null, 2));
        
        return result?.feed?.entry || [];
      } catch (error) {
        console.error('Error fetching YouTube feed:', error);
        console.error('Error details:', error.stack);
        return [];
      }
    };

    // Wait for all feeds to be fetched
    const [podcastResults, videoResults] = await Promise.all([
      Promise.all(podcastPromises),
      fetchYouTubeVideos()
    ]);

    // Process podcast items
    const allPodcasts = podcastResults.flat().map(item => {
      console.log('Processing podcast item:', item.title);
      return {
        id: item.guid || item.link,
        title: item.title,
        description: item.description?.toString() || '',
        type: 'podcast',
        imageUrl: item['itunes:image']?.['@_href'] || item.image?.url,
        date: item.pubDate || new Date().toISOString(),
        link: item.link,
        tags: [{ id: 'source-podcast', name: 'Podcast', type: 'source' }]
      };
    });

    // Process YouTube items
    const allVideos = (Array.isArray(videoResults) ? videoResults : []).map(item => {
      console.log('Processing video item:', JSON.stringify(item, null, 2));
      return {
        id: item.id,
        title: item.title,
        description: item.summary?.__cdata || item.summary || '',
        type: 'video',
        imageUrl: item['media:group']?.['media:thumbnail']?.['@_url'] || item['media:thumbnail']?.['@_url'] || '',
        date: item.published,
        link: item.link?.['@_href'] || item.link,
        tags: [{ id: 'source-video', name: 'Video', type: 'source' }]
      };
    });

    // Combine and sort all items
    const allItems = [...allPodcasts, ...allVideos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log(`Total items found: ${allItems.length} (${allPodcasts.length} podcasts, ${allVideos.length} videos)`);

    // Implement pagination
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    const hasMorePages = endIndex < allItems.length;
    
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
