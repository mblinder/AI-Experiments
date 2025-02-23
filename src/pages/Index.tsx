
import React, { useState } from 'react';
import { MainSidebar } from '@/components/MainSidebar';
import ContentFeed from '@/components/ContentFeed';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { fetchContent } from '@/services/contentService';
import type { ContentItem, ContentTag } from '@/services/contentService';

interface PageData {
  items: ContentItem[];
  nextPage: number | null;
}

const Index = () => {
  const [selectedContentType, setSelectedContentType] = useState<'all' | 'article' | 'video'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<PageData>({
    queryKey: ['content'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchContent(pageParam as number);
      return {
        items: response.items,
        nextPage: response.nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1
  });

  const allItems = data?.pages.flatMap(page => page.items) ?? [];
  const filteredItems = selectedContentType === 'all' 
    ? allItems 
    : allItems.filter(item => item.type === selectedContentType);

  const handleTagClick = (tagId: string) => {
    setActiveTag(tagId === activeTag ? null : tagId);
  };

  const handleMenuClick = (type: 'all' | 'article' | 'video') => {
    setSelectedContentType(type);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <MainSidebar onMenuClick={handleMenuClick} activeType={selectedContentType} />
        <main className="flex-1">
          <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50 h-16">
            <div className="h-full w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
              <img 
                src="/lovable-uploads/ebb67899-d47a-4397-93f1-7e5503ac8d44.png"
                alt="Ship Logo"
                className="w-6 h-6"
              />
              <img 
                src="/lovable-uploads/fa7cdb76-0bf9-45f8-9906-ca514d9c590b.png"
                alt="The Bulwark"
                className="h-6 w-auto"
              />
              <SidebarTrigger className="w-8" />
            </div>
          </header>
          <ContentFeed 
            items={filteredItems} 
            type={selectedContentType}
            hasMore={!!hasNextPage}
            isLoading={isLoading}
            onLoadMore={fetchNextPage}
            onTagClick={handleTagClick}
            activeTag={activeTag}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
