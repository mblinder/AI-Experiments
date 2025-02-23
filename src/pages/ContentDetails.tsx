import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const ContentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? parseInt(decodeURIComponent(id), 10) : null;

  const { data: contentData, isLoading } = useQuery({
    queryKey: ['content', decodedId],
    queryFn: async () => {
      if (!decodedId) throw new Error('Invalid ID');

      const { data: item, error } = await supabase
        .from('content_items')
        .select(`
          *,
          articles (
            content
          ),
          content_tags (
            tags (
              id,
              name,
              type
            )
          )
        `)
        .eq('id', decodedId)
        .single();

      if (error) throw error;
      if (!item) throw new Error('Content not found');

      return {
        ...item,
        content: item.articles?.[0]?.content || item.description || '',
        tags: item.content_tags?.map((tag: any) => ({
          id: tag.tags.id,
          name: tag.tags.name,
          type: tag.tags.type
        })) || []
      };
    },
    enabled: !!decodedId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Content not found</h1>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm">
                {contentData.content_type}
              </Badge>
              {contentData.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-sm">
                  {tag.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl font-bold mb-4">{contentData.title}</h1>
            
            <time className="text-sm text-gray-500 dark:text-gray-400 mb-4 block">
              {new Date(contentData.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>

            <div 
              className="prose dark:prose-invert max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: contentData.content }}
            />

            <a 
              href={contentData.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button>
                View Original
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </article>
      </div>
    </motion.div>
  );
};

export default ContentDetails;
