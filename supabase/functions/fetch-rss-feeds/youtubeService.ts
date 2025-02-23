
import { ContentItem } from './types.ts';

export async function fetchYouTubeVideos(since?: string | null): Promise<ContentItem[]> {
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key not found');
    return [];
  }

  try {
    // The Bulwark's YouTube channel ID
    const channelId = 'UCnYB8tm6MXO5PSEfx9WJkOw';
    
    // Construct the search URL
    const baseUrl = 'https://www.googleapis.com/youtube/v3/search';
    const params = new URLSearchParams({
      part: 'snippet',
      channelId: channelId,
      maxResults: '50',
      order: 'date',
      type: 'video',
      key: YOUTUBE_API_KEY
    });

    if (since) {
      params.append('publishedAfter', new Date(since).toISOString());
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.items?.length || 0} videos from YouTube`);

    return (data.items || []).map((item: any) => ({
      id: `yt-${item.id.videoId}`,
      title: item.snippet.title,
      description: item.snippet.description,
      type: 'video',
      imageUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      date: item.snippet.publishedAt,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      tags: [{
        id: 'youtube',
        name: 'YouTube',
        type: 'source'
      }]
    }));

  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
}
