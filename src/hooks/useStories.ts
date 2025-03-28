import { useState, useEffect } from 'react';
import { useGet } from './useGet';
import { usePost } from './usePost';
import { Story, Reply } from '@/game/utils/ColyseusClient';

export function useStories(isMyStories: boolean) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { data: myStoriesData } = useGet<{ success: boolean; stories: Story[] }>(
    isMyStories ? '/stories' : null
  );
  
  const { data: savedStoriesData } = useGet<{ success: boolean; recvStories: Story[] }>(
    !isMyStories ? '/stories/saved_stories' : null
  );
  
  const { trigger: sendReply } = usePost<{ success: boolean; reply: Reply }>('/reply/user');
  const { trigger: markSaved } = usePost<{ success: boolean }>('/stories/mark_saved');

  useEffect(() => {
    setLoading(true);
    if (isMyStories && myStoriesData?.success) {
      setStories(myStoriesData.stories || []);
    } else if (!isMyStories && savedStoriesData?.success) {
      setStories(savedStoriesData.recvStories || []);
    } else {
      setStories([]);
    }
    setLoading(false);
  }, [isMyStories, myStoriesData, savedStoriesData]);

  return {
    stories,
    loading,
    sendReply,
    markSaved
  };
} 