
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
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
  // Clean and truncate the description
  const cleanDescription = React.useMemo(() => {
    const stripped = stripHtmlTags(description);
    return stripped;
  }, [description]);

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="w-full">
      <a href={link} target="_blank" rel="noopener noreferrer">
        <Card className="overflow-hidden backdrop-blur-lg bg-white/90 dark:bg-black/90 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
          <div className="relative">
            {imageUrl && (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
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
      </a>
    </motion.div>
  );
};

export default ContentCard;
