import { useEffect, useState } from "react";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/lib/utils";
import { useContent } from '@/hooks/useContent';

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
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backdropFilter: 'blur(50px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999
            }}>
                <div className="text-white">Loading stories...</div>
            </div>
        );
    }

    // Don't return null if we're loading
    if (!isContentOpen) return null;

    // Show error state if no stories
    if (!isLoading && stories.length === 0) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backdropFilter: 'blur(50px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999
            }}>
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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',  // Overlay
            zIndex: 999
        }}>
            <div style={{
                width: '780px',
                height: '700px',
                backgroundColor: 'rgba(26, 26, 63, 0.6)',  // #1A1A3F with 60% opacity
                border: '1px solid rgba(255, 255, 255, 0.2)',  // White border with 20% opacity
                borderRadius: '36px',
                backdropFilter: 'blur(18px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                position: 'relative'
            }}>
                {/* Content */}
                <div className="flex-1 p-12">
                    <h2 style={{
                        fontFamily: 'Montserrat',
                        fontWeight: 700,
                        fontSize: '32px',
                        lineHeight: '32px',
                        letterSpacing: '0',
                        color: '#FFFFFF',
                        marginBottom: '16px'
                    }}>
                        Hello! New friends👋
                    </h2>
                    <div style={{
                        fontFamily: 'Montserrat',
                        fontWeight: 400,
                        fontSize: '12px',
                        lineHeight: '100%',
                        letterSpacing: '0',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '24px',
                        paddingLeft: '10px'
                    }}>
                        From: {currentStory.author_address}
                    </div>
                    <div style={{
                        fontFamily: 'Montserrat',
                        fontWeight: 400,
                        fontSize: '20px',
                        lineHeight: '34px',
                        letterSpacing: '0',
                        color: '#FFFFFF',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {currentStory.story_content}
                    </div>
                </div>

                {/* Action Buttons - Bottom Bar */}
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: 'auto',  // Push to bottom
                    paddingLeft: '24px',  // Match content padding
                    paddingBottom: '24px'
                }}>
                    <button
                        onClick={handleLike}
                        disabled={likedStories.has(currentStory.id)}
                        style={{
                            width: '276px',
                            height: '72px',
                            background: 'linear-gradient(93.06deg, #FF39E0 0%, #AE4FFF 51.56%, #30B3D4 100%)',
                            borderRadius: '24px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <img src="img/wineButton.png" alt="Send Cheers" />
                        <span style={{ 
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontSize: '20px',
                            fontWeight: 700
                        }}>
                            Send a Cheer
                        </span>
                    </button>

                    <button
                        onClick={handleReply}
                        style={{
                            width: '180px',
                            height: '72px',
                            background: '#1A1A3F',
                            border: '1px solid rgba(255, 255, 255, 0.4)',  // 40% opacity white border
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            position: 'relative',
     
                        }}
                    >
                        <img src="img/replyButton.png" alt="Reply" />
                        <span style={{ 
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontSize: '20px',
                            fontWeight: 700
                        }}>
                            Reply
                        </span>
                    </button>

                    <button
                        onClick={handleNext}
                        style={{
                            width: '180px',
                            height: '72px',
                            background: '#1A1A3F',
                            border: '1px solid rgba(255, 255, 255, 0.4)',  // 40% opacity white border
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            position: 'relative',
                        }}
                    >
                        <img src="img/nextButton.png" alt="Next" />
                        <span style={{ 
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontSize: '20px',
                            fontWeight: 700
                        }}>
                            Next
                        </span>
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => {
                        setIsContentOpen(false);
                        EventBus.emit("close-content");
                    }}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        width: '42px',
                        height: '42px',
                        background: '#1A1A3F',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '100px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ×
                </button>

                {/* Reply Window */}
                {isReplyOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0px',  // Move down to overlap with content window bottom
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '780px',
                        height: '300px',  // Increased height for better symmetry
                        backgroundColor: 'rgba(26, 26, 63, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '36px',
                        padding: '48px 24px 24px',  // Increased top padding to center textarea
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        backdropFilter: 'blur(50px)',  // Maximum blur
                        WebkitBackdropFilter: 'blur(50px)'  // Safari support
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={() => setIsReplyOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '42px',
                                height: '42px',
                                background: '#1A1A3F',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '100px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ×
                        </button>

                        {/* Reply Input */}
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '24px',
                                padding: '16px',
                                color: '#FFFFFF',
                                fontFamily: 'Montserrat',
                                fontSize: '16px',
                                resize: 'none',
                                outline: 'none'  // Prevent default focus border
                            }}
                            placeholder="Write your reply..."
                        />

                        {/* Send Button */}
                        <button
                            onClick={handleSendReply}
                            style={{
                                width: '180px',
                                height: '72px',
                                background: 'linear-gradient(93.06deg, #FF39E0 0%, #AE4FFF 51.56%, #30B3D4 100%)',
                                border: 'none',
                                borderRadius: '24px',
                                color: '#FFFFFF',
                                fontFamily: 'Montserrat',
                                fontSize: '20px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                alignSelf: 'flex-end'
                            }}
                        >
                            Send Reply
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 