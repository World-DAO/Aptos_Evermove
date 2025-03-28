import { useEffect, useState } from "react";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/lib/utils";
import { useContent } from '@/hooks/useContent';
import { useGenericSpaceKeyDown } from "@/hooks/useGenericSpaceKeyDown";

interface Story {
    id: number;
    author_address: string;
    title: string;
    story_content: string;
    created_at: string;
}

interface ContentWindowProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ContentWindow({ className }: ContentWindowProps) {
    const [isContentOpen, setIsContentOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const { 
        loading, 
        stories,
        likedStories,
        fetchStories,
        sendWhiskey,
        sendReply 
    } = useContent();

    const handleReplyText = useGenericSpaceKeyDown(setReplyText);

    // Fetch stories when component mounts
    useEffect(() => {
        if (isContentOpen) {
            fetchStories();
        }
    }, [isContentOpen]);

    useEffect(() => {
        const handleOpenContent = () => {
            console.log("Opening content window");
            setIsContentOpen(true);
        };

        EventBus.on("open-content", handleOpenContent);
        
        return () => {
            EventBus.removeListener("open-content");
        };
    }, []);

    // Show loading state
    if (isContentOpen && isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="text-white">Loading stories...</div>
            </div>
        );
    }

    // Don't return null if we're loading
    if (!isContentOpen) return null;

    // Show error state if no stories
    if (!isLoading && stories.length === 0) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="text-white">No stories available</div>
            </div>
        );
    }

    const currentStory = stories[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % stories.length);
    };

    const handleLike = async () => {
        if (!currentStory) return;
        await sendWhiskey(currentStory.id);
    };

    const handleReply = () => {
        setIsReplyOpen(true);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !currentStory) return;
        const result = await sendReply(currentStory.id, replyText);
        if (result.success) {
            setReplyText('');
            setIsReplyOpen(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className={cn(
                "w-[717px] h-[737px] relative flex flex-col",
                "bg-[#8361A0]/50 backdrop-blur-[24px]",
                "rounded-[24px]",
                className
            )}>
                {/* Content */}
                <div className="flex-1 p-12">
                    <h2 className="text-white text-2xl mb-4">{currentStory.title}</h2>
                    <div className="text-white/70 mb-6">
                        From: {currentStory.author_address.slice(0, 6)}...{currentStory.author_address.slice(-4)}
                    </div>
                    <div className="text-white text-lg leading-relaxed whitespace-pre-wrap break-words">
                        {currentStory.story_content}
                    </div>
                </div>

                {/* Action Buttons - Bottom Bar */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                    <button
                        onClick={handleLike}
                        disabled={likedStories.has(currentStory.id)}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                            likedStories.has(currentStory.id)
                                ? "bg-[#722F37] scale-95 cursor-not-allowed" // Darker red when liked
                                : "bg-[#83CEDD] hover:bg-[#94DFF0] hover:scale-105" // Original style
                        )}
                    >
                        <span className={cn(
                            "text-2xl transition-transform duration-200",
                            likedStories.has(currentStory.id) && "opacity-50"
                        )}>
                            🍷
                        </span>
                    </button>
                    <button
                        onClick={handleReply}
                        className="px-8 py-2 bg-[#83CEDD] rounded-xl
                                text-white hover:bg-[#94DFF0] transition-colors
                                font-medium text-lg"
                    >
                        REPLY
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-8 py-2 bg-[#83CEDD] rounded-xl
                                text-white hover:bg-[#94DFF0] transition-colors
                                font-medium text-lg"
                    >
                        NEXT
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsContentOpen(false)}
                    className="absolute top-6 right-6 w-8 h-8 
                            text-white/70 hover:text-white 
                            transition-colors text-2xl"
                >
                    ×
                </button>

                {/* Reply Window - Shows when isReplyOpen is true */}
                {isReplyOpen && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[717px] h-[300px] relative flex flex-col
                                    bg-[#8361A0]/80 backdrop-blur-[24px] 
                                    rounded-[24px] border border-[#4EEAFF]/20">
                            {/* Header */}
                            <div className="flex justify-between items-center p-4">
                                <h3 className="text-white text-xl px-4">Write Reply</h3>
                                <button
                                    onClick={() => setIsReplyOpen(false)}
                                    className="text-[#4EEAFF]/70 hover:text-[#4EEAFF] text-xl w-8 h-8"
                                >
                                    ×
                                </button>
                            </div>
                            
                            {/* Reply Input */}
                            <div className="flex-1 px-8 pb-8">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={handleReplyText}
                                    placeholder="Write your reply here..."
                                    className="w-full h-[120px] bg-[#2A4C54]/40  
                                            border border-[#4EEAFF]/30 
                                            rounded-[12px] p-4 
                                            text-[#4EEAFF] placeholder:text-[#4EEAFF]/50
                                            focus:outline-none focus:border-[#4EEAFF]/50 
                                            resize-none"
                                />

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-4 mt-4">
                                    <button
                                        onClick={() => setIsReplyOpen(false)}
                                        className="px-8 py-2 bg-[#2A4C54]/20 
                                                border border-[#4EEAFF]/30 rounded-xl
                                                text-[#4EEAFF] hover:bg-[#2A4C54]/40 
                                                transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim()}
                                        className="px-8 py-2 bg-[#83CEDD] rounded-xl
                                                text-white hover:bg-[#94DFF0] 
                                                transition-colors
                                                disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 