
import { ContentItem } from './types.ts';

const YOUTUBE_CHANNELS = [
  'UCsT0YIqwnpJCM-mx7-gSA4Q', // TEDx Talks
  'UC3XTzVzaHQEd30rQbuvCtTQ', // LastWeekTonight
  'UCVTyTA7-g9nopHeHbeuvpRA', // Late Night with Seth Meyers
];

export async function fetchYouTubeVideos(since?: string | null): Promise<ContentItem[]> {
  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    console.log('YouTube API Key exists:', !!YOUTUBE_API_KEY);
    
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key not found');
      return [];
    }

    const videos: ContentItem[] = [];
    console.log('Fetching videos for channels:', YOUTUBE_CHANNELS);

    for (const channelId of YOUTUBE_CHANNELS) {
      try {
        console.log(`Fetching channel data for ${channelId}`);
        // First get the channel's upload playlist
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );
        const channelData = await channelResponse.json();
        console.log('Channel response status:', channelResponse.status);
        
        if (!channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads) {
          console.error(`Could not find uploads playlist for channel ${channelId}`, channelData);
          continue;
        }

        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        console.log(`Found uploads playlist: ${uploadsPlaylistId}`);

        // Then get the videos from that playlist
        const playlistResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`
        );
        const playlistData = await playlistResponse.json();
        console.log('Playlist response status:', playlistResponse.status);

        if (!playlistData.items) {
          console.error(`No videos found for channel ${channelId}`, playlistData);
          continue;
        }

        console.log(`Found ${playlistData.items.length} videos in playlist`);

        // Get detailed video information for each video
        for (const item of playlistData.items) {
          const videoId = item.snippet.resourceId.videoId;
          console.log(`Fetching details for video ${videoId}`);
          
          const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
          );
          const videoData = await videoResponse.json();
          console.log('Video response status:', videoResponse.status);
          
          const videoDetails = videoData.items?.[0];

          if (videoDetails) {
            const publishedAt = new Date(item.snippet.publishedAt);
            
            // If since is provided, skip videos that are older
            if (since && publishedAt < new Date(since)) {
              console.log(`Skipping video ${videoId} - too old`);
              continue;
            }

            // Parse duration from ISO 8601 format
            const duration = videoDetails.contentDetails.duration;
            const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const hours = parseInt(durationMatch?.[1] || '0');
            const minutes = parseInt(durationMatch?.[2] || '0');
            const seconds = parseInt(durationMatch?.[3] || '0');
            const durationInSeconds = (hours * 3600) + (minutes * 60) + seconds;

            videos.push({
              title: item.snippet.title,
              description: item.snippet.description,
              link: `https://www.youtube.com/watch?v=${videoId}`,
              date: item.snippet.publishedAt,
              type: 'video',
              thumbnailUrl: item.snippet.thumbnails.maxres?.url || 
                          item.snippet.thumbnails.standard?.url || 
                          item.snippet.thumbnails.high?.url,
              duration: durationInSeconds,
              tags: [
                {
                  name: item.snippet.channelTitle,
                  type: 'source'
                }
              ]
            });
            console.log(`Successfully processed video ${videoId}`);
          }
        }
      } catch (error) {
        console.error(`Error fetching videos for channel ${channelId}:`, error);
      }
    }

    console.log(`Total videos processed: ${videos.length}`);
    return videos;
  } catch (error) {
    console.error('Error in fetchYouTubeVideos:', error);
    return [];
  }
}
