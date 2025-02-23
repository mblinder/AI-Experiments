
import React, { useState } from 'react';
import { MainSidebar } from '@/components/MainSidebar';
import ContentFeed from '@/components/ContentFeed';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface ContentTag {
  id: string;
  name: string;
  type: 'participant' | 'topic' | 'source';
}

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

interface PageData {
  items: ContentItem[];
  nextPage: number | undefined;
}

// Updated mock data with tags
const mockData: ContentItem[] = [
  {
    id: '1',
    title: 'The Latest from The Bulwark',
    description: 'In this episode, we discuss the latest political developments and their implications.',
    type: 'video',
    imageUrl: 'https://picsum.photos/800/400',
    date: '2024-03-14',
    link: 'https://youtube.com',
    tags: [
      { id: '1', name: 'Charlie Sykes', type: 'participant' },
      { id: '2', name: 'Politics', type: 'topic' },
      { id: '3', name: 'Bulwark YouTube', type: 'source' }
    ]
  },
  {
    id: '2',
    title: 'Why Substack is the Future of Journalism',
    description: 'An in-depth analysis of why Substack is changing the media landscape.',
    type: 'article',
    imageUrl: 'https://picsum.photos/800/401',
    date: '2024-03-13',
    link: 'https://substack.com',
    tags: [
      { id: '4', name: 'Media', type: 'topic' },
      { id: '5', name: 'The Bulwark Daily', type: 'source' }
    ]
  },
  {
    id: '3',
    title: 'The Bulwark Podcast: Episode 42',
    description: 'Join us as we interview a leading expert on foreign policy.',
    type: 'podcast',
    imageUrl: 'https://picsum.photos/800/402',
    date: '2024-03-12',
    link: 'https://podcast.com',
    tags: [
      { id: '6', name: 'Charlie Sykes', type: 'participant' },
      { id: '7', name: 'Foreign Policy', type: 'topic' },
      { id: '8', name: 'The Bulwark Podcast', type: 'source' }
    ]
  }
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'article' | 'video' | 'podcast'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<PageData, Error, PageData, [string], number>({
    queryKey: ['content', activeTag],
    queryFn: async ({ pageParam }) => {
      // This would be replaced with actual API calls to fetch content
      const filteredItems = activeTag
        ? mockData.filter(item => item.tags.some(tag => tag.id === activeTag))
        : mockData;

      return {
        items: filteredItems,
        nextPage: pageParam < 3 ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1
  });

  const allItems = data?.pages.flatMap(page => page.items) ?? [];

  const handleTagClick = (tagId: string) => {
    setActiveTag(tagId === activeTag ? null : tagId);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <MainSidebar />
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
            items={allItems} 
            type={activeTab}
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
