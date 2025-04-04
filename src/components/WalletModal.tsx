import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";

const GoogleIcon = () => (
    <img
        src={"/img/google_logo.svg"}
        alt="Google Logo"
        className="inline-block w-4 h-4 mr-2"  // 减小图标尺寸
    />
);

const OKXIcon = () => (
    <img
        src={"/img/okx_logo.png"}
        alt="OKX Logo"
        className="inline-block w-5 h-5 mr-2"
    />
);

interface WalletModalProps {
    onClose: () => void;
    onGameStart: () => void;
}

export function WalletModal({ onClose, onGameStart }: WalletModalProps) {
    const { wallets, connect, disconnect, account, connected } = useWallet();
    const [error, setError] = useState<string>("");

    // 钱包过滤和排序
    const filteredWallets = wallets
        .filter(wallet => {
            console.log('Available wallet:', wallet.name);
            return wallet.name === 'Continue with Google' || wallet.name === 'OKX Wallet';
        })
        .sort((a, b) => {
            // 确保 Google 钱包总是排在第一位
            if (a.name === 'Continue with Google') return -1;
            if (b.name === 'Continue with Google') return 1;
            return 0;
        });

    type WalletName = 'Continue with Google' | 'OKX Wallet';


    const walletStyles: Record<WalletName, {
        border: string;
        bg: string;
        shadow: string;
        icon: React.ReactNode;
    }> = {
        'Continue with Google': {
            border: 'linear-gradient(90deg, #FF0080 0%, #8A2BE2 50%, #4285F4 100%)',
            bg: 'linear-gradient(90deg, rgba(255,0,128,0.1) 0%, rgba(138,43,226,0.1) 50%, rgba(66,133,244,0.1) 100%)',
            shadow: '#FF0080',
            icon: <GoogleIcon />
        },
        'OKX Wallet': {
            border: '#ffffff',
            bg: 'transparent',
            shadow: '#ffffff',
            icon: null
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-[10px]">
            <div className="absolute inset-0">
                <img
                    src="/img/cover_new.png"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>
            {/* 深色半透明遮罩层，确保文字可读性 */}
            <div className="absolute inset-0 bg-black/70"></div>

            {/* 内容容器 */}
            <div className="relative z-10 w-[360px] bg-[rgba(20,20,20,0.95)] p-[30px] rounded-[30px] 
                          shadow-[0_0_10px_rgba(0,255,255,0.7)] text-center border-2 border-[rgba(0,255,255,0.5)]">
                <h2 className="text-[22px] font-bold mb-[15px] text-[#0ff]">
                    🔮 Select Wallet
                </h2>

                {connected ? (
                    <div className="mb-4">
                        <p className="text-[#0f0] font-bold text-[16px]">
                            ✅ {account?.address?.toString().slice(0, 6)}...
                        </p>
                        <button
                            onClick={async () => {
                                disconnect();
                            }}
                            className="mt-3 w-full p-[10px] text-[14px] font-bold rounded-[30px] cursor-pointer 
                                      border-2 border-[#ff4500] bg-[rgba(255,69,0,0.2)] text-[#ff4500]
                                      shadow-[0_0_5px_#ff4500] transition-all duration-300"
                        >
                            ❌ Disconnect
                        </button>
                    </div>
                ) : (
                    <ul className="list-none p-0 m-0 flex flex-col items-center">
                        {filteredWallets.length > 0 ? (
                            filteredWallets.map((wallet) => {
                                const style = walletStyles[wallet.name as WalletName];
                                return (
                                    <li key={wallet.name} className="mb-[10px] w-[280px]">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    console.log(`Connecting to ${wallet.name}...`);
                                                    connect(wallet.name);
                                                    console.log(`✅ Connected: ${wallet.name}`);
                                                } catch (err) {
                                                    setError("Failed to connect wallet");
                                                }
                                            }}
                                            className={`
                                                w-full p-[8px] text-[13px] font-bold rounded-[30px] cursor-pointer 
                                                transition-all duration-300
                                                ${wallet.name === 'Continue with Google'
                                                    ? `bg-gradient-to-r from-[#FF0080] via-[#8A2BE2] to-[#4285F4]
                                                       hover:shadow-[0_0_15px_rgba(255,0,128,0.5)]
                                                       text-white flex items-center justify-center
                                                       border-none`
                                                    : `bg-transparent hover:bg-white/10
                                                       hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]
                                                       text-white flex items-center justify-center
                                                       border-2 border-white/50 hover:border-white`
                                                }`}
                                        >
                                            {typeof style.icon === 'string' ? style.icon : style.icon}
                                            <span className={wallet.name === 'Continue with Google' ? 'ml-2' : ''}>
                                                {wallet.name === 'Continue with Google' ? 'Continue with Google' : `Connect ${wallet.name}`}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })
                        ) : (
                            <p className="text-[#ff0090] text-[14px] mt-[10px]">
                                ❌ 请安装 Google Petra 或 OKX 钱包
                            </p>
                        )}
                    </ul>
                )}

                <div className="flex justify-center">
                    <Button
                        onClick={() => {
                            if (account?.address) {
                                onGameStart();
                                onClose();
                            }
                        }}
                        disabled={!account?.address}
                        className={`w-[280px] mt-[20px] p-[12px] text-[16px] font-bold rounded-[30px] transition-all duration-300
                                  border-2 border-[#0ff] 
                                  ${account?.address
                                ? 'bg-[rgba(0,255,255,0.5)] text-[#0ff] cursor-pointer shadow-[0_0_8px_#0ff]'
                                : 'bg-[rgba(128,128,128,0.5)] text-[#888] cursor-not-allowed'
                            }`}
                    >
                        🎮 Enter Game
                    </Button>
                </div>

                {error && <p className="text-red-500 mt-3">{error}</p>}
            </div>
        </div>
    );
}