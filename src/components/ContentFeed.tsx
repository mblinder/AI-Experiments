
import React, { useRef, useCallback } from 'react';
import ContentCard from '@/components/ContentCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import type { ContentTag } from '@/services/contentService';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'podcast';
  imageUrl?: string;
  date: string;
  link: string;
  tags: ContentTag[];
}

interface ContentFeedProps {
  items: ContentItem[];
  type: 'all' | 'article' | 'video' | 'podcast';
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onTagClick: (tagId: string) => void;
  activeTag: string | null;
}

const ContentFeed = ({ 
  items, 
  type, 
  hasMore, 
  isLoading, 
  onLoadMore,
  onTagClick,
  activeTag
}: ContentFeedProps) => {
  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, onLoadMore]);

  const filteredItems = type === 'all' 
    ? items 
    : items.filter(item => item.type === type);

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            ref={index === filteredItems.length - 1 ? lastItemRef : null}
          >
            <ContentCard 
              {...item} 
              onTagClick={onTagClick}
              activeTag={activeTag}
            />
          </motion.div>
        ))}
        {isLoading && (
          <div className="col-span-full flex justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ContentFeed;
