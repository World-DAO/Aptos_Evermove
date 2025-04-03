// scenes/tavern/BarmanInteraction.ts
import Phaser from "phaser";
import Player from "../../heroes/player";
import Barman from "../../heroes/barman";
import Dialog from "../../menu/dialog";
import AIChatClient from "../../utils/AIChatClient";
import { EventBus } from "../../EventBus";
import { SceneManager } from "./sceneManager";

export class BarmanInteraction {
    private scene: Phaser.Scene;
    private player: Player;
    private barman: Barman;
    private gridSize: number;
    private dialog?: Dialog;
    private isDialogVisible = false;
    private sceneManager: SceneManager;

    constructor(
        scene: Phaser.Scene,
        player: Player,
        barman: Barman,
        gridSize: number,
        sceneManager: SceneManager
    ) {
        this.scene = scene;
        this.player = player;
        this.barman = barman;
        this.gridSize = gridSize;
        this.sceneManager = sceneManager;
    }

    public handleBarmanInteraction() {
        // 先移除可能存在的旧监听器
        this.removeEventListeners();
        
        this.dialog = new Dialog(this.scene);
        if (!this.dialog) return;
        
        // Disable keyboard when dialog opens
        this.sceneManager.disableGameInput();
        
        // Show initial greeting
        this.dialog.showResponse("Welcome to Web3 Tavern! I'm the bartender here, how can I help you today?");
        this.dialog.show();

        // Listen for regular messages
        EventBus.on('barman-message', this.handleBarmanMessage);

        // Listen for search messages
        EventBus.on('search-message', this.handleSearchMessage);

        // Handle streaming responses
        EventBus.on('chat-stream', this.handleChatStream);
    }

    // 将事件处理函数定义为类的方法，以便能够正确移除
    private handleBarmanMessage = async (message: string) => {
        if (!this.dialog) return;
        
        // Show loading state
        this.dialog.showResponse("...");

        try {
            // Send message and let streaming handler update the dialog
            await AIChatClient.sendMessage(message);
        } catch (error) {
            console.error('Failed to get AI response:', error);
            this.dialog.showResponse('Sorry, I had trouble understanding that. Could you try again?');
        }
    }

    private handleSearchMessage = async (message: string) => {
        if (!this.dialog) return;
        
        // Show loading state
        this.dialog.showResponse("...");

        try {
            // Send search message and let streaming handler update the dialog
            await AIChatClient.sendSearchMessage(message);
        } catch (error) {
            console.error('Failed to get search response:', error);
            this.dialog.showResponse('Sorry, I had trouble with the search. Could you try again?');
        }
    }

    private handleChatStream = ({ chunk, isComplete }: { chunk: string; isComplete: boolean }) => {
        if (!this.dialog) return;
        this.dialog.showResponse(chunk);
    }

    private removeEventListeners() {
        EventBus.removeListener('barman-message', this.handleBarmanMessage);
        EventBus.removeListener('search-message', this.handleSearchMessage);
        EventBus.removeListener('chat-stream', this.handleChatStream);
    }

    private endDialog() {
        if (this.dialog) {
            // Enable keyboard when dialog closes
            this.sceneManager.enableGameInput();
            
            this.removeEventListeners();
            this.dialog.destroy();
            this.dialog = undefined;
        }
    }

    public destroy() {
        this.dialog?.destroy();
        this.removeEventListeners();
    }

    public isContained(x: number, y: number): boolean {
        // 检查是否点击了对话框
        const inDialog = this.dialog?.isContained(x, y) || false;
        return inDialog
    }

    public isContainedBarman(x: number, y: number): boolean {
        const barmanBounds = this.barman.sprite.getBounds();
        const inBarman = barmanBounds.contains(x, y);
        return inBarman;
    }
}
