import { useState, useEffect } from 'react';
import { useGet } from './useGet';
import { usePost } from './usePost';

export interface Reply {
    id: number;
    story_id: number;
    parent_reply_id: number;
    author_address: string;
    reply_content: string;
    created_at: Date;
}

interface ReplyResponse {
  success: boolean;
  replies: { [key: string]: Reply[] };
}

interface SendReplyResponse {
  success: boolean;
  reply: Reply;
}

export function useReplies(storyId: string | null, isMyStories: boolean) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyGroups, setReplyGroups] = useState<{ [key: string]: Reply[] }>({});

  // Get replies for a story - updated URL
  const { 
    data: replyData,
    error: replyError,
    mutate: refreshReplies 
  } = useGet<ReplyResponse>(
    storyId ? `/replies/story/${storyId}` : null
  );

  // Send reply endpoint
  const { 
    trigger: sendReply,
    error: sendError 
  } = usePost<SendReplyResponse>('/reply/user');

  // Update replies when data changes
  useEffect(() => {
    if (replyData?.success) {
      if (isMyStories) {
        setReplyGroups(replyData.replies);
        setReplies([]);
      } else {
        const allReplies = Object.values(replyData.replies).flat();
        const sortedReplies = allReplies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setReplies(sortedReplies);
        setReplyGroups({});
      }
    }
  }, [replyData, isMyStories]);

  // Helper function to send a reply
  const handleSendReply = async (targetUserAddress: string, replyText: string) => {
    try {
      const result = await sendReply({
        targetUserAddress,
        replyText,
        storyId
      });

      if (result.success) {
        refreshReplies();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send reply:', error);
      return false;
    }
  };

  return {
    replies,
    replyGroups,
    sendReply: handleSendReply,
    refreshReplies,
    error: replyError || sendError
  };
} 