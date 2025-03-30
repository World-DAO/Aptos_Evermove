import Phaser from "phaser";
import Player from "../../heroes/player";
import Barman from "../../heroes/barman";
import { findPath } from "../../utils/findPath";
import { movementController } from "./moveController";
import { staticObstacles } from "@/game/objects/static";
import { EventBus } from "@/game/EventBus";

export class SceneManager {
    public player!: Player;
    public barman!: Barman;
    public cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    public gridSize!: number;
    public grid!: number[][];
    public UI: Phaser.GameObjects.Image[] = [];
    private sidebarButtons: Phaser.GameObjects.Container[] = [];

    private scene: Phaser.Scene;
    private obstrucleGroup?: Phaser.Physics.Arcade.StaticGroup;
    private background?: Phaser.GameObjects.Image;
    private tokenAmount?: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public initialize() {
        this.initializeGrid();
        this.createBackground();
        this.createCharacters();
        this.createObstacles();
        this.setupCamera();
        this.createUI();
        // 添加恢复游戏的事件监听
        EventBus.on("close-mail", () => {
            if (this.scene.scene.isPaused()) {
                this.scene.scene.resume();
            }
        });
    }

    // UI 相关方法
    private createUI() {
        this.createTopBar();
        this.createSidebar();
    }

    private createTopBar() {
        // 添加头像
        const userData = this.scene.registry.get("userData");
        console.log(userData);
        const avatar = this.scene.add
            .circle(40, 30, 20, 0x4eeaff, 0.8)
            .setScrollFactor(0)
            .setDepth(1001);

        // 添加地址文本
        const addressText = this.scene.add
            .text(
                70,
                20,
                `${String(userData.walletAddress).slice(0, 4)}...${String(
                    userData.walletAddress
                ).slice(-4)}`,
                {
                    fontFamily: "Arial",
                    fontSize: "16px",
                    color: "#4EEAFF",
                }
            )
            .setScrollFactor(0)
            .setDepth(1001);

        // 添加背景层
        const balanceBg = this.scene.add
            .rectangle(
                this.scene.cameras.main.width - 65, // 向左移动以适应更大的宽度
                28,
                120, // 增加背景宽度
                32, // 增加背景高度
                0x9d5bde
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setAlpha(0.2);

        const suiLogo = this.scene.add
            .image(this.scene.cameras.main.width - 105, 28, "sui_logo") // 调整位置
            .setDisplaySize(20, 24) // 增加logo尺寸
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // 添加代币数量
        this.tokenAmount = this.scene.add
            .text(
                this.scene.cameras.main.width - 25, // 调整位置
                18, // 微调垂直位置以保持居中
                `${Number(userData.suiBalance).toFixed(2)}`,
                {
                    fontFamily: "Arial",
                    fontSize: "20px", // 增加字体大小
                    color: "#4EEAFF",
                    align: "right",
                }
            )
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(1001);

        // 将元素添加到UI数组
        this.UI.push(
            avatar as any,
            addressText as any,
            balanceBg as any, // 添加背景到UI数组
            suiLogo as any,
            this.tokenAmount as any
        );
    }

    private createSidebar() {
        const menuItems = [
            { text: "CONTENT", y: 200, key: "button_content" },
            { text: "WRITE", y: 260, key: "button_write" },
            { text: "CHAT", y: 320, key: "button_chat" },
        ];

        menuItems.forEach((item) => {
            const button = this.scene.add
                .image(78, item.y, item.key)
                .setScrollFactor(0)
                .setDepth(1000)
                .setInteractive({ useHandCursor: true });

            button.on("pointerdown", () => {
                if (item.text === "CONTENT") {
                    EventBus.emit("open-content");
                } else if (item.text === "WRITE") {
                    EventBus.emit("open-write");
                } else if (item.text === "CHAT") {
                    EventBus.emit("open-chat");
                }
            });

            // Add hover effects
            button.on("pointerover", () => {
                this.scene.input.manager.canvas.style.cursor = "pointer";
                if (item.text !== "WRITE") {
                    // Don't affect selected button
                    button.setAlpha(0.8);
                }
            });

            button.on("pointerout", () => {
                this.scene.input.manager.canvas.style.cursor = "default";
                if (item.text !== "WRITE") {
                    button.setAlpha(1);
                }
            });
        });
    }

    // 原有的场景管理方法
    private initializeGrid() {
        this.gridSize = this.scene.registry.get("gridSize");
        this.grid = this.scene.registry.get("grid");
    }

    private createBackground() {
        const bgWidth = this.scene.data.get("bgWidth");
        const bgHeight = this.scene.data.get("bgHeight");

        this.background = this.scene.add
            .image(bgWidth / 2, bgHeight / 2, "tavern_bg")
            .setOrigin(0.5, 0.5)
            .setDisplaySize(bgWidth, bgHeight);
    }

    private createObstacles() {
        this.obstrucleGroup = this.scene.physics.add.staticGroup();
        for (const obstacle of staticObstacles) {
            const obstacleRect = this.scene.add.rectangle(
                obstacle.startx,
                obstacle.starty,
                obstacle.endx - obstacle.startx,
                obstacle.endy - obstacle.starty,
            );
            this.scene.physics.add.existing(obstacleRect, true);
            this.obstrucleGroup.add(obstacleRect);
        }
        this.scene.physics.add.collider(this.player.sprite, this.obstrucleGroup)
        //this.drawGrid();
    }

    private createCharacters() {
        const scaleFactor = this.scene.data.get("bgWidth") / 1600;
        // 创建玩家
        this.player = new Player(
            this.scene,
            20 * this.gridSize * scaleFactor,
            4 * this.gridSize * scaleFactor,
            "user"
        );
        this.player.sprite.setDisplaySize(
            this.gridSize * 1.6 * scaleFactor,
            this.gridSize * 3.8 * scaleFactor
        );

        this.cursors = this.scene.input.keyboard!.createCursorKeys();
        this.scene.physics.add.collider(
            this.player.sprite,
            this.obstrucleGroup!
        );

        // 创建酒保
        this.barman = new Barman(
            this.scene,
            7 * this.gridSize * scaleFactor,
            6 * this.gridSize * scaleFactor,
            "barwoman"
        );
        this.barman.sprite.setInteractive();
        this.barman.sprite.setDisplaySize(
            this.gridSize * 1.6 * scaleFactor,
            this.gridSize * 3 * scaleFactor
        );

        this.barman.sprite.on("pointerover", () => {
            this.scene.input.manager.canvas.style.cursor = "pointer";
        });

        this.barman.sprite.on("pointerout", () => {
            this.scene.input.manager.canvas.style.cursor = "default";
        });
    }

    private setupCamera() {
        const MAP_WIDTH = this.scene.data.get("bgWidth"); // 明确使用地图常量
        const MAP_HEIGHT = this.scene.data.get("bgHeight");

        const mainCamera = this.scene.cameras.main
            .setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
            .startFollow(this.player.sprite, true, 0.09, 0.09)
            .setZoom(1) // 明确禁用缩放
            .setBackgroundColor("#000000");
        // 动态调整视口
        const updateViewport = () => {
            mainCamera.setViewport(
                0,
                0,
                Math.min(window.innerWidth, MAP_WIDTH), // 视口不超过地图尺寸
                Math.min(window.innerHeight, MAP_HEIGHT)
            );
        };

        window.addEventListener("resize", updateViewport);
        updateViewport();
    }

    public handlePointerDown(
        pointer: Phaser.Input.Pointer,
        moveController?: movementController
    ) {
        const tx = Math.floor(pointer.worldX / this.gridSize);
        const ty = Math.floor(pointer.worldY / this.gridSize);

        if (
            tx < 0 ||
            tx >= this.grid[0].length ||
            ty < 0 ||
            ty >= this.grid.length
        ) {
            return;
        }
        if (this.grid[ty][tx] === 1) {
            return;
        }
        // if (this.grid[tx][ty] === 1) {
        //   return;
        // }
        // click on UI, stop moving
        if (
            this.UI.some((ui) => ui.getBounds().contains(pointer.x, pointer.y))
        ) {
            return;
        }
        const px = Math.floor(this.player.sprite.x / this.gridSize);
        const py = Math.floor(this.player.sprite.y / this.gridSize);

        const result = findPath(this.grid, px, py, tx, ty);
        if (result.length === 0) {
            return;
        }

        moveController?.stopMoving();
        moveController?.startPath(result);
    }
    private drawGrid() {
        // const bgWidth = 550;
        // const bgHeight = 1195;
        // 添加网格显示
        const graphics = this.scene.add.graphics();

        // 遍历每个格子
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[0].length; x++) {
                const isObstacle = this.grid[y][x] === 1;

                // 设置网格线的样式
                graphics.lineStyle(
                    1,
                    isObstacle ? 0xff0000 : 0xffffff,
                    isObstacle ? 0.5 : 0.3
                );

                // 计算格子的四个顶点
                const left = x * this.gridSize;
                const right = left + this.gridSize;
                const top = y * this.gridSize;
                const bottom = top + this.gridSize;

                // 绘制格子的四条边
                graphics.beginPath();
                graphics.moveTo(left, top);
                graphics.lineTo(right, top);
                graphics.lineTo(right, bottom);
                graphics.lineTo(left, bottom);
                graphics.lineTo(left, top);
                graphics.strokePath();

                // 如果是障碍物，添加文字标识
                if (isObstacle) {
                    this.scene.add
                        .text(
                            left + this.gridSize / 2,
                            top + this.gridSize / 2,
                            "障碍",
                            {
                                fontSize: "14px",
                                color: "#ff0000",
                                backgroundColor: "#00000080",
                            }
                        )
                        .setOrigin(0.5);
                }
            }
        }
    }

    // 添加更新余额的方法
    public async updateSuiBalance() {
        if (!this.tokenAmount) return;

        const userData = this.scene.registry.get("userData");
        const address = userData.walletAddress;
        const newBalance = 5;

        this.tokenAmount.setText(`${Number(newBalance).toFixed(2)}`);

        // 更新registry中的数据
        userData.suiBalance = Number(newBalance).toFixed(2);
        this.scene.registry.set("userData", userData);
    }

    public isContained(x: number, y: number) {
        return this.UI.some((ui) => ui.getBounds().contains(x, y));
    }
}
