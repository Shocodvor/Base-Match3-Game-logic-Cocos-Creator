import { _decorator, Component, Sprite, Color, Button, EventHandler } from 'cc';
// Импортируем MatchManager
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
    
    onLoad() {
        this.initializeButton();
        console.log(`Cell loaded at (${this.cellX}, ${this.cellY})`);
    }
    
   public initialize(x: number, y: number, type: CellType) {
    this.cellX = x;
    this.cellY = y;
    this.cellType = type;
    this.updateVisual(); // Этот метод должен обновлять внешний вид
}
    
    private initializeButton() {
        if (this.cellButton) {
            console.log('Initializing button for cell', this.cellX, this.cellY);
            
            // Создаем новый обработчик событий
            this.cellButton.clickEvents = [];
            const clickHandler = new EventHandler();
            clickHandler.target = this.node;
            clickHandler.component = 'CellComponent';
            clickHandler.handler = 'onCellClicked';
            this.cellButton.clickEvents.push(clickHandler);
        } else {
            console.error('Cell button is null!', this.cellX, this.cellY);
        }
    }
    
    private updateVisual() {
        if (this.cellSprite) {
            // Устанавливаем цвет в зависимости от типа
            if (this.cellType >= 0 && this.cellType < this.cellColors.length) {
                this.cellSprite.color = this.cellColors[this.cellType];
            }
            
            // Если клетка выбрана, добавляем эффект выделения
            if (this.isSelected) {
                this.cellSprite.color = this.cellSprite.color.multiply(new Color(1.5, 1.5, 1.5, 1));
            }
        }
    }
    
    public onCellClicked() {
        console.log('Cell clicked:', this.cellX, this.cellY, this.cellType);
        
        // Прямой вызов MatchManager через синглтон
        const matchManager = MatchManager.getInstance();
        if (matchManager) {
            matchManager.registerCellClick(this);
        } else {
            console.error('MatchManager not found!');
            
            // Альтернативная попытка найти MatchManager на сцене
            const matchManagerNode = this.node.scene.getChildByName('MatchManager');
            if (matchManagerNode) {
                const manager = matchManagerNode.getComponent(MatchManager) as MatchManager;
                if (manager) {
                    console.log('Found MatchManager through scene search');
                    manager.registerCellClick(this);
                }
            }
        }
    }
    
    public setSelected(selected: boolean) {
        this.isSelected = selected;
        this.updateVisual();
    }
    
    public getIsSelected(): boolean {
        return this.isSelected;
    }
    
    public setType(type: CellType) {
        this.cellType = type;
        this.updateVisual();
    }
}