import { useEffect, useState } from "react";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/lib/utils";
import { useContent } from "@/hooks/useContent";
import { executePublishAndEarnTransaction } from "@/game/utils/executePublishAndEarnTransaction";
import { useWallet } from '@aptos-labs/wallet-adapter-react'; 
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

interface WriteWindowProps extends React.HTMLAttributes<HTMLDivElement> {}

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);

export function WriteWindow({ className }: WriteWindowProps) {
    const CONTRACT_ADDRESS = "0x98a71c7bb7fe70e92185d12477a1f9553cf4f2312faa469ef98a35810c614c4a";
    const MODULE_NAME = "send";
    const FUNCTION_NAME = "add";
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [writeContent, setWriteContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { createStory, loading } = useContent();
    const { account, signAndSubmitTransaction } = useWallet();

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
        if (!writeContent.trim()) return;
        
        // Generate title from first 10 characters
        const autoTitle = writeContent.trim().slice(0, 10) + "...";
        
        const result = await createStory(autoTitle, writeContent);
        if (result.success) {
            setWriteContent("");
            setIsWriteOpen(false);
        }
    };

    const handlePublishAndEarn = async () => {
        if (!writeContent.trim()) return;
        if (!account) {
            alert("Please connect your wallet first!");
            return;
        }
        setIsLoading(true);
        try {
            const response = await signAndSubmitTransaction({
                sender: account.address,
                data: {
                    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::${FUNCTION_NAME}`,
                    functionArguments: [],
                },
            });
            
            try {
                await aptos.waitForTransaction({ transactionHash: response.hash });
                alert("Transaction successful! Your content will be prioritized in recommendations.");
            } catch (error) {
                console.error(error);
            }
            
            const autoTitle = writeContent.trim().slice(0, 15) + "...";
            const result = await createStory(autoTitle, writeContent, true);
            if (result.success) {
                setWriteContent("");
                setIsWriteOpen(false);
            }
        } catch (error) {
            console.error("Transaction error:", error);
            alert("Failed to submit transaction. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isWriteOpen) return null;

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
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(26, 26, 63, 0.9)',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #FF39E0',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 15px'
                    }} />
                    <div style={{
                        color: '#FFFFFF',
                        fontFamily: 'Montserrat',
                        fontSize: '16px'
                    }}>
                        Processing your transaction...
                    </div>
                </div>
            )}
            <div style={{
                width: '780px',
                height: '700px',
                backgroundColor: 'rgba(26, 26, 63, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '36px',
                backdropFilter: 'blur(18px)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Content Area */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '48px 24px 24px'
                }}>
                    <h2 style={{
                        fontFamily: 'Montserrat',
                        fontWeight: 700,
                        fontSize: '32px',
                        lineHeight: '32px',
                        letterSpacing: '0',
                        color: '#FFFFFF',
                        marginBottom: '24px',
                        alignSelf: 'flex-start'
                    }}>
                       👋Hi there, Aptos frens!
                    </h2>

                    <div style={{
                        fontFamily: 'Montserrat',
                        fontSize: '20px',
                        lineHeight: '34px',
                        color: '#FFFFFF',
                        marginBottom: '24px',
                        alignSelf: 'flex-start'
                    }}>
                        Looking for Aptos builders, creators, or projects? Post your needs and start meaningful collaborations.
                    </div>

                    {/* Story Input */}
                    <textarea
                        value={writeContent}
                        onChange={(e) => setWriteContent(e.target.value)}
                        style={{
                            width: '732px',
                            height: '331px',
                            background: '#1A1A1A',
                            border: '1px solid #383838',
                            borderRadius: '24px',
                            padding: '16px',
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontSize: '20px',
                            lineHeight: '34px',
                            resize: 'none',
                            outline: 'none',
                        }}
                        placeholder="Share your thoughts..."
                    />
                </div>

                {/* Bottom Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    padding: '0 24px 24px'
                }}>
                    <button
                        onClick={handlePublishAndEarn}
                        disabled={!writeContent.trim()}
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
                            opacity: !writeContent.trim() ? '0.5' : '1'
                        }}
                    >
                        Promoted Post
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={!writeContent.trim()}
                        style={{
                            width: '180px',
                            height: '72px',
                            background: '#1A1A3F',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '24px',
                            color: '#FFFFFF',
                            fontFamily: 'Montserrat',
                            fontSize: '20px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            opacity: !writeContent.trim() ? '0.5' : '1'
                        }}
                    >
                        Post
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => {
                        setIsWriteOpen(false);
                        EventBus.emit("close-write");
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

