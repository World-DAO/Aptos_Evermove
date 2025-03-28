"use client"

import * as React from "react"
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils"
import { EventBus } from '@/game/EventBus';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "@/components/config/suiConstant";
import { StoryList } from "./StoryList";
import { StoryPanel } from "./StoryPanel";
import { Story } from "@/components/StoryList";

export function Mail({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isMyStories, setIsMyStories] = useState(false);
  const [recipient, setRecipient] = useState<string>("");
  const [isMailOpen, setIsMailOpen] = useState(false);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const [approveAmount, setApproveAmount] = useState(0);

  const [isSending, setIsSending] = useState(false);

  const { data: balance } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address || "",
      coinType: `0x2::sui::SUI`
    },
    {
      enabled: !!account?.address,
      refetchInterval: 3000
    }
  );

  const sendCoin = async () => {
    if (!approveAmount || isSending) return;
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [approveAmount*10**9]);

      tx.moveCall({
        arguments: [tx.object(coin), tx.pure.address(recipient)],
        typeArguments: ["0x2::coin::Coin<0x2::sui::SUI>"],
        target: `${PACKAGE_ID}::send::create_transfer`,
      });

      signAndExecute(
        {
          transaction: tx.serialize(),
        },
        {
          onSuccess: async ({ digest }) => {
            const { effects } = await suiClient.waitForTransaction({
              digest: digest,
              options: {
                showEffects: true,  
              },
            })
          },
        },
      );
  }

  // Listen for chat button click
  useEffect(() => {
    const handleOpenChat = () => {
      setIsMailOpen(true);
    };

    EventBus.on("open-chat", handleOpenChat);
    
    return () => {
      EventBus.removeListener("open-chat");
    };
  }, []);

  // Clear selected story when switching between Bar Stories and My Stories
  const handleStoriesToggle = (isMyStories: boolean) => {
    setIsMyStories(isMyStories);
    setSelectedStory(null); // Clear selected story
  };

  if (!isMailOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-[#2A2A2F] w-[90%] max-w-6xl h-[90vh] flex flex-col relative border-2 border-[#4A4A4F] shadow-[4px_4px_0px_0px_#1A1A1F]", 
        "pixel-corners", 
        className
      )}>
        {/* Top-right close button */}
        <button
          onClick={() => setIsMailOpen(false)}
          className="absolute top-4 right-4 text-white/70 
                  hover:text-white text-xl w-8 h-8"
        >
          ×
        </button>

        {/* Header */}
        <div className="bg-[#4A4A4F] px-6 py-4 flex items-center justify-between border-b-2 border-[#3A3A3F]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleStoriesToggle(false)}
              className={cn(
                "px-4 py-2 border-b border-r transition-colors text-[#4EEAFF]",
                !isMyStories 
                  ? "bg-[#9D5BDE] border-[#1E1B2D]" 
                  : "bg-[#3A3A3F] border-[#1A1A1F] hover:bg-[#5A5A5F]"
              )}
            >
              BAR STORIES
            </button>
            <button
              onClick={() => handleStoriesToggle(true)}
              className={cn(
                "px-4 py-2 border-b border-r transition-colors text-[#4EEAFF]",
                isMyStories 
                  ? "bg-[#9D5BDE] border-[#1E1B2D]" 
                  : "bg-[#3A3A3F] border-[#1A1A1F] hover:bg-[#5A5A5F]"
              )}
            >
              My Stories
            </button>
          </div>
        </div>

        {/* Content area with thinner divider */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden divide-x divide-[#4EEAFF]/30">
            <StoryList
              selectedStory={selectedStory}
              onSelect={setSelectedStory}
              isMyStories={isMyStories}
              setRecipient={setRecipient}
            />

            <StoryPanel
              selectedStory={selectedStory}
              isMyStories={isMyStories}
              recipient={recipient}
              approveAmount={approveAmount}
              setApproveAmount={setApproveAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 