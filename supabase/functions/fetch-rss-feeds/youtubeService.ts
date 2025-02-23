
import { ContentItem } from './types.ts';

const YOUTUBE_CHANNEL_ID = 'UCG4Hp1KbGw4e02N7FpPXDgQ';

export async function fetchYouTubeVideos(): Promise<ContentItem[]> {
  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not found');
    }

    // Get the playlist ID for uploads
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
    const maxPages = 10; // Fetch up to 500 videos
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
}
