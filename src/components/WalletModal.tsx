import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";

interface WalletModalProps {
    onClose: () => void;
    onGameStart: () => void;
}

export function WalletModal({ onClose, onGameStart }: WalletModalProps) {
    const { wallets, connect, disconnect, account, connected } = useWallet();
    const [error, setError] = useState<string>("");

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/85 backdrop-blur-[10px]">
            <div className="w-[400px] bg-[rgba(20,20,20,0.95)] p-[30px] rounded-xl shadow-[0_0_10px_rgba(0,255,255,0.7)] 
                          text-center border-2 border-[rgba(0,255,255,0.5)]">
                <h2 className="text-[22px] font-bold mb-[15px] text-[#0ff]">
                    🔮 Select Wallet
                </h2>

                {/* 如果钱包已连接，显示已连接的钱包信息 */}
                {connected ? (
                    <div className="mb-4">
                        <p className="text-[#0f0] font-bold text-[16px]">
                            ✅ {account?.address.toString().slice(0, 6)}...
                        </p>
                        <button
                            onClick={async () => {
                                disconnect();
                            }}
                            className="mt-3 w-full p-[10px] text-[14px] font-bold rounded cursor-pointer 
                                      border-2 border-[#ff4500] bg-[rgba(255,69,0,0.2)] text-[#ff4500]
                                      shadow-[0_0_5px_#ff4500] transition-all duration-300"
                        >
                            ❌ Disconnect
                        </button>
                    </div>
                ) : (
                    // 未连接时，显示所有钱包选项
                    <ul className="list-none p-0 m-0">
                        {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                                <li key={wallet.name} className="mb-[10px]">
                                    <button
                                        onClick={async () => {
                                            try {
                                                connect(wallet.name);
                                                console.log(`✅ Connected: ${wallet.name}`);
                                            } catch (err) {
                                                setError("Failed to connect wallet");
                                            }
                                        }}
                                        className="w-full p-[10px] text-[14px] font-bold rounded cursor-pointer 
                                                  border-2 border-[#ff0090] bg-[rgba(255,0,144,0.2)] text-[#ff0090] 
                                                  shadow-[0_0_5px_#ff0090] transition-all duration-300"
                                    >
                                        Connect {wallet.name}
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p className="text-[#ff0090] text-[14px] mt-[10px] shadow-[0_0_5px_#ff0090]">
                                ❌ No wallet detected. Please install an Aptos wallet.
                            </p>
                        )}
                    </ul>
                )}

                {/* 进入游戏按钮 */}
                <Button
                    onClick={() => {
                        if (account?.address) {
                            onGameStart();
                            onClose();
                        }
                    }}
                    disabled={!account?.address}
                    className={`w-full mt-[20px] p-[12px] text-[16px] font-bold rounded transition-all duration-300
                              border-2 border-[#0ff] 
                              ${account?.address
                            ? 'bg-[rgba(0,255,255,0.5)] text-[#0ff] cursor-pointer shadow-[0_0_8px_#0ff]'
                            : 'bg-[rgba(128,128,128,0.5)] text-[#888] cursor-not-allowed'
                        }`}
                >
                    🎮 Enter Game
                </Button>

                {/* 错误信息 */}
                {error && <p className="text-red-500 mt-3">{error}</p>}
            </div>
        </div>
    );
}