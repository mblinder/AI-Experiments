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
    const { updateDb = false } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the last fetch timestamp from global config
    const { data: configData } = await supabase
      .from('global_config')
      .select('value')
      .eq('key', 'last_feed_fetch')
      .single();

    const since = configData?.value?.timestamp || null;
    console.log('Last fetch timestamp:', since);

    const [articles, podcasts, videos] = await Promise.all([
      fetchArticles(since),
      fetchPodcasts(since),
      fetchYouTubeVideos(since)
    ]);

    let processedItems = 0;

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
            }, {
              onConflict: 'source_url',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (contentError) {
            console.error('Error inserting content item:', contentError);
            continue;
          }
          if (!contentItem) {
            console.error('Failed to insert content item');
            continue;
          }

          console.log(`Processing content item: ${contentItem.id} - ${item.title}`);

          // Then insert the type-specific content
          if (item.type === 'article' && 'content' in item) {
            const { error: articleError } = await supabase
              .from('articles')
              .upsert({
                content_id: contentItem.id,
                content: item.content,
                author: (item as any).author
              });
            
            if (articleError) console.error('Error inserting article:', articleError);
          } else if (item.type === 'video') {
            const { error: videoError } = await supabase
              .from('videos')
              .upsert({
                content_id: contentItem.id,
                video_url: item.link,
                thumbnail_url: (item as any).thumbnailUrl,
                duration: (item as any).duration
              });
            
            if (videoError) console.error('Error inserting video:', videoError);
          } else if (item.type === 'podcast') {
            const { error: podcastError } = await supabase
              .from('podcasts')
              .upsert({
                content_id: contentItem.id,
                audio_url: item.link,
                duration: (item as any).duration,
                episode_number: (item as any).episodeNumber,
                season_number: (item as any).seasonNumber
              });
            
            if (podcastError) console.error('Error inserting podcast:', podcastError);
          }

          // Handle tags
          if (item.tags && item.tags.length > 0) {
            for (const tag of item.tags) {
              try {
                // First try to get existing tag
                let { data: existingTag } = await supabase
                  .from('tags')
                  .select('id')
                  .eq('name', tag.name)
                  .eq('type', tag.type)
                  .single();

                if (!existingTag) {
                  // If tag doesn't exist, create it
                  const { data: newTag, error: tagError } = await supabase
                    .from('tags')
                    .insert({
                      name: tag.name,
                      type: tag.type
                    })
                    .select()
                    .single();

                  if (tagError) {
                    console.error('Error inserting tag:', tagError);
                    continue;
                  }
                  existingTag = newTag;
                }

                // Create content-tag association
                if (existingTag) {
                  const { error: linkError } = await supabase
                    .from('content_tags')
                    .upsert({
                      content_id: contentItem.id,
                      tag_id: existingTag.id
                    });

                  if (linkError) console.error('Error linking tag to content:', linkError);
                }
              } catch (tagError) {
                console.error(`Error processing tag ${tag.name}:`, tagError);
              }
            }
          }

          processedItems++;
          console.log(`Successfully processed item: ${item.title}`);
        } catch (error) {
          console.error(`Error processing item ${item.title}:`, error);
          continue;
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
