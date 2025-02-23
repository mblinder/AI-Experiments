import React, { useState } from 'react';
import { MainSidebar } from '@/components/MainSidebar';
import ContentFeed from '@/components/ContentFeed';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Temporary mock data - replace with actual API calls
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
  },
  {
    id: '4',
    title: 'Is Democracy in Danger?',
    description: 'A critical look at the challenges facing democratic institutions around the world.',
    type: 'youtube' as const,
    imageUrl: 'https://picsum.photos/800/403',
    date: '2024-03-11',
    link: 'https://youtube.com',
  },
  {
    id: '5',
    title: 'The Conservative Case for Climate Action',
    description: 'Why conservatives should lead the fight against climate change.',
    type: 'substack' as const,
    imageUrl: 'https://picsum.photos/800/404',
    date: '2024-03-10',
    link: 'https://substack.com',
  },
  {
    id: '6',
    title: 'The Bulwark Podcast: The Future of Conservatism',
    description: 'A discussion on the future direction of the conservative movement.',
    type: 'podcast' as const,
    imageUrl: 'https://picsum.photos/800/405',
    date: '2024-03-09',
    link: 'https://podcast.com',
  },
];

const Index = () => {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, hasNextPage, fetchNextPage } = useQuery({
    queryKey: ['content', page],
    queryFn: async () => {
      // This would be replaced with actual API calls to fetch content
      return mockData;
    },
  });

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchNextPage();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <MainSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50 h-16 flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-2xl font-bold">The Bulwark</h1>
          </header>
          <ContentFeed 
            items={data || []} 
            type={activeTab as 'all' | 'youtube' | 'substack' | 'podcast'}
            hasMore={!!hasNextPage}
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
