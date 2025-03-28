import { useEffect, useState } from "react";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/lib/utils";
import { useContent } from "@/hooks/useContent";
import { useGenericSpaceKeyDown } from "@/hooks/useGenericSpaceKeyDown";

interface WriteWindowProps extends React.HTMLAttributes<HTMLDivElement> {}

export function WriteWindow({ className }: WriteWindowProps) {
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [writeTitle, setWriteTitle] = useState("");
    const [writeContent, setWriteContent] = useState("");
    const { createStory, loading } = useContent();

    const handleTitleKeyDown = useGenericSpaceKeyDown(setWriteTitle);
    const handleContentKeyDown = useGenericSpaceKeyDown(setWriteContent);

    // Listen for write button click
    useEffect(() => {
        const handleOpenWrite = () => {
            setIsWriteOpen(true);
        };

        EventBus.on("open-write", handleOpenWrite);

        return () => {
            EventBus.removeListener("open-write");
        };
    }, []);

    const handlePublish = async () => {
        if (!writeTitle.trim() || !writeContent.trim()) return;

        const result = await createStory(writeTitle, writeContent);
        if (result.success) {
            setWriteTitle("");
            setWriteContent("");
            setIsWriteOpen(false);
        }
    };

    // 新增的 handlePublishAndEarn，传入 isPay 为 true
    const handlePublishAndEarn = async () => {
        if (!writeTitle.trim() || !writeContent.trim()) return;

        const result = await createStory(writeTitle, writeContent, true);
        if (result.success) {
            setWriteTitle("");
            setWriteContent("");
            setIsWriteOpen(false);
        }
    };

    if (!isWriteOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
                className={cn(
                    "w-[717px] h-[737px] relative flex flex-col",
                    "bg-[#8361A0]/50 backdrop-blur-[24px]",
                    "rounded-[24px]",
                    className,
                )}
            >
                {/* Close Button */}
                <button
                    onClick={() => setIsWriteOpen(false)}
                    className="absolute top-6 right-6 text-white/70 
                            hover:text-white text-2xl w-8 h-8"
                >
                    ×
                </button>

                {/* Writing Area */}
                <div className="flex-1 p-12 flex flex-col gap-2">
                    <input
                        type="text"
                        value={writeTitle}
                        onChange={(e) => setWriteTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="Story title..."
                        className="w-full bg-[#2A2A2F]/40 
                                border border-white/20 
                                rounded-[12px] p-4 
                                text-white placeholder:text-white/50
                                focus:outline-none focus:border-white/30"
                    />

                    <textarea
                        value={writeContent}
                        onChange={(e) => setWriteContent(e.target.value)}
                        onKeyDown={handleContentKeyDown}
                        placeholder="Write your story here..."
                        className="flex-1 w-full bg-[#2A2A2F]/40 
                                border border-white/20 
                                rounded-[12px] p-4 
                                text-white placeholder:text-white/50
                                focus:outline-none focus:border-white/30 
                                resize-none"
                    />

                    {/* Publish Buttons */}
                    <div className="flex justify-center gap-6 mt-4">
                        <button
                            onClick={handlePublish}
                            disabled={
                                !writeTitle.trim() || !writeContent.trim()
                            }
                            className="px-8 py-2 bg-white/20 rounded-xl
                                    text-white hover:bg-white/30 
                                    transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            PUBLISH
                        </button>
                        <button
                            onClick={handlePublishAndEarn}
                            disabled={
                                !writeTitle.trim() || !writeContent.trim()
                            }
                            className="px-8 py-2 bg-white/20 rounded-xl
                                    text-white hover:bg-white/30 
                                    transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            PUBLISH and EARN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

