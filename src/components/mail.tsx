"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EventBus } from "@/game/EventBus";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { StoryList } from "./StoryList";
import { StoryPanel } from "./StoryPanel";
import { Story } from "@/components/StoryList";

export function Mail({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isMyStories, setIsMyStories] = useState(false);
  const [recipient, setRecipient] = useState<string>("");
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [approveAmount, setApproveAmount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [balance, setBalance] = useState(0);

  const { connected, account, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    const handleOpenChat = () => {
      setIsMailOpen(true);
    };

    EventBus.on("open-chat", handleOpenChat);
    return () => {
      EventBus.removeListener("open-chat", handleOpenChat);
    };
  }, []);

  // 查询 Aptos 余额
  useEffect(() => {
    if (!account?.address) return;

    const fetchBalance = async () => {
      try {
        // const res = await fetch(
        //   `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${account.address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
        // );
        // const data = await res.json();
        // setBalance(Number(data?.data?.coin?.value) / 1e8); 
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 3000000000000); // 3秒刷新一次
    return () => clearInterval(interval);
  }, [account?.address]);

  // 发送 Aptos 交易
  const sendCoin = async () => {
    if (!approveAmount || isSending || !account) return;

    try {
      setIsSending(true);
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [recipient, (approveAmount * 1e8).toString()], // 转换为 APT 单位
      };

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          type: "entry_function_payload",
          function: "0x1::coin::transfer",
          type_arguments: ["0x1::aptos_coin::AptosCoin"],
          arguments: [recipient, (approveAmount * 1e8).toString()],
        } as any, // Explicitly cast to bypass type mismatch
      });
      console.log("Transaction Submitted:", response);

      setIsSending(false);
    } catch (error) {
      console.error("Transaction Failed:", error);
      setIsSending(false);
    }
  };

  // 切换 Story 视图
  const handleStoriesToggle = (isMyStories: boolean) => {
    setIsMyStories(isMyStories);
    setSelectedStory(null);
  };

  if (!isMailOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className={cn(
          "bg-[#2A2A2F] w-[90%] max-w-6xl h-[90vh] flex flex-col relative border-2 border-[#4A4A4F] shadow-[4px_4px_0px_0px_#1A1A1F]",
          "pixel-corners",
          className
        )}
      >
        {/* 关闭按钮 */}
        <button
          onClick={() => setIsMailOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-xl w-8 h-8"
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

        {/* 内容区 */}
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
              sendCoin={sendCoin} // 传递 Aptos 交易方法
              balance={balance} // 余额信息
            />
          </div>
        </div>
      </div>
    </div>
  );
}