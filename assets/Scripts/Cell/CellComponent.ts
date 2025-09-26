import { _decorator, Component, Sprite, Color, Button, EventHandler, Node, tween, Vec3 } from 'cc';
import { MatchManager } from '../Game/MatchManager';
const { ccclass, property } = _decorator;

export enum CellType {
    RED_STAR = 0,
    BLUE_DIAMOND = 1,
    GREEN_HEART = 2,
    YELLOW_CIRCLE = 3,
    PURPLE_TRIANGLE = 4,
    ORANGE_SQUARE = 5,
    PINK_HEXAGON = 6,
    CYAN_PENTAGON = 7,
    BROWN_CLOVER = 8,
    GRAY_SPIRAL = 9
}

@ccclass('CellComponent')
export class CellComponent extends Component {
    @property
    public cellX: number = 0;
    
    @property
    public cellY: number = 0;
    
    @property({ type: Number })
    public cellType: CellType = CellType.RED_STAR;
    
    @property(Sprite)
    private cellSprite: Sprite = null!;
    
    @property(Button)
    private cellButton: Button = null!;
    
    @property(Sprite)
    private selectionFrame: Sprite = null!;
    
    @property(Node)
    private selectionEffect: Node = null!;
    
    private readonly cellColors: Color[] = [
        new Color(255, 0, 0, 255),
        new Color(0, 100, 255, 255),
        new Color(0, 200, 0, 255),
        new Color(255, 255, 0, 255),
        new Color(160, 32, 240, 255),
        new Color(255, 165, 0, 255),
        new Color(255, 192, 203, 255),
        new Color(0, 255, 255, 255),
        new Color(165, 42, 42, 255),
        new Color(128, 128, 128, 255)
    ];
    
    private isSelected: boolean = false;
    private selectionColor: Color = Color.YELLOW;
    
    onLoad() {
        this.initializeButton();
        this.hideSelection();
        console.log(`Cell loaded at (${this.cellX}, ${this.cellY})`);
    }
    
    public initialize(x: number, y: number, type: CellType) {
        this.cellX = x;
        this.cellY = y;
        this.cellType = type;
        this.updateVisual();
    }
    
    private initializeButton() {
        if (this.cellButton) {
            this.cellButton.clickEvents = [];
            const clickHandler = new EventHandler();
            clickHandler.target = this.node;
            clickHandler.component = 'CellComponent';
            clickHandler.handler = 'onCellClicked';
            this.cellButton.clickEvents.push(clickHandler);
        }
    }
    
    private updateVisual() {
        if (this.cellSprite) {
            if (this.cellType >= 0 && this.cellType < this.cellColors.length) {
                this.cellSprite.color = this.cellColors[this.cellType];
            }
        }
    }
    
    public onCellClicked() {
        console.log('Cell clicked:', this.cellX, this.cellY, this.cellType);
        
        const matchManager = MatchManager.getInstance();
        if (matchManager) {
            matchManager.registerCellClick(this);
        } else {
            console.error('MatchManager not found!');
        }
    }
    
    // Показываем выделение с определенным цветом
    public showSelection(color: Color = Color.YELLOW) {
        this.isSelected = true;
        this.selectionColor = color;
        
        if (this.selectionFrame) {
            this.selectionFrame.color = color;
            this.selectionFrame.node.active = true;
        }
        
        if (this.selectionEffect) {
            this.selectionEffect.active = true;
        }
        
        // Анимация выделения с использованием tween
        tween(this.node)
            .to(0.1, { scale: new Vec3(1.1, 1.1, 1.1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }
    
    // Скрываем выделение
    public hideSelection() {
        this.isSelected = false;
        
        if (this.selectionFrame) {
            this.selectionFrame.node.active = false;
        }
        
        if (this.selectionEffect) {
            this.selectionEffect.active = false;
        }
        
        // Возвращаем нормальный масштаб
        this.node.setScale(1, 1, 1);
    }
    
    // Меняем цвет выделения (для ошибки)
    public setSelectionColor(color: Color) {
        this.selectionColor = color;
        if (this.isSelected && this.selectionFrame) {
            this.selectionFrame.color = color;
        }
    }
    
    // Анимация ошибки (красное мигание) с использованием tween
    public playErrorAnimation(): Promise<void> {
        return new Promise((resolve) => {
            this.setSelectionColor(Color.RED);
            
            tween(this.node)
                .to(0.1, { scale: new Vec3(1.15, 1.15, 1.15) })
                .to(0.1, { scale: new Vec3(0.95, 0.95, 0.95) })
                .to(0.1, { scale: new Vec3(1.05, 1.05, 1.05) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    this.hideSelection();
                    resolve();
                })
                .start();
        });
    }
    
    // Анимация успешного выделения с использованием tween
    public playSuccessAnimation(): Promise<void> {

         const matchManager = MatchManager.getInstance();
        if (matchManager) {
            matchManager.resetMatch();
        } else {
            console.error('MatchManager not found!');
        }



        return new Promise((resolve) => {
            tween(this.node)
                .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => resolve())
                .start();
        });

    }
    
    public setSelected(selected: boolean) {
        this.isSelected = selected;
        if (selected) {
            this.showSelection();
        } else {
            this.hideSelection();
        }
    }
    
    public getIsSelected(): boolean {
        return this.isSelected;
    }
    
    public setType(type: CellType) {
        this.cellType = type;
        this.updateVisual();
    }
}