import { _decorator, Component, Vec3, Node, tween } from 'cc';
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
            console.log('Cell already selected');
            return;
        }
        
        this.processCellSelection(cell);
    }
    
    private processCellSelection(cell: CellComponent) {
        cell.setSelected(true);
        this.selectedCells.push(cell);
        
        console.log(`Selected cell at (${cell.cellX}, ${cell.cellY}) type: ${cell.cellType}`);
        console.log(`Total selected: ${this.selectedCells.length}`);
        
        if (this.selectedCells.length === 3) {
            this.checkForMatch();
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
        
        this.playFailAnimation().then(() => {
            this.resetMatch();
        });
    }
    
    private playSuccessAnimation(): Promise<void> {
        return new Promise((resolve) => {
            const animations: Promise<void>[] = [];
            
            this.selectedCells.forEach((cell, index) => {
                const animationPromise = new Promise<void>((animResolve) => {
                    tween(cell.node)
                        .delay(index * 0.1)
                        .to(0.1, { scale: new Vec3(1.2, 1.2, 1.2) })
                        .to(0.1, { scale: new Vec3(1.0, 1.0, 1.0) })
                        .call(() => animResolve())
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
                const originalPos = cell.node.position.clone();
                const animationPromise = new Promise<void>((animResolve) => {
                    tween(cell.node)
                        .to(0.1, { position: new Vec3(originalPos.x + 5, originalPos.y, originalPos.z) })
                        .to(0.1, { position: new Vec3(originalPos.x - 5, originalPos.y, originalPos.z) })
                        .to(0.1, { position: originalPos })
                        .call(() => animResolve())
                        .start();
                });
                animations.push(animationPromise);
            });
            
            Promise.all(animations).then(() => resolve());
        });
    }
    
    private resetMatch() {
        console.log('Resetting match');
        
        this.selectedCells.forEach(cell => {
            cell.setSelected(false);
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