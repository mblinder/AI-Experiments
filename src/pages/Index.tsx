
import React, { useState } from 'react';
import { MainSidebar } from '@/components/MainSidebar';
import ContentFeed from '@/components/ContentFeed';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'youtube' | 'substack' | 'podcast';
  imageUrl?: string;
  date: string;
  link: string;
}

interface PageData {
  items: ContentItem[];
  nextPage: number | undefined;
}

// Temporary mock data
const mockData = [
  {
    id: '1',
    title: 'The Latest from The Bulwark',
    description: 'In this episode, we discuss the latest political developments and their implications.',
    type: 'youtube' as const,
    imageUrl: 'https://picsum.photos/800/400',
    date: '2024-03-14',
    link: 'https://youtube.com',
  },
  {
    id: '2',
    title: 'Why Substack is the Future of Journalism',
    description: 'An in-depth analysis of why Substack is changing the media landscape.',
    type: 'substack' as const,
    imageUrl: 'https://picsum.photos/800/401',
    date: '2024-03-13',
    link: 'https://substack.com',
  },
  {
    id: '3',
    title: 'The Bulwark Podcast: Episode 42',
    description: 'Join us as we interview a leading expert on foreign policy.',
    type: 'podcast' as const,
    imageUrl: 'https://picsum.photos/800/402',
    date: '2024-03-12',
    link: 'https://podcast.com',
  }
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<PageData, Error, PageData, [string], number>({
    queryKey: ['content'],
    queryFn: async ({ pageParam }) => {
      // This would be replaced with actual API calls to fetch content
      return {
        items: mockData,
        nextPage: pageParam < 3 ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1
  });

  const allItems = data?.pages.flatMap(page => page.items) ?? [];

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
            type={activeTab as 'all' | 'youtube' | 'substack' | 'podcast'}
            hasMore={!!hasNextPage}
            isLoading={isLoading}
            onLoadMore={fetchNextPage}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
