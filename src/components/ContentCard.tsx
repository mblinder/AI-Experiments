
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import type { ContentTag } from '@/services/contentService';

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'podcast';
  imageUrl?: string;
  date: string;
  link: string;
  tags: ContentTag[];
  onTagClick: (tagId: string) => void;
  activeTag: string | null;
}

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const ContentCard = ({ 
  id,
  title, 
  description, 
  type, 
  imageUrl, 
  date,
  link,
  tags,
  onTagClick,
  activeTag
}: ContentCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const cleanDescription = React.useMemo(() => {
    const stripped = stripHtmlTags(description);
    return stripped;
  }, [description]);

  // Function to get the actual media URL from RSS feeds
  const getMediaUrl = (url: string): string => {
    // Handle Substack URLs
    if (url.includes('substack.com')) {
      // Convert RSS feed URL to actual episode URL
      return url.replace('/feed/podcast/', '/podcast/player-') + '.mp3';
    }
    // Handle Megaphone URLs
    if (url.includes('megaphone.fm')) {
      // Convert RSS feed URL to direct player URL
      const episodeId = url.split('/').pop();
      return `https://player.megaphone.fm/${episodeId}`;
    }
    // Handle Apple Podcasts URLs
    if (url.includes('podcasts.apple.com')) {
      // Extract the episode ID from the URL
      const episodeId = url.split('=').pop();
      // Return an embeddable player URL
      return `https://embed.podcasts.apple.com/us/podcast/id1796712102?i=${episodeId}`;
    }
    return url;
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    if (type === 'video' || type === 'podcast') {
      e.preventDefault();
      setIsPlaying(!isPlaying);
    }
  };

  const renderMedia = () => {
    if (type === 'article') {
      return imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
        </div>
      );
    }

    if (type === 'video' || type === 'podcast') {
      const playerConfig = {
        youtube: {
          playerVars: { origin: window.location.origin }
        },
        soundcloud: {
          options: {
            sharing: false,
            download: false
          }
        },
        file: {
          forceAudio: type === 'podcast',
          attributes: {
            style: {
              width: '100%',
              height: '100%'
            }
          }
        }
      };

      const mediaUrl = type === 'podcast' ? getMediaUrl(link) : link;

      return (
        <div 
          className={`${type === 'video' ? 'aspect-video' : 'h-[180px]'} w-full relative`} 
          onClick={handleMediaClick}
        >
          {isPlaying ? (
            <div className="absolute inset-0">
              {link.includes('podcasts.apple.com') ? (
                <iframe
                  src={mediaUrl}
                  height="175px"
                  frameBorder="0"
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                  allow="autoplay *; encrypted-media *; fullscreen *"
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    borderRadius: '10px',
                    backgroundColor: 'transparent'
                  }}
                />
              ) : (
                <ReactPlayer
                  url={mediaUrl}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={isPlaying}
                  config={playerConfig}
                />
              )}
            </div>
          ) : (
            <div className="relative w-full h-full">
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt={title}
                  className="w-full h-full object-cover cursor-pointer"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="w-full">
      <div className="group">
        <Card className="overflow-hidden backdrop-blur-lg bg-white/90 dark:bg-black/90 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
          <div className="relative">
            {renderMedia()}
            <Badge 
              className="absolute top-2 right-2 backdrop-blur-md bg-white/80 dark:bg-black/80"
              variant="outline"
            >
              {type}
            </Badge>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-4">
              {cleanDescription}
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={activeTag === tag.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={(e) => {
                    e.preventDefault();
                    onTagClick(tag.id);
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            <time className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default ContentCard;
