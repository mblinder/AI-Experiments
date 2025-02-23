import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { XMLParser } from 'npm:fast-xml-parser';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ARTICLES_FEEDS = [
  'https://thetriad.thebulwark.com/feed',
  'https://morningshots.thebulwark.com/feed'
];

const PODCAST_FEED_URL = 'https://feeds.megaphone.fm/TPW1449071235';
const YOUTUBE_CHANNEL_ID = 'UCG4Hp1KbGw4e02N7FpPXDgQ';

serve(async (req) => {
  console.log('Edge Function started');
  console.log('Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page = 1 } = await req.json();
    console.log('Fetching content for page:', page);

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

    console.log('Starting to fetch articles feeds...');
    const fetchArticles = async () => {
      try {
        const allArticles = await Promise.all(
          ARTICLES_FEEDS.map(async (feedUrl) => {
            console.log(`Fetching feed: ${feedUrl}`);
            const response = await fetch(feedUrl);
            console.log(`Articles feed status for ${feedUrl}:`, response.status);
            
            if (!response.ok) {
              console.error(`Failed to fetch articles feed ${feedUrl}: ${response.status}`);
              return [];
            }
            
            const xmlData = await response.text();
            console.log(`Articles feed data length for ${feedUrl}:`, xmlData.length);
            
            const result = parser.parse(xmlData);
            console.log('Articles feed parsed:', result?.rss?.channel?.title);
            
            const items = result?.rss?.channel?.item || [];
            return items.map(item => {
              // Extract content from either 'content:encoded' or 'description'
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
          })
        );
        return allArticles.flat();
      } catch (error) {
        console.error(`Error fetching articles feeds:`, error);
        return [];
      }
    };

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
          date: new Date(item.pubDate).toISOString(),
          link: item.link,
          tags: [{ id: 'source-podcast', name: 'Podcast', type: 'source' }]
        }));
      } catch (error) {
        console.error(`Error fetching podcast feed:`, error);
        return [];
      }
    };

    console.log('Starting to fetch YouTube videos...');
    const fetchYouTubeVideos = async () => {
      try {
        const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
        if (!YOUTUBE_API_KEY) {
          throw new Error('YouTube API key not found');
        }

        // First, get the playlist ID for uploads
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
        );
        
        if (!channelResponse.ok) {
          throw new Error(`Failed to fetch channel data: ${channelResponse.status}`);
        }

        const channelData = await channelResponse.json();
        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

        let allVideos = [];
        let nextPageToken = null;
        let totalFetched = 0;
        const maxResults = 50; // Maximum allowed by YouTube API
        const maxPages = 10; // Fetch up to 500 videos (10 pages * 50 videos)
        let currentPage = 0;

        do {
          console.log(`Fetching YouTube videos page ${currentPage + 1}, nextPageToken:`, nextPageToken);
          
          const pageUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
          pageUrl.searchParams.append('part', 'snippet');
          pageUrl.searchParams.append('maxResults', maxResults.toString());
          pageUrl.searchParams.append('playlistId', uploadsPlaylistId);
          pageUrl.searchParams.append('key', YOUTUBE_API_KEY);
          if (nextPageToken) {
            pageUrl.searchParams.append('pageToken', nextPageToken);
          }

          const videoResponse = await fetch(pageUrl.toString());

          if (!videoResponse.ok) {
            throw new Error(`Failed to fetch videos: ${videoResponse.status}`);
          }

          const videoData = await videoResponse.json();
          console.log(`Found ${videoData.items.length} videos on page ${currentPage + 1}`);

          const pageVideos = videoData.items.map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description || '',
            type: 'video',
            imageUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            date: new Date(item.snippet.publishedAt).toISOString(),
            link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            tags: [{ id: 'source-video', name: 'Video', type: 'source' }]
          }));

          allVideos = [...allVideos, ...pageVideos];
          totalFetched += videoData.items.length;
          nextPageToken = videoData.nextPageToken;
          currentPage++;

          // Break if we've reached maxPages or there are no more pages
          if (currentPage >= maxPages || !nextPageToken) {
            break;
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } while (nextPageToken);

        console.log(`Total YouTube videos fetched: ${totalFetched}`);
        return allVideos;
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        console.error(error.stack);
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

    // Process items and ensure dates are properly parsed
    const allItems = [...articles, ...podcasts, ...videos].map(item => ({
      ...item,
      date: new Date(item.date).toISOString() // Normalize all dates to ISO string format
    }));

    // Sort all items by date
    const sortedItems = allItems.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log(`Total items found: ${sortedItems.length}`);
    console.log('Sample of dates to verify sorting:');
    sortedItems.slice(0, 5).forEach(item => {
      console.log(`${item.type} - ${item.date} - ${item.title}`);
    });

    // Implement pagination
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    const hasMorePages = endIndex < sortedItems.length;
    
    console.log('Sending response with items:', paginatedItems.length);
    return new Response(
      JSON.stringify({
        items: paginatedItems,
        nextPage: hasMorePages ? page + 1 : null,
        total: sortedItems.length
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
