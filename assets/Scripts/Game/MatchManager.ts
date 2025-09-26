import { _decorator, Component, Vec3, Node } from 'cc';
import { CellComponent, CellType } from '../Cell/CellComponent'; // Добавляем импорт
const { ccclass, property } = _decorator;

@ccclass('MatchManager')
export class MatchManager extends Component {
    
    private static instance: MatchManager = null!;
    private selectedCells: CellComponent[] = [];
    private isMatchInProgress: boolean = false;
    
    onLoad() {
        // Создаем синглтон
        if (MatchManager.instance === null) {
            MatchManager.instance = this;
        } else {
            this.destroy();
            return;
        }
        
        console.log('MatchManager loaded');
    }
    
    // Публичный метод для регистрации кликов от клеток
    public registerCellClick(cell: CellComponent) {
        console.log('MatchManager: Cell click registered', cell.cellX, cell.cellY, cell.cellType);
        
        if (this.isMatchInProgress) {
            console.log('Match in progress, ignoring click');
            return;
        }
        
        // Проверяем, не выбрана ли уже эта клетка
        if (cell.getIsSelected()) {
            console.log('Cell already selected');
            return;
        }
        
        this.processCellSelection(cell);
    }
    
    private processCellSelection(cell: CellComponent) {
        // Добавляем клетку в список выбранных
        cell.setSelected(true);
        this.selectedCells.push(cell);
        
        console.log(`Selected cell at (${cell.cellX}, ${cell.cellY}) type: ${cell.cellType}`);
        console.log(`Total selected: ${this.selectedCells.length}`);
        
        // Проверяем условия матчинга
        if (this.selectedCells.length === 3) {
            this.checkForMatch();
        }
    }
    
    private checkForMatch() {
        this.isMatchInProgress = true;
        
        // Проверяем, все ли три клетки одного типа
        const firstType = this.selectedCells[0].cellType;
        const allSameType = this.selectedCells.every(cell => cell.cellType === firstType);
        
        console.log('Checking match:', {
            types: this.selectedCells.map(c => c.cellType),
            allSame: allSameType
        });
        
        if (allSameType) {
            this.handleMatchSuccess();
        } else {
            this.handleMatchFail();
        }
    }
    
    private handleMatchSuccess() {
        console.log('MATCH SUCCESS! Type:', this.selectedCells[0].cellType);
        
        // Визуальные эффекты для успешного матча
        this.playSuccessAnimation();
        
        // Сбрасываем выбор после задержки
        this.scheduleOnce(() => {
            this.resetMatch();
        }, 1.0);
    }
    
    private handleMatchFail() {
        console.log('MATCH FAIL! Types:', this.selectedCells.map(cell => cell.cellType));
        
        // Визуальные эффекты для неудачного матча
        this.playFailAnimation();
        
        // Сбрасываем выбор после задержки
        this.scheduleOnce(() => {
            this.resetMatch();
        }, 1.0);
    }
    
    private playSuccessAnimation() {
        // Анимация успеха - мигание клеток
        this.selectedCells.forEach((cell, index) => {
            this.scheduleOnce(() => {
                cell.node.setScale(new Vec3(1.2, 1.2, 1.2));
                this.scheduleOnce(() => {
                    cell.node.setScale(new Vec3(1.0, 1.0, 1.0));
                }, 0.2);
            }, index * 0.1);
        });
    }
    
    private playFailAnimation() {
        // Анимация неудачи - тряска клеток
        this.selectedCells.forEach(cell => {
            const originalPos = cell.node.position.clone();
            const shakeOffset = 5;
            
            cell.node.setPosition(originalPos.x + shakeOffset, originalPos.y, originalPos.z);
            this.scheduleOnce(() => {
                cell.node.setPosition(originalPos.x - shakeOffset, originalPos.y, originalPos.z);
                this.scheduleOnce(() => {
                    cell.node.setPosition(originalPos.x, originalPos.y, originalPos.z);
                }, 0.1);
            }, 0.1);
        });
    }
    
    private resetMatch() {
        console.log('Resetting match');
        
        // Сбрасываем все выбранные клетки
        this.selectedCells.forEach(cell => {
            cell.setSelected(false);
        });
        
        this.selectedCells = [];
        this.isMatchInProgress = false;
    }
    
    public static getInstance(): MatchManager {
        return MatchManager.instance;
    }
    
    protected onDestroy() {
        if (MatchManager.instance === this) {
            MatchManager.instance = null!;
        }
    }
}