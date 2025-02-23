
import React, { useState } from 'react';
import { MainSidebar } from '@/components/MainSidebar';
import ContentFeed from '@/components/ContentFeed';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { fetchContent, refreshFeeds, type ContentItem, type ContentTag } from '@/services/contentService';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

interface PageData {
  items: ContentItem[];
  nextPage: number | null;
}

const Index = () => {
  const [selectedContentType, setSelectedContentType] = useState<'all' | 'article' | 'video' | 'podcast'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery<PageData>({
    queryKey: ['content', selectedContentType],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchContent(
        pageParam as number,
        selectedContentType
      );
      return {
        items: response.items,
        nextPage: response.nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1
  });

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshFeeds();
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const allItems = data?.pages.flatMap(page => page.items) ?? [];
  const filteredItems = activeTag
    ? allItems.filter(item => item.tags.some(tag => tag.id === activeTag))
    : allItems;

  const handleTagClick = (tagId: string) => {
    setActiveTag(tagId === activeTag ? null : tagId);
  };

  const handleMenuClick = (type: 'all' | 'article' | 'video' | 'podcast') => {
    setSelectedContentType(type);
    setActiveTag(null); // Reset active tag when changing content type
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedContentType('all');
    setActiveTag(null);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <MainSidebar onMenuClick={handleMenuClick} activeType={selectedContentType} />
        <main className="flex-1">
          <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50 h-16">
            <div className="h-full w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
              <Link to="/" className="hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
                <img 
                  src="/lovable-uploads/ebb67899-d47a-4397-93f1-7e5503ac8d44.png"
                  alt="Ship Logo"
                  className="w-6 h-6"
                />
              </Link>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Feeds'}
                </Button>
                <Link to="/" className="hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
                  <img 
                    src="/lovable-uploads/fa7cdb76-0bf9-45f8-9906-ca514d9c590b.png"
                    alt="The Bulwark"
                    className="h-6 w-auto"
                  />
                </Link>
              </div>
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
