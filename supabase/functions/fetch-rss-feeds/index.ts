
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
    
    // Initialize Supabase client first
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { updateDb = false } = await req.json();
    
    // Get the last fetch timestamp from global config
    const { data: configData, error: configError } = await supabase
      .from('global_config')
      .select('value')
      .eq('key', 'last_feed_fetch')
      .single();

    if (configError) {
      console.error('Error fetching last_feed_fetch:', configError);
    }

    const since = configData?.value?.timestamp || null;
    console.log('Last fetch timestamp:', since);

    // Check if YouTube API key exists
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    console.log('YouTube API Key exists:', !!youtubeApiKey);

    const [articles, podcasts, videos] = await Promise.all([
      fetchArticles(since),
      fetchPodcasts(since),
      fetchYouTubeVideos(since)
    ]);

    console.log('Fetched content counts:', {
      articles: articles?.length || 0,
      podcasts: podcasts?.length || 0,
      videos: videos?.length || 0
    });

    let processedItems = 0;

    if (updateDb) {
      console.log('Processing content items...');
      
      // Process articles
      if (articles && articles.length > 0) {
        for (const article of articles) {
          const { error: contentError } = await supabase
            .from('content_items')
            .insert({
              title: article.title,
              description: article.description,
              source_url: article.link,
              content_type: 'article',
              published_at: article.date
            })
            .select()
            .single();

          if (contentError) {
            console.error('Error inserting article:', contentError);
            continue;
          }

          processedItems++;
        }
      }

      // Process podcasts
      if (podcasts && podcasts.length > 0) {
        for (const podcast of podcasts) {
          const { error: contentError } = await supabase
            .from('content_items')
            .insert({
              title: podcast.title,
              description: podcast.description,
              source_url: podcast.link,
              content_type: 'podcast',
              published_at: podcast.date
            })
            .select()
            .single();

          if (contentError) {
            console.error('Error inserting podcast:', contentError);
            continue;
          }

          processedItems++;
        }
      }

      // Process videos
      if (videos && videos.length > 0) {
        for (const video of videos) {
          console.log('Processing video:', video.title);
          
          const { data: contentData, error: contentError } = await supabase
            .from('content_items')
            .insert({
              title: video.title,
              description: video.description,
              source_url: video.link,
              content_type: 'video',
              published_at: video.date
            })
            .select()
            .single();

          if (contentError) {
            console.error('Error inserting video:', contentError);
            continue;
          }

          if (contentData) {
            const { error: videoError } = await supabase
              .from('videos')
              .insert({
                content_id: contentData.id,
                video_url: video.link,
                thumbnail_url: video.thumbnail,
                duration: video.duration
              });

            if (videoError) {
              console.error('Error inserting video details:', videoError);
              continue;
            }

            processedItems++;
          }
        }
      }

      // Update the last fetch timestamp
      const { error: updateError } = await supabase
        .from('global_config')
        .update({ 
          value: { timestamp: new Date().toISOString() },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'last_feed_fetch');

      if (updateError) {
        console.error('Error updating last fetch timestamp:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        itemsProcessed: processedItems
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
