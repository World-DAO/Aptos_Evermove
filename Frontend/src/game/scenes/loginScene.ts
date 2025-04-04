import { Scene } from "phaser";
import { EventBus } from "../EventBus";

interface LoginResponse {
    success: boolean;
    data?: {
        userId: number;
        username: string;
        lastLoginTime: string;
    };
    error?: string;
}

export class loginScene extends Scene {
    private loginText: Phaser.GameObjects.Text;

    constructor() {
        super("login");
    }

    preload() {
        // Load background image
        this.load.image("cover", "img/cover_new.png");
        this.load.image("logo", "favicon_w.png");
    }

    create() {
        const { width, height } = this.scale;

        // 替换原来的 topOverlay
        const fogOverlay = this.add.graphics();

        // 创建从上到下的渐变遮罩
        fogOverlay.fillGradientStyle(
            0x000000, 0x000000, 0x000000, 0x000000,  // colors
            0.9, 0.9, 0, 0                           // alphas
        );
        fogOverlay.fillRect(0, 0, width, height / 5);
        fogOverlay.setDepth(5);

        // 添加雾气动画效果
        this.tweens.add({
            targets: fogOverlay,
            alpha: { from: 0.8, to: 1 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // 创建一个容器来包含 logo 和文字，以便更好地控制对齐
        const headerContainer = this.add.container(20, 20);
        headerContainer.setDepth(10);

        // 添加 logo
        const logo = this.add.image(0, 0, "logo")
            .setOrigin(0, 0.5)
            .setScale(0.1);

        // 添加 Mooncl 文字
        const logoText = this.add.text(logo.width * 0.1 + 10, 2, "Mooncl", {
            fontSize: "15px",
            fontFamily: "Arial, sans-serif",
            color: "#ffffff",
            fontStyle: "bold",
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: "rgba(0, 0, 0, 0.5)",
                blur: 3,
                fill: true
            }
        })
            .setOrigin(0, 0.5);  // 设置文字原点到左侧中间

        // 将 logo 和文字添加到容器中
        headerContainer.add([logo, logoText]);

        // 计算图片缩放比例（保持原始宽高比）
        const bgTexture = this.textures.get('cover');
        const scaleX = width / bgTexture.source[0].width;
        const scaleY = height / bgTexture.source[0].height;
        const scale = Math.max(scaleX, scaleY); // 取最大缩放值（覆盖模式）

        const background = this.add
            .image(width / 2, height / 2, "cover")
            .setScale(scale)
            .setTint(0x666666);

        // 添加黑色蒙版
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.05);
        overlay.fillRect(0, 0, width, height);

        const fullWidth = window.innerWidth;
        const fullHeight = window.innerHeight;

        const createGradientText = (scene: Phaser.Scene, x: number, y: number, text: string, size: string) => {
            const fontFamily = 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
            const container = scene.add.container(x, y);

            // 分割文本
            const prefix = "Welcome to ";
            const highlight = "Mooncl";
            const style = {
                fontSize: '80px',
                fontFamily: 'Space Grotesk',
                fontWeight: '700',
                color: '#FFFFFF'
            };

            // 创建前缀文本 (白色)
            const prefixText = scene.add.text(0, 0, prefix, {
                ...style,
                color: '#FFFFFF'
            });
            container.add(prefixText);

            // 创建Mooncl渐变文本
            const gradientColors = ['#FF3BFF', '#A341FF', '#28B4FF']; // 更新为新的渐变色

            // 先创建所有字符测量总宽度
            let highlightWidth = 0;
            const charTexts: Phaser.GameObjects.Text[] = [];
            for (let i = 0; i < highlight.length; i++) {
                const charText = scene.add.text(0, 0, highlight[i], style);
                highlightWidth += charText.width;
                charTexts.push(charText);
                charText.destroy(); // 只用于测量
            }

            // 计算起始位置 (确保整体居中)
            const totalWidth = prefixText.width + highlightWidth;
            prefixText.setX(-totalWidth / 2);

            // 实际渲染字符
            let currentX = prefixText.x + prefixText.width;
            for (let i = 0; i < highlight.length; i++) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(gradientColors[0]),
                    Phaser.Display.Color.ValueToColor(gradientColors[gradientColors.length - 1]),
                    highlight.length,
                    i
                );

                const charText = scene.add.text(
                    currentX,
                    0,
                    highlight[i],
                    {
                        ...style,
                        color: Phaser.Display.Color.RGBToString(color.r, color.g, color.b)
                    }
                );
                container.add(charText);
                currentX += charText.width;
            }

            // 移除发光效果
            container.list.forEach((child) => {
                if (child instanceof Phaser.GameObjects.Text) {
                    child.setShadow(0, 0, 'transparent', 0);
                }
            });

            return container;
        };

