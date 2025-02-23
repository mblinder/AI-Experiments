
export const stripHtmlTags = (html: string) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const getMediaUrl = (url: string): string => {
  if (url.includes('substack.com')) {
    return url.replace('/feed/podcast/', '/podcast/player-') + '.mp3';
  }
  
  if (url.includes('podcasts.apple.com')) {
    const showIdMatch = url.match(/\/id(\d+)/);
    const episodeIdMatch = url.match(/\?i=(\d+)/);
    
    if (showIdMatch && episodeIdMatch) {
      const showId = showIdMatch[1];
      const episodeId = episodeIdMatch[1];
      return `https://embed.podcasts.apple.com/us/podcast/id${showId}?i=${episodeId}`;
    } else if (showIdMatch) {
      const showId = showIdMatch[1];
      return `https://embed.podcasts.apple.com/us/podcast/id${showId}`;
    }
  }
  
  return url;
};
