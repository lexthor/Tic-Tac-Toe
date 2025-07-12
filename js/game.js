import { WINNING_COMBINATIONS } from './constants.js';
import { UI } from './ui.js';
import { AI } from './ai.js';

export class Game {
    constructor(socket) {
        this.socket = socket;
        this.ui = new UI();
        this.ai = new AI();
        this.roomId = null;
        this.playerSymbol = null;
        this.resetGame();
        this.addEventListeners();
        this.addSocketListeners();
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
        this.ui.showMainMenu();
    }

    addEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetRound());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
        document.querySelector('#gameOverModal .new-game').addEventListener('click', () => this.resetRound());

        document.getElementById('onlineBtn').addEventListener('click', () => this.setGameMode('online'));
        document.getElementById('humanVsAiBtn').addEventListener('click', () => this.setGameMode('ai'));

        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('backBtn').addEventListener('click', () => this.ui.showMainMenu());

        document.getElementById('easyBtn').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('mediumBtn').addEventListener('click', () => this.setDifficulty('medium'));
        document.getElementById('hardBtn').addEventListener('click', () => this.setDifficulty('hard'));

    }

    addSocketListeners() {
        this.socket.on('roomCreated', (roomId) => this.handleRoomCreated(roomId));
        this.socket.on('startGame', (room) => this.handleStartGame(room));
        this.socket.on('moveMade', (room) => this.handleMoveMade(room));
        this.socket.on('playerLeft', () => this.handlePlayerLeft());
        this.socket.on('error', (message) => this.ui.updateGameStatus(message));
    }

    createRoom() {
        this.socket.emit('createRoom');
    }

    joinRoom(roomId = null) {
        const id = roomId || this.ui.getRoomIdInput();
        if (id) {
            this.socket.emit('joinRoom', id);
        }
    }

    handleRoomCreated(roomId) {
        this.roomId = roomId;
        this.playerSymbol = 'cross';
        this.ui.showRoomId(roomId);
        this.ui.updateGameStatus('Waiting for another player to join...');
    }

    handleStartGame(room) {
        this.ui.hideGameStartModal();
        this.gameBoard = room.board;
        this.currentPlayer = room.currentPlayer;
        if (!this.playerSymbol) {
            this.playerSymbol = 'circle';
        }
        this.ui.updateBoard(this.gameBoard);
        this.ui.updateTurnIndicator(this.currentPlayer);
        this.ui.updateGameStatus(`${this.currentPlayer === this.playerSymbol ? 'Your' : "Opponent's"} turn`);
    }

    handleMoveMade(room) {
        this.gameBoard = room.board;
        this.currentPlayer = room.currentPlayer;
        this.ui.updateBoard(this.gameBoard);
        const winningCombination = this.checkWinner();
        if (winningCombination) {
            this.endGame(`🎉 ${this.gameBoard[winningCombination[0]] === this.playerSymbol ? 'You' : 'Opponent'} win!`);
            this.ui.highlightWinningCells(this.gameBoard, [winningCombination]);
        } else if (this.gameBoard.every(cell => cell !== null)) {
            this.endGame("🤝 It's a draw!");
        } else {
            this.ui.updateTurnIndicator(this.currentPlayer);
            this.ui.updateGameStatus(`${this.currentPlayer === this.playerSymbol ? 'Your' : "Opponent's"} turn`);
        }
    }

    handlePlayerLeft() {
        this.ui.updateGameStatus('Your opponent has left the game.');
        this.gameActive = false;
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

        if (this.gameMode === 'online') {
            if (pieceType !== this.playerSymbol || this.currentPlayer !== this.playerSymbol) {
                this.ui.updateGameStatus("❌ Wait for your turn!");
                return;
            }
        } else {
            if (pieceType !== this.currentPlayer) {
                this.ui.updateGameStatus("❌ Wait for your turn!");
                return;
            }
        }

        if (this.gameMode === 'ai' && this.currentPlayer === 'circle') {
            this.ui.updateGameStatus("🤖 AI is thinking...");
            return;
        }

        if (!event.target.classList.contains('dropBox') || event.target.querySelector('div')) {
            return;
        }

        const cellIndex = parseInt(event.target.dataset.cell);
        if (this.gameBoard[cellIndex] !== null) return;

        if (this.gameMode === 'online') {
            this.socket.emit('makeMove', { roomId: this.roomId, cellIndex, pieceType });
        } else {
            this.makeMove(event.target, pieceType);
        }
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
        return WINNING_COMBINATIONS.find(combination => {
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
        if (this.gameMode === 'online') {
            return;
        }
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

    setGameMode(mode, autoJoin = false) {
        this.gameMode = mode;
        if (mode === 'online') {
            if (!autoJoin) {
                this.ui.showOnlineMenu();
            }
            this.ui.hideDifficultySelector();
        } else {
            this.ui.toggleDifficultySelector(mode === 'ai');
            this.ui.setActiveButton('mode', 'humanVsAiBtn');
            this.resetRound();
        }
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