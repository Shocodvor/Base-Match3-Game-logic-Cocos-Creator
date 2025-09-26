import { _decorator, Component, Vec3, view, Size, UITransform, instantiate, Prefab, Node, tween, Tween } from 'cc';
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
        
        const maxCellWidth = availableWidth / this.boardWidth;
        const maxCellHeight = availableHeight / this.boardHeight;
        
        this.cellSize = Math.min(maxCellWidth, maxCellHeight, 100);
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
                
                const cellComponent = cell.getComponent(CellComponent);
                if (cellComponent) {
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
        this.boardContainer.setPosition(Vec3.ZERO);
    }
    
    // Метод для удаления клеток и смещения остальных
   public removeMatchedCells(matchedCells: CellComponent[]): Promise<void> {
    return new Promise((resolve) => {
        // Удаляем совпавшие клетки с анимацией
        const removePromises: Promise<void>[] = [];
        
        matchedCells.forEach(cell => {
            const x = cell.cellX;
            const y = cell.cellY;
            
            if (this.cells[y] && this.cells[y][x]) {
                const removePromise = new Promise<void>((removeResolve) => {
                    tween(cell.node)
                        .to(0.2, { scale: new Vec3(0, 0, 0) })
                        .call(() => {
                            cell.node.destroy();
                            this.cells[y][x] = null!;
                            removeResolve();
                        })
                        .start();
                });
                
                removePromises.push(removePromise);
            }
        });

        // После удаления всех клеток запускаем смещение
        Promise.all(removePromises).then(() => {
            this.shiftCellsDown().then(() => {
                this.createNewCells().then(() => {
                    resolve();
                });
            });
        });
    });
}

private shiftCellsDown(): Promise<void> {
    return new Promise((resolve) => {
        const shiftPromises: Promise<void>[] = [];

        // Обрабатываем каждый столбец отдельно
        for (let x = 0; x < this.boardWidth; x++) {
            // Собираем все НЕпустые клетки в столбце
            const existingCells: Node[] = [];
            for (let y = this.boardHeight - 1; y >= 0; y--) {
                if (this.cells[y][x] !== null) {
                    existingCells.push(this.cells[y][x]);
                }
            }
            
            // Очищаем столбец
            for (let y = 0; y < this.boardHeight; y++) {
                this.cells[y][x] = null!;
            }
            
            // Заполняем столбец снизу существующими клетками
            for (let i = 0; i < existingCells.length; i++) {
                const targetY = this.boardHeight - 1 - i;
                const cell = existingCells[i];
                const cellComponent = cell.getComponent(CellComponent);
                
                if (cellComponent) {
                    // Обновляем координаты
                    cellComponent.cellY = targetY;
                    
                    // Обновляем массив клеток
                    this.cells[targetY][x] = cell;
                    
                    // Анимация перемещения
                    const newPos = this.getCellPosition(x, targetY);
                    const shiftPromise = new Promise<void>((moveResolve) => {
                        tween(cell)
                            .to(0.3, { position: newPos })
                            .call(() => moveResolve())
                            .start();
                    });
                    
                    shiftPromises.push(shiftPromise);
                }
            }
        }

        if (shiftPromises.length === 0) {
            resolve();
        } else {
            Promise.all(shiftPromises).then(() => resolve());
        }
    });
}

// Создание новых клеток наверху
private createNewCells(): Promise<void> {
    return new Promise((resolve) => {
        const createPromises: Promise<void>[] = [];

        for (let x = 0; x < this.boardWidth; x++) {
            // Считаем пустые клетки в столбце
            let emptyCount = 0;
            for (let y = 0; y < this.boardHeight; y++) {
                if (this.cells[y][x] === null) {
                    emptyCount++;
                }
            }
            
            // Создаем новые клетки для заполнения пустот сверху
            for (let i = 0; i < emptyCount; i++) {
                const targetY = emptyCount - 1 - i; // Заполняем сверху вниз
                
                const cell = instantiate(this.cellPrefab);
                cell.parent = this.boardContainer;
                
                // Начальная позиция - над доской
                const startY = -1 - i;
                const startPos = this.getCellPosition(x, startY);
                cell.setPosition(startPos);
                cell.setScale(new Vec3(1, 1, 1));
                
                const transform = cell.getComponent(UITransform);
                if (transform) {
                    transform.setContentSize(this.cellSize, this.cellSize);
                }
                
                const cellComponent = cell.getComponent(CellComponent);
                if (cellComponent) {
                    const randomType = Math.floor(Math.random() * 10);
                    cellComponent.initialize(x, targetY, randomType);
                    
                    this.cells[targetY][x] = cell;
                    
                    // Анимация падения
                    const targetPos = this.getCellPosition(x, targetY);
                    const createPromise = new Promise<void>((fallResolve) => {
                        tween(cell)
                            .to(0.4, { position: targetPos })
                            .call(() => fallResolve())
                            .start();
                    });
                    
                    createPromises.push(createPromise);
                }
            }
        }

        if (createPromises.length === 0) {
            resolve();
        } else {
            Promise.all(createPromises).then(() => resolve());
        }
    });
}

    // Вспомогательный метод для получения позиции клетки
    private getCellPosition(x: number, y: number): Vec3 {
        const posX = (x - (this.boardWidth - 1) / 2) * this.cellSize;
        const posY = ((this.boardHeight - 1) / 2 - y) * this.cellSize;
        return new Vec3(posX, posY, 0);
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
    
    public rebuildBoard() {
        this.initializeBoard(this.boardWidth, this.boardHeight, this.padding);
    }
}