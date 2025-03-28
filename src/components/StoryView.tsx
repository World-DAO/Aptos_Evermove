import { useState } from 'react';
import { ScrollArea } from "./ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Story, Reply } from '@/game/utils/ColyseusClient';
import { useReplies } from '@/hooks/useReplies';
import { ReplyInput } from './ReplyInput';

interface StoryViewProps {
  selectedStory: Story;
  isMyStories: boolean;
  recipient: string;
  approveAmount: number;
  setApproveAmount: (amount: number) => void;
}

export function StoryView({
  selectedStory,
  isMyStories,
  recipient,
  approveAmount,
  setApproveAmount,
}: StoryViewProps) {
  const [replyText, setReplyText] = useState("");
  const { 
    replyGroups: displayReplyGroups, 
    replies: displayReplies,
    sendReply 
  } = useReplies(selectedStory?.id.toString() ?? null, isMyStories);

  const handleSendReply = async (targetAddress?: string, text: string = "") => {
    if (!text.trim() || !targetAddress) return;
    
    const success = await sendReply(targetAddress, text);
    if (success) {
      setReplyText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // console.log("Pressed key:", e.key, "code:", e.code);
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;
      setReplyText(replyText.substring(0, start) + ' ' + replyText.substring(end));
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    //   console.log('space')
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <ScrollArea className="flex-1 mb-[200px]">
        <div className="p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Original Story section - expanded by default */}
            <div className="bg-[#1E1B2D] border border-[#4EEAFF]/50 pixel-corners">
              <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1" className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-semibold text-[#4EEAFF]">{selectedStory.title}</h3>
                      <span className="text-sm text-[#4EEAFF]/50">
                        {new Date(selectedStory.created_at).toLocaleString()}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4">
                      <div className="text-sm text-[#4EEAFF]/70">
                        From: {selectedStory.author_address.slice(0, 6)}...{selectedStory.author_address.slice(-4)}
                      </div>
                      <div className="mt-4 text-[#4EEAFF]/90 whitespace-pre-wrap">
                        {selectedStory.story_content}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Conversation Thread - expanded by default */}
            {isMyStories ? (
              <div className="space-y-4">
                {Object.entries(displayReplyGroups).map(([addressPair, replies]) => (
                  <div key={addressPair} className="bg-[#1E1B2D] border border-[#4EEAFF]/50 pixel-corners">
                    <Accordion type="single" collapsible defaultValue="item-1">
                      <AccordionItem value="item-1" className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <h3 className="font-semibold text-[#4EEAFF]">
                              Conversation with: {
                                replies[replies.length - 1]?.author_address 
                                  ? `${replies[replies.length - 1].author_address.slice(0, 6)}...${replies[replies.length - 1].author_address.slice(-4)}`
                                  : 'Unknown'
                              }
                            </h3>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-6 pb-4 space-y-4">
                            {replies.map((reply) => (
                              <div key={reply.id} className="bg-[#2A2A2F] p-4 rounded">
                                <div className="text-sm text-[#4EEAFF]/70">
                                  {new Date(reply.created_at).toLocaleString()}
                                </div>
                                <div className="mt-2 text-[#4EEAFF]/90 whitespace-pre-wrap">
                                  {reply.reply_content}
                                </div>
                              </div>
                            ))}
                            <ReplyInput 
                              onSendReply={(text) => handleSendReply(replies[replies.length - 1]?.author_address, text)}
                              placeholder="Reply to this conversation..."
                              className="mt-4"
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayReplies.map((reply) => (
                  <div key={reply.id} className="bg-[#1E1B2D] border border-[#4EEAFF]/50 pixel-corners">
                    <Accordion type="single" collapsible defaultValue="item-1">
                      <AccordionItem value="item-1" className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <h3 className="font-semibold text-[#4EEAFF]">
                              {reply.author_address === selectedStory.author_address ? "Author's Reply" : "Reply"}
                            </h3>
                            <span className="text-sm text-[#4EEAFF]/50">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="px-6 pb-4">
                            <div className="text-sm text-[#4EEAFF]/70">
                              From: {reply.author_address.slice(0, 6)}...{reply.author_address.slice(-4)}
                            </div>
                            <div className="mt-4 text-[#4EEAFF]/90 whitespace-pre-wrap">
                              {reply.reply_content}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Main reply box at bottom */}
      {!isMyStories && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#2A4C54]/50">
          <ReplyInput 
            onSendReply={(text) => handleSendReply(displayReplies[0]?.author_address, text)}
            placeholder="Write your reply here..."
          />
        </div>
      )}
    </div>
  );
}