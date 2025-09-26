import { _decorator, Component, Node, Vec3, view, Size, UITransform, instantiate,Prefab } from 'cc';
import { CellComponent } from '../Cell/CellComponent';
const { ccclass, property } = _decorator;

@ccclass('BoardGameController')
export class BoardGameController extends Component {
    
    @property(Node)
    private boardContainer: Node = null!;
    
   @property(Prefab)
    private cellPrefab: Prefab = null!;
    
    private boardWidth: number = 0;
    private boardHeight: number = 0;
    private padding: number = 0;
    private cellSize: number = 80;
    private cells: Node[][] = [];
    
    public initializeBoard(width: number, height: number, padding: number = 50) {
        this.boardWidth = width;
        this.boardHeight = height;
        this.padding = padding;
        
        this.clearBoard();
        this.calculateCellSize();
        this.createBoardGrid();
        this.positionBoard();
    }
    
    private clearBoard() {
        if (this.boardContainer) {
            this.boardContainer.removeAllChildren();
        }
        this.cells = [];
    }
    
    private calculateCellSize() {
        const canvasSize = view.getCanvasSize();
        const availableWidth = canvasSize.width - (this.padding * 2);
        const availableHeight = canvasSize.height - (this.padding * 2);
        
        // Вычисляем размер клетки на основе доступного пространства
        const maxCellWidth = availableWidth / this.boardWidth;
        const maxCellHeight = availableHeight / this.boardHeight;
        
        // Берем минимальное значение чтобы клетки поместились по обоим измерениям
        this.cellSize = Math.min(maxCellWidth, maxCellHeight, 100); // 100 - максимальный размер клетки
    }
    
    private createBoardGrid() {
    if (!this.boardContainer || !this.cellPrefab) return;
    
    this.cells = [];
    
    for (let y = 0; y < this.boardHeight; y++) {
        const row: Node[] = [];
        for (let x = 0; x < this.boardWidth; x++) {
            const cell = instantiate(this.cellPrefab);
            cell.parent = this.boardContainer;
            
            const posX = (x - (this.boardWidth - 1) / 2) * this.cellSize;
            const posY = ((this.boardHeight - 1) / 2 - y) * this.cellSize;
            cell.setPosition(posX, posY, 0);
            
            const transform = cell.getComponent(UITransform);
            if (transform) {
                transform.setContentSize(this.cellSize, this.cellSize);
            }
            
            // ВАЖНО: Инициализируем клетку со случайным типом
            const cellComponent = cell.getComponent(CellComponent);
            if (cellComponent) {
                // Генерируем случайный тип от 0 до 9
                const randomType = Math.floor(Math.random() * 10);
                cellComponent.initialize(x, y, randomType);
            }
            
            row.push(cell);
        }
        this.cells.push(row);
    }
}
    
    private positionBoard() {
        if (!this.boardContainer) return;
        
        // Центрируем доску на экране
        this.boardContainer.setPosition(Vec3.ZERO);
    }
    
    // Публичные методы для работы с полем
    public getCellAt(x: number, y: number): Node | null {
        if (x >= 0 && x < this.boardWidth && y >= 0 && y < this.boardHeight) {
            return this.cells[y][x];
        }
        return null;
    }
    
    public getBoardSize(): Size {
        return new Size(this.boardWidth, this.boardHeight);
    }
    
    public getCellSize(): number {
        return this.cellSize;
    }
    
    public getBoardDimensions(): { width: number; height: number } {
        return { width: this.boardWidth, height: this.boardHeight };
    }
    
    // Метод для пересоздания поля (при смене ориентации)
    public rebuildBoard() {
        this.initializeBoard(this.boardWidth, this.boardHeight, this.padding);
    }
}