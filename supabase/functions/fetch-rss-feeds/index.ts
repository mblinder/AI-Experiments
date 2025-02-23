
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { fetchArticles } from './articleService.ts';
import { fetchPodcasts } from './podcastService.ts';
import { fetchYouTubeVideos } from './youtubeService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge Function started');
  console.log('Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page = 1 } = await req.json();
    console.log('Fetching content for page:', page);

    console.log('Starting to fetch all content...');
    const [articles, podcasts, videos] = await Promise.all([
      fetchArticles(),
      fetchPodcasts(),
      fetchYouTubeVideos()
    ]);
    console.log('All content fetched successfully');

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
    console.log('Sample of items to verify content:');
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
