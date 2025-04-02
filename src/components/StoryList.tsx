import * as React from "react"
import { useState } from "react"
import { StoryListItem } from '@/components/StoryListItem';
import { Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReplies } from '@/hooks/useReplies';
import { useStories } from '@/hooks/useStories';

export interface Story {
  id: number;
  author_address: string;
  title: string;
  story_content: string;
  created_at: Date;
}

interface StoryListProps {
  selectedStory: Story | null;
  onSelect: (story: Story) => void;
  isMyStories: boolean;
  setRecipient: (address: string) => void;
}

export function StoryList({ 
  selectedStory, 
  onSelect,
  isMyStories,
  setRecipient,
}: StoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { refreshReplies } = useReplies(selectedStory?.id.toString() ?? null, isMyStories);

  const { stories: fetchedStories, loading: storiesLoading } = useStories(isMyStories);

  const stories = fetchedStories

  const handleStorySelect = (story: Story) => {
    onSelect(story);
    setRecipient(story.author_address);
    refreshReplies();
  };

  const filteredStories = React.useMemo(() => {
    if (!searchQuery) return stories;
    const query = searchQuery.toLowerCase();
    return stories.filter((story) => 
      story.title.toLowerCase().includes(query) ||
      story.story_content.toLowerCase().includes(query) ||
      story.author_address.toLowerCase().includes(query)
    );
  }, [searchQuery, stories]);

  return (
    <div className="w-[400px] border-r border-[#4EEAFF]/30 bg-[#2A4C54]">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#4EEAFF]/70" />
          <input
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1F] border-2 border-[#4A4A4F] px-9 py-2 
                       text-[#4EEAFF] placeholder:text-[#4EEAFF]/50 
                       focus:outline-none focus:border-[#4EEAFF]/50"
          />
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="px-4 space-y-2">
          {storiesLoading ? (
            <div className="text-[#4EEAFF]/70">Loading stories...</div>
          ) : (
            filteredStories.map((story) => (
              <StoryListItem
                key={story.id}
                story={story}
                isSelected={selectedStory?.id === story.id}
                onSelect={handleStorySelect}
                isMyStories={isMyStories}
                setRecipient={setRecipient}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 