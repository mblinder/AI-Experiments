
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { fetchArticles } from './articleService.ts';
import { fetchPodcasts } from './podcastService.ts';
import { fetchYouTubeVideos } from './youtubeService.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to fetch all content...');
    
    // Parse request body
    const { updateDb = false, since = null } = await req.json();
    
    const [articles, podcasts, videos] = await Promise.all([
      fetchArticles(since),
      fetchPodcasts(since),
      fetchYouTubeVideos(since)
    ]);

    const allItems = [...articles, ...podcasts, ...videos].map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      image_url: item.imageUrl,
      date: item.date,
      link: item.link,
      source_tag_id: item.tags[0]?.id,
      source_tag_name: item.tags[0]?.name,
    }));

    if (updateDb && allItems.length > 0) {
      console.log(`Found ${allItems.length} new items to update`);
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Insert new items
      const { error } = await supabase
        .from('content_items')
        .upsert(allItems, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error upserting items:', error);
        throw error;
      }

      console.log(`Successfully processed ${allItems.length} items`);
    }

    return new Response(
      JSON.stringify({ success: true, itemsProcessed: allItems.length }),
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
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
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
