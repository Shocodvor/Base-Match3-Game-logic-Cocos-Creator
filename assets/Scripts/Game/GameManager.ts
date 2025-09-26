import { _decorator, Component, view, screen } from 'cc';
import { BoardGameController } from './BoardGameController';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    
    @property(BoardGameController)
    private boardController: BoardGameController = null!;
    
    @property
    private baseWidth: number = 8;
    
    @property
    private baseHeight: number = 10;
    
    @property
    private padding: number = 50;
    
    private currentOrientation: string = '';
    
    onLoad() {
        this.initGame();
        this.setupOrientationHandler();
    }
    
    private initGame() {
        this.currentOrientation = this.detectOrientation();
        this.createGameBoard();
    }
    
    private setupOrientationHandler() {
        // Слушаем изменение размера экрана
        view.on('canvas-resize', this.onScreenResize, this);
    }
    
    private onScreenResize() {
        this.scheduleOnce(() => {
            this.handleOrientationChange();
        }, 0.1);
    }
    
    private detectOrientation(): string {
        const canvasSize = view.getCanvasSize();
        return canvasSize.width >= canvasSize.height ? 'landscape' : 'portrait';
    }
    
    private handleOrientationChange() {
        const newOrientation = this.detectOrientation();
        
        if (newOrientation !== this.currentOrientation) {
            console.log(`Orientation changed from ${this.currentOrientation} to ${newOrientation}`);
            this.currentOrientation = newOrientation;
            this.createGameBoard();
        }
    }
    
    private createGameBoard() {
        if (!this.boardController) {
            console.error('BoardController is not assigned!');
            return;
        }
        
        let boardWidth, boardHeight;
        
        if (this.currentOrientation === 'portrait') {
            boardWidth = this.baseWidth;
            boardHeight = this.baseHeight;
        } else {
            boardWidth = this.baseHeight;
            boardHeight = this.baseWidth;
        }
        
        console.log(`Creating board: ${boardWidth}x${boardHeight} (${this.currentOrientation})`);
        this.boardController.initializeBoard(boardWidth, boardHeight, this.padding);
    }
    
    public getBoardController(): BoardGameController {
        return this.boardController;
    }
    
    public getCurrentOrientation(): string {
        return this.currentOrientation;
    }
    
    protected onDestroy() {
        view.off('canvas-resize', this.onScreenResize, this);
    }

    
}