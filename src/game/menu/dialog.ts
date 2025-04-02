// src/Dialog.ts
import Phaser from "phaser";
import { EventBus } from "../EventBus";

export enum DialogState {
    HIDDEN = "HIDDEN",
    TYPING = "TYPING",
    SHOWING = "SHOWING",
    SHOWING_OPTIONS = "SHOWING_OPTIONS",
}

export interface DialogOption {
    text: string;
    callback: () => void;
}

export default class Dialog {
    private scene: Phaser.Scene;
    private dialogBox: Phaser.GameObjects.Image;  // Change to Image
    private profilePic: Phaser.GameObjects.Image;  // Add this property
    private responseText: Phaser.GameObjects.Text;
    private inputContainer: HTMLDivElement;
    private inputField: HTMLInputElement;
    private closeButton: Phaser.GameObjects.Image; 
    private currentResponse: string = "";  // Keep this for accumulating chunks

    public state: DialogState = DialogState.HIDDEN;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createDialogBoxes();
    }

    private createDialogBoxes() {
        const bgWidth = this.scene.cameras.main.width;
        const bgHeight = this.scene.cameras.main.height;

        // Dialog box background
        this.dialogBox = this.scene.add.image(
            bgWidth / 2,
            bgHeight - 200,
            'dialog-box'
        )
        .setDisplaySize(1300, 148)
        .setScrollFactor(0)
        .setDepth(10);

        // Add close button at top right of dialog box
        const closeButton = this.scene.add.image(
            bgWidth / 2 + 620,  // Right edge of dialog + some padding
            bgHeight - 250,     // Top of dialog - some padding
            'close-button'
        )
        .setDisplaySize(24, 24)
        .setScrollFactor(0)
        .setDepth(11)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.hide());

        // Store reference for show/hide/destroy
        this.closeButton = closeButton;

        // Store profile pic reference
        this.profilePic = this.scene.add.image(
            bgWidth / 2 - 600,
            bgHeight - 200,
            'profile-pic'
        )
        .setDisplaySize(48, 48)
        .setScrollFactor(0)
        .setDepth(11);

        // Adjust text position to be next to profile
        this.responseText = this.scene.add
            .text(bgWidth / 2 - 540, bgHeight - 200, "", {
                fontSize: "20px",
                color: "#FFFFFF",
                fontFamily: "Montserrat",
                fontStyle: "500",
                align: "left",
                lineSpacing: 14,
                wordWrap: { width: 1100 }
            })
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(11);

        this.inputContainer = document.createElement('div');
        Object.assign(this.inputContainer.style, {
            position: 'fixed',
            left: '50%',
            bottom: '40px',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            width: '1300px',
            height: '74px',
            padding: '0',
            zIndex: '12',
        });

        // Create and style the input field
        this.inputField = document.createElement('input');
        Object.assign(this.inputField.style, {
            width: '100%',
            height: '74px',
            padding: '0 70px',
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #383838',
            borderRadius: '20px',    // Updated to 32px
            outline: 'none',
            fontFamily: 'Montserrat',
            fontWeight: '500',
            fontSize: '20px',
            lineHeight: '74px',
            caretColor: '#FFFFFF'
        });

        this.inputField.placeholder = 'Type your message...';

        // Style the placeholder
        const style = document.createElement('style');
        style.textContent = `
            input::placeholder {
                color: rgba(255, 255, 255, 0.5);
                font-family: Montserrat;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);

        // Create enter icon
        const enterIcon = document.createElement('div');
        Object.assign(enterIcon.style, {
            position: 'absolute',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',     // Changed from 32px to 24px
            height: '24px',    // Changed from 32px to 24px
            backgroundImage: 'url("img/EnterIcon.png")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: '13'
        });

        // Add elements to container
        this.inputContainer.appendChild(this.inputField);
        this.inputContainer.appendChild(enterIcon);
        document.body.appendChild(this.inputContainer);

        // Add enter key handler
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.inputField.value.trim()) {
                this.handleSubmit(this.inputField.value);
                this.inputField.value = '';
            }
        });
    }

    private handleSubmit(message: string) {
        // Emit event for AI response
        EventBus.emit('barman-message', message);
    }

    public showResponse(text: string) {
        if (text === "...") {
            // Reset for new conversation
            this.currentResponse = "";
            this.responseText.setText(text);
        } else if (text === "") {
            // Skip empty chunks
            return;
        } else {
            // Accumulate chunks
            this.currentResponse += text;
            this.responseText.setText(this.currentResponse);
        }
    }

    public clearResponse() {
        this.currentResponse = "";
        this.responseText.setText("");
    }

    public show() {
        this.dialogBox.setVisible(true);
        this.profilePic.setVisible(true);
        this.responseText.setVisible(true);
        this.closeButton.setVisible(true);  // Show close button
        this.inputContainer.style.display = 'flex';
        this.inputField.focus();
    }

    public hide() {
        this.dialogBox.setVisible(false);
        this.profilePic.setVisible(false);
        this.responseText.setVisible(false);
        this.closeButton.setVisible(false);  // Hide close button
        this.inputContainer.style.display = 'none';
        this.clearResponse();
    }

    public destroy() {
        this.dialogBox.destroy();
        this.profilePic.destroy();
        this.responseText.destroy();
        this.closeButton.destroy();  // Destroy close button
        this.inputContainer.remove();
    }

    public isContained(x: number, y: number): boolean {
        return this.responseText.getBounds().contains(x, y);
    }
}
