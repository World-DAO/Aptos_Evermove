import { EventBus } from '../EventBus';

class AIChatClient {
    private static instance: AIChatClient;
    private isStreaming = false;
    // 直接使用服务端 API URL，不再使用代理
    private API_URL = "https://www.emptylab.org/api/chat";
    private SEARCH_API_URL = "https://www.emptylab.org/api/search";

    // Mock responses for development
    private mockSearchResponses = [
        {
            status: "success",
            agent_response: "I found a story about Web3 gaming that might interest you. It discusses the integration of blockchain technology in modern gaming platforms.",
            storyId: "1"
        },
        {
            status: "success",
            agent_response: "Here's a relevant story about NFT marketplaces and their impact on digital art collections.",
            storyId: "2"
        },
        {
            status: "success",
            agent_response: "I discovered a story about decentralized finance (DeFi) and its role in the future of banking.",
            storyId: "3"
        }
    ];

    private constructor() { }

    public static getInstance(): AIChatClient {
        if (!AIChatClient.instance) {
            AIChatClient.instance = new AIChatClient();
        }
        return AIChatClient.instance;
    }

    public async sendMessage(message: string): Promise<void> {
        if (this.isStreaming) {
            console.warn("⚠️ 正在等待上一条消息的回复");
            return;
        }

        try {
            EventBus.emit("chat-loading", true);
            this.isStreaming = true;
            
            const response = await fetch(this.API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    wallet: "0xfA5aC709311146dA718B3fba0a90A3Bd96e7a471",
                    content: message,
                })
            });

            if (!response.ok) {
                throw new Error(`服务器错误: ${response.status}`);
            }

            // 获取完整响应文本
            const completeText = await response.text();
            
            // 模拟流式输出，每次只发送新的字符
            for (const char of completeText) {
                await new Promise(resolve => setTimeout(resolve, 30)); // 控制打字速度
                EventBus.emit("chat-stream", {
                    chunk: char,
                    isComplete: false
                });
            }

            // 发送完成事件
            EventBus.emit("chat-stream", {
                chunk: "",
                isComplete: true
            });

        } catch (error) {
            console.error("❌ AI回复失败:", error);
            EventBus.emit("chat-loading", false);
        } finally {
            this.isStreaming = false;
            EventBus.emit("chat-loading", false);
        }
    }

    public async sendSearchMessage(message: string): Promise<void> {
        if (this.isStreaming) {
            console.warn("⚠️ 正在等待上一条消息的回复");
            return;
        }

        try {
            EventBus.emit("chat-loading", true);
            console.log("🔍 Sending search message to AI:", message);
            this.isStreaming = true;

            // Mock API response
            const mockResponse = this.getMockSearchResponse();
            console.log("Mock search response:", mockResponse);

            // Store storyId in localStorage
            if (mockResponse.status === "success" && mockResponse.storyId) {
                localStorage.setItem('lastSearchStoryId', mockResponse.storyId);
            }

            // Simulate streaming response like in sendMessage
            const response = {
                body: new ReadableStream({
                    async start(controller) {
                        // Split the response into chunks
                        const chunks = mockResponse.agent_response.match(/.{1,3}/g) || [];
                        
                        for (const chunk of chunks) {
                            await new Promise(resolve => setTimeout(resolve, 30));
                            controller.enqueue(new TextEncoder().encode(JSON.stringify({
                                type: "agent_answer",
                                content: chunk
                            })));
                        }
                        
                        controller.close();
                    }
                })
            };

            if (!response.body) {
                console.error("No response body received.");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                let jsonStart = buffer.indexOf("{");
                let jsonEnd = buffer.indexOf("}", jsonStart);

                while (jsonStart !== -1 && jsonEnd !== -1) {
                    const jsonStr = buffer.slice(jsonStart, jsonEnd + 1);
                    buffer = buffer.slice(jsonEnd + 1);

                    try {
                        const chunkData = JSON.parse(jsonStr);
                        if (chunkData.type === "agent_answer") {
                            await new Promise(resolve => setTimeout(resolve, 30));
                            EventBus.emit("chat-stream", {
                                chunk: chunkData.content,
                                isComplete: false
                            });
                        }
                    } catch (error) {
                        console.error("JSON Parse Error:", error, "Data:", jsonStr);
                    }

                    jsonStart = buffer.indexOf("{");
                    jsonEnd = buffer.indexOf("}", jsonStart);

                    if (jsonEnd === -1) break;
                }
            }

            // Send completion event
            EventBus.emit("chat-stream", {
                chunk: "",
                isComplete: true
            });

        } catch (error) {
            console.error("❌ Search AI回复失败:", error);
            EventBus.emit("chat-loading", false);
        } finally {
            this.isStreaming = false;
        }
    }

    private getMockSearchResponse() {
        // Randomly select a mock response
        const randomIndex = Math.floor(Math.random() * this.mockSearchResponses.length);
        return this.mockSearchResponses[randomIndex];
    }
}

export default AIChatClient.getInstance(); 