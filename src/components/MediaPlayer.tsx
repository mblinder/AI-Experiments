
import React from 'react';
import ReactPlayer from 'react-player';
import { getMediaUrl } from '@/utils/mediaUtils';

interface MediaPlayerProps {
  type: 'article' | 'video' | 'podcast';
  imageUrl?: string;
  link: string;
  title: string;
  isPlaying: boolean;
  onMediaClick: (e: React.MouseEvent) => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  type,
  imageUrl,
  link,
  title,
  isPlaying,
  onMediaClick,
}) => {
  if (type === 'article') {
    return imageUrl ? (
      <div className="h-48 w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
        />
      </div>
    ) : null;
  }

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
      className={`${type === 'video' ? 'h-48' : 'h-32'} w-full relative cursor-pointer`} 
      onClick={onMediaClick}
    >
      {isPlaying ? (
        <div className="absolute inset-0">
          {link.includes('podcasts.apple.com') ? (
            <iframe
              src={mediaUrl}
              height="100%"
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
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
              <svg 
                className="w-6 h-6 text-white" 
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
};

export default MediaPlayer;
