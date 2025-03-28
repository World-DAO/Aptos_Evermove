import { StoryView } from "@/components/StoryView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from 'react';
import { Story } from "@/components/StoryList";
interface StoryPanelProps {
  selectedStory: Story | null;
  sendCoin: () => Promise<void>;
  balance: number;
  isMyStories: boolean;
  recipient: string;
  approveAmount: number;
  setApproveAmount: (amount: number) => void;
}

export function StoryPanel(props: StoryPanelProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col bg-[#2A4C54]">
      {props.selectedStory ? (
        <ScrollArea className="flex-1" viewportRef={viewportRef}>
          <StoryView
            selectedStory={props.selectedStory}
            isMyStories={props.isMyStories}
            recipient={props.recipient}
            approveAmount={props.approveAmount}
            setApproveAmount={props.setApproveAmount}
          />
        </ScrollArea>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-[#4EEAFF]/50 font-pixel">Select a story to read</p>
        </div>
      )}
    </div>
  );
}
