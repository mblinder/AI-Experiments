
export const stripHtmlTags = (html: string) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const getMediaUrl = (url: string): string => {
  if (url.includes('substack.com')) {
    // Convert the Substack URL to an embed URL
    const postPath = url.split('/p/')[1];
    if (postPath) {
      return `https://thebulwark.substack.com/embed/p/${postPath}`;
    }
    return url;
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
