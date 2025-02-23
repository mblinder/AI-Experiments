
import React, { useRef, useCallback } from 'react';
import ContentCard from '@/components/ContentCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
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
  const filteredItems = type === 'all' 
    ? items 
    : items.filter(item => item.type === type);

  const LoadingSpinner = () => (
    <div className="col-span-full flex justify-center p-4">
      <motion.div 
        className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );

  const ItemRenderer = ({ item, index }: { item: ContentItem; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.1, 0.3) }}
      className="p-3"
    >
      <ContentCard 
        {...item} 
        onTagClick={onTagClick}
        activeTag={activeTag}
      />
    </motion.div>
  );

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <Virtuoso
          style={{ height: 'calc(100vh - 4rem)' }}
          totalCount={filteredItems.length}
          itemContent={index => (
            <ItemRenderer item={filteredItems[index]} index={index} />
          )}
          endReached={() => {
            if (hasMore && !isLoading) {
              onLoadMore();
            }
          }}
          components={{
            Footer: () => 
              isLoading && hasMore ? <LoadingSpinner /> : null
          }}
          overscan={5}
        />
      </div>
    </ScrollArea>
  );
};

export default ContentFeed;
