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
    private meetButton: Phaser.GameObjects.Image | null = null;
    private currentResponse: string = "";  // Keep this for accumulating chunks
    private isSearchMode: boolean = false;  // Add this line

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
            bgHeight - 220,
            'dialog-box'
        )
        .setDisplaySize(1300, 192)
        .setScrollFactor(0)
        .setDepth(10);

        // Add close button at top right of dialog box
        const closeButton = this.scene.add.image(
            bgWidth / 2 + 620,
            bgHeight - 280,
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
            bgWidth / 2 - 580,
            bgHeight - 230,
            'profile-pic'
        )
        .setDisplaySize(72, 72)
        .setScrollFactor(0)
        .setDepth(11);

        // Adjust text position to be next to profile
        this.responseText = this.scene.add
            .text(bgWidth / 2 - 520, bgHeight - 230, "", {
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
            padding: '0 70px 0 140px',
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #383838',
            borderRadius: '20px',
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
            width: '24px',
            height: '24px',
            backgroundImage: 'url("img/EnterIcon.png")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            cursor: 'pointer',
            zIndex: '13'
        });

        // Create search mode toggle button
        const searchModeButton = document.createElement('div');
        Object.assign(searchModeButton.style, {
            position: 'absolute',
            left: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '6px 12px',
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #383838',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Montserrat',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: '13',
            transition: 'all 0.2s ease'
        });

        const searchIcon = document.createElement('img');
        searchIcon.src = 'img/SearchIcon.png';
        searchIcon.style.width = '16px';
        searchIcon.style.height = '16px';

        const buttonText = document.createElement('span');
        buttonText.textContent = 'Search';

        searchModeButton.appendChild(searchIcon);
        searchModeButton.appendChild(buttonText);

        // Add click handler for search mode toggle
        searchModeButton.addEventListener('click', () => {
            this.isSearchMode = !this.isSearchMode;
            if (this.isSearchMode) {
                searchModeButton.style.backgroundColor = '#383838';
                this.inputField.placeholder = 'Search mode: Ask anything...';
            } else {
                searchModeButton.style.backgroundColor = '#1A1A1A';
                this.inputField.placeholder = 'Type your message...';
            }
        });

        // Add elements to container
        this.inputContainer.appendChild(this.inputField);
        this.inputContainer.appendChild(searchModeButton);
        this.inputContainer.appendChild(enterIcon);
        document.body.appendChild(this.inputContainer);

        // Modify enter key handler to use current mode
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.inputField.value.trim()) {
                if (this.isSearchMode) {
                    this.handleSearchSubmit(this.inputField.value);
                } else {
                    this.handleSubmit(this.inputField.value);
                }
                this.inputField.value = '';
            }
        });

        // Add click handler for enter icon
        enterIcon.addEventListener('click', () => {
            if (this.inputField.value.trim()) {
                if (this.isSearchMode) {
                    this.handleSearchSubmit(this.inputField.value);
                } else {
                    this.handleSubmit(this.inputField.value);
                }
                this.inputField.value = '';
            }
        });
    }

    private handleSubmit(message: string) {
        // Emit event for AI response
        EventBus.emit('barman-message', message);
    }

    private handleSearchSubmit(message: string) {
        // Emit event for search AI response
        EventBus.emit('search-message', message);
    }

    private createMeetButton() {
        // Remove existing meet button if it exists
        this.meetButton?.destroy();

        // Create meet button using just the image
        this.meetButton = this.scene.add.image(
            410, // x position
            this.scene.cameras.main.height - 160, // y position (above input)
            'meet-button'
        )
        .setInteractive({ useHandCursor: true })
        .setDepth(11)
        .setScrollFactor(0);

        // Add hover effects
        this.meetButton.on('pointerover', () => {
            this.meetButton?.setAlpha(0.8);
        });

        this.meetButton.on('pointerout', () => {
            this.meetButton?.setAlpha(1);
        });

        // Add click handler
        this.meetButton.on('pointerdown', () => {
            const storyId = localStorage.getItem('lastSearchStoryId');
            this.hide();
            EventBus.emit('open-content-byid', storyId);
        });
    }

    public showResponse(text: string) {
        if (text === "...") {
            // Reset for new conversation
            this.currentResponse = "";
            this.responseText.setText(text);
            // Remove meet button when starting new conversation
            this.meetButton?.destroy();
            this.meetButton = null;
        } else if (text === "") {
            // Skip empty chunks
            return;
        } else {
            // 累积新的字符
            this.currentResponse += text;
            this.responseText.setText(this.currentResponse);
            // Add meet button if in search mode and response is complete
            if (this.isSearchMode && !this.meetButton) {
                this.createMeetButton();
            }
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
        this.meetButton?.destroy();
        this.meetButton = null;
        this.clearResponse();
        this.isSearchMode = false;
    }

    public destroy() {
        this.dialogBox.destroy();
        this.profilePic.destroy();
        this.responseText.destroy();
        this.closeButton.destroy();  // Destroy close button
        this.inputContainer.remove();
        this.meetButton?.destroy();
    }

    public isContained(x: number, y: number): boolean {
        return this.responseText.getBounds().contains(x, y);
    }
}
