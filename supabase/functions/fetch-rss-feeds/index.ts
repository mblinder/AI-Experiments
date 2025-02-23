
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

const VIDEO_FEEDS = [
  'https://www.youtube.com/@bulwarkmedia/videos',
  'https://www.youtube.com/@bulwarkmedia/shorts'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page = 1 } = await req.json();
    console.log('Fetching content for page:', page);

    // Fetch and parse podcast feeds
    const podcastPromises = PODCAST_FEEDS.map(async (feedUrl) => {
      try {
        const response = await fetch(feedUrl);
        const xmlData = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(xmlData);
        return result.rss.channel.item || [];
      } catch (error) {
        console.error(`Error fetching podcast feed ${feedUrl}:`, error);
        return [];
      }
    });

    // Fetch and parse video feeds (YouTube)
    const videoPromises = VIDEO_FEEDS.map(async (feedUrl) => {
      try {
        // Note: YouTube RSS feed URLs need to be modified to get the actual RSS feed
        const rssUrl = feedUrl.replace('www.youtube.com/@', 'www.youtube.com/feeds/videos.xml?channel_id=');
        const response = await fetch(rssUrl);
        const xmlData = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(xmlData);
        return result.feed.entry || [];
      } catch (error) {
        console.error(`Error fetching video feed ${feedUrl}:`, error);
        return [];
      }
    });

    // Wait for all feeds to be fetched
    const [podcastResults, videoResults] = await Promise.all([
      Promise.all(podcastPromises),
      Promise.all(videoPromises)
    ]);

    // Combine and format all items
    const allPodcasts = podcastResults.flat().map(item => ({
      id: item.guid || item.link,
      title: item.title,
      description: item.description || '',
      type: 'podcast',
      imageUrl: item.image?.url || item['itunes:image']?.['@_href'],
      date: item.pubDate || new Date().toISOString(),
      link: item.link,
      tags: [{ id: 'source-podcast', name: 'Podcast', type: 'source' }]
    }));

    const allVideos = videoResults.flat().map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      type: 'video',
      imageUrl: item.thumbnail?.url,
      date: item.published,
      link: item.link,
      tags: [{ id: 'source-video', name: 'Video', type: 'source' }]
    }));

    // Combine all items and sort by date
    const allItems = [...allPodcasts, ...allVideos].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Implement pagination
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    const hasMorePages = endIndex < allItems.length;
    
    return new Response(
      JSON.stringify({
        items: paginatedItems,
        nextPage: hasMorePages ? page + 1 : null
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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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
