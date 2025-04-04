import { useEffect, useState } from "react";
import { EventBus } from "@/game/EventBus";
import { useContent } from '@/hooks/useContent';
import { Story } from '@/types/story';

interface ContentListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ContentList({ className }: ContentListProps) {
    const [isListOpen, setIsListOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const { stories, likedStories, fetchStories, sendWhiskey } = useContent();
    const storiesPerPage = 5;

    useEffect(() => {
        if (isListOpen) {
            console.log("Fetching stories...");
            fetchStories().then(fetchedStories => {
                console.log("Fetched stories in ContentList:", fetchedStories);
                if (fetchedStories.length === 0) {
                    console.log("No stories fetched");
                }
            }).catch(error => {
                console.error("Error fetching stories:", error);
            });
        }
    }, [isListOpen]);

    useEffect(() => {
        const handleOpenContent = () => {
            console.log("Opening content list");
            setIsListOpen(true);
        };

        EventBus.on("open-content", handleOpenContent);
        
        return () => {
            EventBus.removeListener("open-content");
        };
    }, []);

    if (!isListOpen) return null;

    // Show error state if no stories
    if (stories.length === 0) {
        return (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/70 text-xl">
                No stories yet
            </div>
        );
    }

    const totalPages = Math.ceil(stories.length / storiesPerPage);
    const startIndex = currentPage * storiesPerPage;
    const endIndex = Math.min(startIndex + storiesPerPage, stories.length);
    // 强制限制每页最多显示5个故事
    const currentStories = stories.slice(startIndex, endIndex).slice(0, 5);

    const handleNextPage = () => {
        setCurrentPage(prev => {
            const nextPage = prev === totalPages - 1 ? 0 : prev + 1;
            // 检查下一页的数据是否足够5条
            const nextStartIndex = nextPage * storiesPerPage;
            const nextEndIndex = Math.min(nextStartIndex + storiesPerPage, stories.length);
            const nextPageStories = stories.slice(nextStartIndex, nextEndIndex);
            
            // 如果下一页数据不足5条，回到第一页
            if (nextPageStories.length < 5) {
                return 0;
            }
            return nextPage;
        });
    };

    const handleLike = async (storyId: number) => {
        await sendWhiskey(storyId);
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
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999
        }}>
            <div style={{
                width: '780px',
                height: '784px',
                backgroundColor: 'rgba(26, 26, 63, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '36px',
                backdropFilter: 'blur(18px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                position: 'relative'
            }}>
                {/* Header */}
                <h2 style={{
                    fontFamily: 'Montserrat',
                    fontWeight: 700,
                    fontSize: '32px',
                    lineHeight: '32px',
                    color: '#FFFFFF',
                    marginBottom: '24px',
                    paddingLeft: '24px'
                }}>
                    Let's Meet
                </h2>

                {/* Stories List */}
                <div style={{
                    flex: 1,
                    padding: '0 24px'
                }}>
                    {currentStories.map((story, index) => {
                        // 根据索引选择表情
                        const emojis = ['👋', '💬', '🥺', '🍄', '💐'];
                        const emoji = emojis[index];

                        return (
                            <div 
                                key={story.id} 
                                onClick={() => {
                                    // 关闭当前列表
                                    setIsListOpen(false);
                                    // 发送事件打开内容窗口，并传递选中的故事
                                    EventBus.emit("open-content-with-story", story);
                                }}
                                style={{
                                    width: '684px',
                                    height: '96px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '0.5px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                    e.currentTarget.style.border = '0.5px solid rgba(255, 255, 255, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.border = '0.5px solid rgba(255, 255, 255, 0.2)';
                                }}
                            >
                                {/* Emoji Container */}
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '0.5px solid rgba(255, 255, 255, 0.4)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    position: 'relative',
                                    left: '0px'
                                }}>
                                    <span style={{
                                        fontSize: '32px',
                                        lineHeight: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {emoji}
                                    </span>
                                </div>
                                
                                <div style={{
                                    fontFamily: 'Montserrat',
                                    fontSize: '16px',
                                    color: '#FFFFFF',
                                    lineHeight: '24px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word'
                                }}>
                                    {story.story_content}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '24px'
                }}>
                    <button
                        onClick={handleNextPage}
                        style={{
                            width: '180px',
                            height: '72px',
                            background: '#1A1A3F',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '16px',
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontSize: '20px',
                            fontWeight: 700,
                            lineHeight: '100%',
                            letterSpacing: '0%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <img 
                            src="img/nextButton.png" 
                            alt="next"
                            style={{
                                width: '24px',
                                height: '24px'
                            }}
                        />
                        Next
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => {
                        setIsListOpen(false);
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
            </div>
        </div>
    );
} 