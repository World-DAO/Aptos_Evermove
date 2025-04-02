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
        this.dialog = new Dialog(this.scene);
        if (!this.dialog) return;
        
        // Disable keyboard when dialog opens
        this.sceneManager.disableGameInput();
        
        // Show initial greeting
        this.dialog.showResponse("Welcome to Web3 Tavern! I'm the bartender here, how can I help you today?");
        this.dialog.show();

        // Listen for messages
        EventBus.on('barman-message', async (message: string) => {
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
        });

        // Handle streaming responses
        EventBus.on('chat-stream', ({ chunk, isComplete }: { chunk: string; isComplete: boolean }) => {
            if (!this.dialog) return;
            this.dialog.showResponse(chunk);
        });
    }

    private endDialog() {
        if (this.dialog) {
            // Enable keyboard when dialog closes
            this.sceneManager.enableGameInput();
            
            EventBus.removeListener('barman-message');
            this.dialog.destroy();
            this.dialog = undefined;
        }
    }

    public destroy() {
        this.dialog?.destroy();
        // Remove event listener
        EventBus.removeListener("chat-stream");
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