        // 使用方式
        const title = createGradientText(this, width / 2, height * 0.25, "Welcome to Mooncl", "80px");

        // 添加副标题
        const subtitle = this.add.text(width / 2, 420, "Aptos Board", {
            fontSize: "20px",
            color: "#999999",
            fontFamily: "Space Grotesk",
            fontStyle: "400",
            lineSpacing: 10,
            align: 'center'
        }).setOrigin(0.5);

        // 添加描述文字
        const description = this.add.text(width / 2, 466, "Connecting Aptos Ecosystem Partners Effortlessly", {
            fontSize: "20px",
            color: "#999999",
            fontFamily: "Space Grotesk",
            fontStyle: "400",
            lineSpacing: 10,
            wordWrap: { width: 498 },
            align: 'center'
        }).setOrigin(0.5);

        // 移除原来的DOM元素容器（不需要了）
        // this.connectButtonContainer.destroy(); // 如果之前创建过的话

        const buttonWidth = 285;
        const buttonHeight = 72;
        const buttonX = width / 2;
        const buttonY = height * 0.6;

        // 创建渐变按钮
        const button = this.add.graphics();

        // 创建渐变填充
        const canvas = document.createElement('canvas');
        canvas.width = buttonWidth;
        canvas.height = buttonHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas');
        }

        // 创建圆角渐变按钮
        const radius = 24; // 更新圆角半径
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(buttonWidth - radius, 0);
        ctx.quadraticCurveTo(buttonWidth, 0, buttonWidth, radius);
        ctx.lineTo(buttonWidth, buttonHeight - radius);
        ctx.quadraticCurveTo(buttonWidth, buttonHeight, buttonWidth - radius, buttonHeight);
        ctx.lineTo(radius, buttonHeight);
        ctx.quadraticCurveTo(0, buttonHeight, 0, buttonHeight - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();

        // 创建渐变
        const grd = ctx.createLinearGradient(0, 0, buttonWidth, 0);
        grd.addColorStop(0, '#FF39E0');    // 更新渐变色
        grd.addColorStop(0.5, '#AE4FFF');  // 更新渐变色
        grd.addColorStop(1, '#30B3D4');    // 更新渐变色
        ctx.fillStyle = grd;
        ctx.fill();

        // 创建渐变纹理
        const buttonTexture = this.textures.addCanvas('buttonTexture', canvas);
        const buttonSprite = this.add.sprite(
            buttonX,
            buttonY,
            'buttonTexture'
        ).setDisplaySize(buttonWidth, buttonHeight);

        // 设置按钮的交互
        buttonSprite
            .setInteractive()
            .on('pointerover', () => {
                this.tweens.add({
                    targets: [buttonSprite, this.loginText],
                    scaleX: 1.02,
                    scaleY: 1.02,
                    duration: 200,
                    ease: 'Sine.easeOut'
                });
            })
            .on('pointerout', () => {
                this.tweens.add({
                    targets: [buttonSprite, this.loginText],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Sine.easeOut'
                });
            })
            .on('pointerdown', () => this.handleLogin());

        // 更新按钮文字样式
        this.loginText = this.add.text(buttonX, buttonY, "Enter", {
            fontSize: "24px",
            color: "#FFFFFF",
            fontFamily: "Space Grotesk",
            fontStyle: "700"
        }).setOrigin(0.5).setDepth(1);

        // Listen for login response
        EventBus.on("phaser_loginResponse", (response: LoginResponse) => {
            if (response.success) {
                // Store user info in game registry
                this.registry.set("userData", response.data);
                // Delay 1 second before transition to let user see success message
                this.time.delayedCall(1000, () => {
                    this.scene.start("Preloader");
                });
            } else {
                console.error("failed:", response.error);
                // Display error message
                this.add
                    .text(
                        fullWidth / 2,
                        fullHeight * 0.7,
                        `failed: ${response.error}`,
                        {
                            fontSize: "16px",
                            color: "#ff0000",
                        }
                    )
                    .setOrigin(0.5);
            }
        });
    }

    handleLogin() {
        // Show loading status
        this.loginText.setText("logging...");

        // Trigger login request
        EventBus.emit("phaser_loginRequest", {});

        // Add loading animation
        this.tweens.add({
            targets: this.loginText,
            alpha: 0.5,
            duration: 500,
            ease: "Power2",
            yoyo: true,
            repeat: -1,
        });
    }
}
