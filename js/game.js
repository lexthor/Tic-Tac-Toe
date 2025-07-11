import { WINNING_COMBINATIONS } from './constants.js';
import { UI } from './ui.js';
import { AI } from './ai.js';

export class Game {
    constructor() {
        this.ui = new UI();
        this.ai = new AI();
        this.resetGame();
        this.addEventListeners();
    }

    resetGame() {
        this.gameBoard = Array(9).fill(null);
        this.currentPlayer = 'cross';
        this.gameActive = true;
        this.gameMode = 'human';
        this.scores = { cross: 0, circle: 0, draw: 0 };
        this.ui.updateScoreDisplay(this.scores);
        this.ui.resetBoard();
        this.ui.recreateAllPieces();
        this.addDragAndDropListeners();
        this.ui.setPlayerTurn(this.currentPlayer, this.gameMode);
        this.ui.updateTurnIndicator(this.currentPlayer);
        this.ui.updateGameStatus('Drag & Drop to Play!');
        this.ui.hideGameOverModal();
        this.ui.showGameStartModal();
    }

    addEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetRound());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
        document.querySelector('.new-game[onclick="startNewRound()"]').addEventListener('click', () => this.resetRound());

        document.getElementById('humanVsHumanBtn').addEventListener('click', () => this.setGameMode('human'));
        document.getElementById('humanVsAiBtn').addEventListener('click', () => this.setGameMode('ai'));

        document.getElementById('easyBtn').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('mediumBtn').addEventListener('click', () => this.setDifficulty('medium'));
        document.getElementById('hardBtn').addEventListener('click', () => this.setDifficulty('hard'));

        document.getElementById('gameStartModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                this.ui.hideGameStartModal();
            }
        });
    }

    addDragAndDropListeners() {
        const pieces = document.querySelectorAll('.dragBox div');
        pieces.forEach(item => {
            item.addEventListener('dragstart', this.dragStart.bind(this));
            item.addEventListener('dragend', this.dragEnd.bind(this));
        });

        const dropBoxes = document.querySelectorAll('.dropBox');
        dropBoxes.forEach(item => {
            item.addEventListener('dragover', this.dragOver.bind(this));
            item.addEventListener('dragleave', this.dragLeave.bind(this));
            item.addEventListener('drop', this.drop.bind(this));
        });
    }

    dragStart(event) {
        event.dataTransfer.setData("text", event.target.id);
        event.target.parentElement.classList.add('dragging');
    }

    dragEnd(event) {
        event.target.parentElement.classList.remove('dragging');
    }

    dragOver(event) {
        event.preventDefault();
        if (!event.target.classList.contains('dropBox') || event.target.querySelector('div')) {
            return;
        }
        event.target.classList.add('drag-over');
    }

    dragLeave(event) {
        event.target.classList.remove('drag-over');
    }

    drop(event) {
        event.preventDefault();
        event.target.classList.remove('drag-over');

        if (!this.gameActive) return;

        const data = event.dataTransfer.getData("text");
        const draggedElement = document.getElementById(data);
        const pieceType = draggedElement.classList.contains('cross') ? 'cross' : 'circle';

        if (pieceType !== this.currentPlayer) {
            this.ui.updateGameStatus("❌ Wait for your turn!");
            return;
        }

        if (this.gameMode === 'ai' && this.currentPlayer === 'circle') {
            this.ui.updateGameStatus("🤖 AI is thinking...");
            return;
        }

        if (!event.target.classList.contains('dropBox') || event.target.querySelector('div')) {
            return;
        }

        this.makeMove(event.target, pieceType);
    }

    makeMove(targetCell, pieceType) {
        const cellIndex = parseInt(targetCell.dataset.cell);
        if (this.gameBoard[cellIndex] !== null) return;

        this.gameBoard[cellIndex] = pieceType;
        this.ui.placePiece(targetCell, pieceType);

        if (this.checkWinner()) {
            this.endGame(`🎉 ${pieceType === 'cross' ? 'Player1' : 'Player2'} wins!`);
            this.scores[pieceType]++;
            this.ui.updateScoreDisplay(this.scores);
            this.ui.highlightWinningCells(this.gameBoard, WINNING_COMBINATIONS);
        } else if (this.gameBoard.every(cell => cell !== null)) {
            this.endGame("🤝 It's a draw!");
            this.scores.draw++;
            this.ui.updateScoreDisplay(this.scores);
        } else {
            this.currentPlayer = this.currentPlayer === 'cross' ? 'circle' : 'cross';
            this.ui.updateTurnIndicator(this.currentPlayer);
            this.ui.setPlayerTurn(this.currentPlayer, this.gameMode);
            this.ui.updateGameStatus(`${this.currentPlayer === 'cross' ? 'Player1' : 'Player2'} turn`);

            if (this.gameMode === 'ai' && this.currentPlayer === 'circle') {
                this.makeAIMove();
            }
        }
    }

    checkWinner() {
        return WINNING_COMBINATIONS.some(combination => {
            const [a, b, c] = combination;
            return this.gameBoard[a] && this.gameBoard[a] === this.gameBoard[b] && this.gameBoard[a] === this.gameBoard[c];
        });
    }

    endGame(message) {
        this.gameActive = false;
        this.ui.updateGameStatus(message);
        setTimeout(() => this.ui.showGameOverModal(message), 1500);
    }

    resetRound() {
        this.gameBoard = Array(9).fill(null);
        this.gameActive = true;
        this.currentPlayer = 'cross';
        this.ui.resetBoard();
        this.ui.recreateAllPieces();
        this.addDragAndDropListeners();
        this.ui.setPlayerTurn(this.currentPlayer, this.gameMode);
        this.ui.updateTurnIndicator(this.currentPlayer);
        this.ui.updateGameStatus('Drag & Drop to Play!');
        this.ui.hideGameOverModal();
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.ui.toggleDifficultySelector(mode === 'ai');
        this.ui.setActiveButton('mode', mode === 'human' ? 'humanVsHumanBtn' : 'humanVsAiBtn');
        this.resetRound();
    }

    setDifficulty(difficulty) {
        this.ai.setDifficulty(difficulty);
        this.ui.setActiveButton('difficulty', difficulty + 'Btn');
    }

    makeAIMove() {
        this.ui.setAITurn(true);
        setTimeout(() => {
            const bestMove = this.ai.getMove(this.gameBoard);
            this.ui.setAITurn(false);
            if (bestMove !== -1) {
                const targetCell = document.querySelectorAll('.dropBox')[bestMove];
                this.makeMove(targetCell, 'circle');
            }
        }, 1000);
    }
}