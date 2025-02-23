
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (updateDb) {
      console.log(`Processing content items...`);
      
      for (const item of [...articles, ...podcasts, ...videos]) {
        try {
          // First insert the main content item
          const { data: contentItem, error: contentError } = await supabase
            .from('content_items')
            .upsert({
              title: item.title,
              description: item.description,
              content_type: item.type,
              source_url: item.link,
              published_at: new Date(item.date).toISOString(),
            })
            .select()
            .single();

          if (contentError) throw contentError;
          if (!contentItem) throw new Error('Failed to insert content item');

          // Then insert the type-specific content
          if (item.type === 'article' && 'content' in item) {
            await supabase
              .from('articles')
              .upsert({
                content_id: contentItem.id,
                content: item.content,
                author: (item as any).author
              });
          } else if (item.type === 'video') {
            await supabase
              .from('videos')
              .upsert({
                content_id: contentItem.id,
                video_url: item.link,
                thumbnail_url: (item as any).thumbnailUrl,
                duration: (item as any).duration
              });
          } else if (item.type === 'podcast') {
            await supabase
              .from('podcasts')
              .upsert({
                content_id: contentItem.id,
                audio_url: item.link,
                duration: (item as any).duration,
                episode_number: (item as any).episodeNumber,
                season_number: (item as any).seasonNumber
              });
          }

          // Handle tags
          if (item.tags && item.tags.length > 0) {
            for (const tag of item.tags) {
              // Insert or get tag
              const { data: tagData, error: tagError } = await supabase
                .from('tags')
                .upsert({
                  name: tag.name,
                  type: tag.type
                })
                .select()
                .single();

              if (tagError) throw tagError;
              if (!tagData) throw new Error('Failed to insert tag');

              // Create content-tag association
              await supabase
                .from('content_tags')
                .upsert({
                  content_id: contentItem.id,
                  tag_id: tagData.id
                });
            }
          }

          console.log(`Successfully processed item: ${item.title}`);
        } catch (error) {
          console.error(`Error processing item ${item.title}:`, error);
          // Continue with next item
          continue;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        itemsProcessed: articles.length + podcasts.length + videos.length 
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
