import { _decorator, Component, Vec3, Node, tween, Color } from 'cc';
import { CellComponent, CellType } from '../Cell/CellComponent';
const { ccclass, property } = _decorator;

@ccclass('MatchManager')
export class MatchManager extends Component {
    
    private static instance: MatchManager = null!;
    private selectedCells: CellComponent[] = [];
    private isMatchInProgress: boolean = false;
    
    onLoad() {
        if (MatchManager.instance === null) {
            MatchManager.instance = this;
        } else {
            this.destroy();
            return;
        }
        
        console.log('MatchManager loaded');
    }
    
    public registerCellClick(cell: CellComponent) {
        console.log('MatchManager: Cell click registered', cell.cellX, cell.cellY, cell.cellType);
        
        if (this.isMatchInProgress) {
            console.log('Match in progress, ignoring click');
            return;
        }
        
        if (cell.getIsSelected()) {
            console.log('Cell already selected, deselecting');
            this.deselectCell(cell);
            return;
        }
        
        if (this.selectedCells.length >= 3) {
            console.log('Already selected 3 cells, cannot select more');
            return;
        }
        
        this.processCellSelection(cell);
    }
    
    private processCellSelection(cell: CellComponent) {
        cell.showSelection(Color.YELLOW);
        this.selectedCells.push(cell);
        
        console.log(`Selected cell at (${cell.cellX}, ${cell.cellY}) type: ${cell.cellType}`);
        console.log(`Total selected: ${this.selectedCells.length}`);
        
        if (this.selectedCells.length === 3) {
            this.checkForMatch();
        }
    }
    
    private deselectCell(cell: CellComponent) {
        const index = this.selectedCells.indexOf(cell);
        if (index > -1) {
            this.selectedCells.splice(index, 1);
            cell.hideSelection();
        }
    }
    
    private checkForMatch() {
        this.isMatchInProgress = true;
        
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
        
        const matchedCells = [...this.selectedCells];
        
        // Анимация успеха с использованием tween
        this.playSuccessAnimation().then(() => {
            const gameManager = this.findGameManager();
            if (gameManager && gameManager.getBoardController()) {
                gameManager.getBoardController().removeMatchedCells(matchedCells).then(() => {
                    console.log('Cells shifted and new cells created');
                    this.resetMatch();
                });
            } else {
                console.error('GameManager or BoardController not found!');
                this.resetMatch();
            }
        });
    }
    
    private handleMatchFail() {
        console.log('MATCH FAIL! Types:', this.selectedCells.map(cell => cell.cellType));
        
        this.selectedCells.forEach(cell => {
            cell.setSelectionColor(Color.RED);
        });
        
        this.playFailAnimation().then(() => {
            this.resetMatch();
        });
    }
    
    private playSuccessAnimation(): Promise<void> {
        return new Promise((resolve) => {
            const animations: Promise<void>[] = [];
            
            this.selectedCells.forEach((cell, index) => {
                const animationPromise = new Promise<void>((animResolve) => {
                    // Используем tween для задержки вместо setTimeout
                    tween(this.node)
                        .delay(index * 0.1)
                        .call(() => {
                            cell.playSuccessAnimation().then(() => animResolve());
                        })
                        .start();
                });
                animations.push(animationPromise);
            });
            
            Promise.all(animations).then(() => resolve());
        });
    }
    
    private playFailAnimation(): Promise<void> {
        return new Promise((resolve) => {
            const animations: Promise<void>[] = [];
            
            this.selectedCells.forEach(cell => {
                animations.push(cell.playErrorAnimation());
            });
            
            Promise.all(animations).then(() => resolve());
        });
    }
    
    public resetMatch() {
        console.log('Resetting match');
        
        this.selectedCells.forEach(cell => {
            cell.hideSelection();
        });
        
        this.selectedCells = [];
        this.isMatchInProgress = false;
    }
    
    private findGameManager(): any {
        const gameManagerNode = this.node.scene.getChildByName('GameManager');
        if (gameManagerNode) {
            return gameManagerNode.getComponent('GameManager');
        }
        return null;
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