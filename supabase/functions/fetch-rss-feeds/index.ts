
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

    // Fetch and parse podcast feeds
    console.log('Starting to fetch podcast feeds...');
    const podcastPromises = PODCAST_FEEDS.map(async (feedUrl) => {
      try {
        console.log(`Fetching podcast feed: ${feedUrl}`);
        const response = await fetch(feedUrl);
        console.log(`Podcast feed ${feedUrl} status:`, response.status);
        
        if (!response.ok) {
          console.error(`Failed to fetch podcast feed ${feedUrl}: ${response.status}`);
          return [];
        }
        
        const xmlData = await response.text();
        console.log(`Podcast feed ${feedUrl} data length:`, xmlData.length);
        
        const result = parser.parse(xmlData);
        console.log('Podcast feed parsed:', result?.rss?.channel?.title);
        const items = result?.rss?.channel?.item || [];
        return items.map(item => ({
          id: item.guid || item.link,
          title: item.title,
          description: item.description?.toString() || '',
          type: 'podcast',
          imageUrl: item['itunes:image']?.['@_href'] || item.image?.url,
          date: item.pubDate || new Date().toISOString(),
          link: item.link,
          tags: [{ id: 'source-podcast', name: 'Podcast', type: 'source' }]
        }));
      } catch (error) {
        console.error(`Error fetching podcast feed ${feedUrl}:`, error);
        return [];
      }
    });

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
    const [podcastResults, videoResults] = await Promise.all([
      Promise.all(podcastPromises),
      fetchYouTubeVideos()
    ]);
    console.log('All feeds fetched successfully');

    // Process podcast items
    console.log('Processing podcast items...');
    const allPodcasts = podcastResults.flat();
    console.log('Number of podcasts:', allPodcasts.length);

    // Process YouTube items
    console.log('Processing YouTube items...');
    const allVideos = videoResults || [];
    console.log('Number of videos:', allVideos.length);

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
