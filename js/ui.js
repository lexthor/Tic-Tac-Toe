export class UI {
    constructor() {
        this.gameStartModal = document.getElementById('gameStartModal');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.mainMenuView = document.getElementById('main-menu-view');
        this.onlineMenuView = document.getElementById('online-menu-view');
        this.roomIdInput = document.getElementById('roomIdInput');
        this.roomIdDisplay = document.getElementById('roomIdDisplay');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.gameStatus = document.getElementById('gameStatus');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.crossScore = document.getElementById('crossScore');
        this.circleScore = document.getElementById('circleScore');
        this.drawScore = document.getElementById('drawScore');
        this.difficultySelector = document.getElementById('difficultySelector');
        this.gameBoard = document.getElementById('gameBoard');
        this.crossSide = document.getElementById('crossSide');
        this.circleSide = document.getElementById('circleSide');
    }

    showGameStartModal() {
        this.gameStartModal.style.display = 'flex';
    }

    hideGameStartModal() {
        this.gameStartModal.style.display = 'none';
    }

    showGameOverModal(message) {
        this.modalTitle.textContent = message;
        this.modalMessage.textContent = 'Ready for another round?';
        this.gameOverModal.style.display = 'flex';
    }

    hideGameOverModal() {
        this.gameOverModal.style.display = 'none';
    }

    showOnlineMenu() {
        this.mainMenuView.classList.add('hidden');
        this.onlineMenuView.classList.remove('hidden');
    }

    showMainMenu() {
        this.onlineMenuView.classList.add('hidden');
        this.mainMenuView.classList.remove('hidden');
    }

    getRoomIdInput() {
        return this.roomIdInput.value;
    }

    showRoomId(roomId) {
        this.roomIdDisplay.textContent = `Room ID: ${roomId}`;
    }

    updateBoard(board) {
        document.querySelectorAll('.dropBox').forEach((cell, index) => {
            cell.innerHTML = '';
            if (board[index]) {
                const piece = this.createPiece(board[index], index);
                piece.draggable = false;
                cell.appendChild(piece);
            }
        });
    }

    updateGameStatus(message) {
        this.gameStatus.textContent = message;
    }

    updateTurnIndicator(currentPlayer) {
        this.turnIndicator.textContent = `${currentPlayer === 'cross' ? 'Player1' : 'Player2'} turn`;
    }

    updateScoreDisplay(scores) {
        this.crossScore.textContent = scores.cross;
        this.circleScore.textContent = scores.circle;
        this.drawScore.textContent = scores.draw;
    }

    setPlayerTurn(currentPlayer, gameMode) {
        if (gameMode === 'ai') {
            this.crossSide.classList.remove('disabled-side');
            this.circleSide.classList.add('disabled-side');
        } else {
            if (currentPlayer === 'cross') {
                this.crossSide.classList.remove('disabled-side');
                this.circleSide.classList.add('disabled-side');
            } else {
                this.circleSide.classList.remove('disabled-side');
                this.crossSide.classList.add('disabled-side');
            }
        }
    }

    resetBoard() {
        document.querySelectorAll('.dropBox').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('winning-cell');
        });
    }

    resetDragBoxes() {
        document.querySelectorAll('.dragBox').forEach(box => {
            box.classList.remove('used');
        });
    }

    recreateAllPieces() {
this.resetDragBoxes();
        document.querySelectorAll('.cross, .circle').forEach(piece => piece.remove());

        for (let i = 1; i <= 5; i++) {
            const crossDragBox = this.crossSide.children[i - 1];
            const crossPiece = this.createPiece('cross', i);
            crossDragBox.appendChild(crossPiece);

            const circleDragBox = this.circleSide.children[i - 1];
            const circlePiece = this.createPiece('circle', i);
            circleDragBox.appendChild(circlePiece);
        }
    }

    createPiece(type, id) {
        const piece = document.createElement('div');
        piece.className = type;
        piece.draggable = true;
        piece.id = `${type}${id}`;
        return piece;
    }

    placePiece(targetCell, pieceType) {
        const originalPiece = document.querySelector(`.dragBox:not(.used) .${pieceType}`);
        if (originalPiece) {
            const clonedPiece = originalPiece.cloneNode(true);
            clonedPiece.id = originalPiece.id + '_placed';
            clonedPiece.draggable = false;
            targetCell.appendChild(clonedPiece);
            originalPiece.parentElement.classList.add('used');
        }
    }

    highlightWinningCells(gameBoard, winningCombinations) {
        winningCombinations.forEach(combination => {
            const [a, b, c] = combination;
            if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
                document.querySelectorAll('.dropBox')[a].classList.add('winning-cell');
                document.querySelectorAll('.dropBox')[b].classList.add('winning-cell');
                document.querySelectorAll('.dropBox')[c].classList.add('winning-cell');
            }
        });
    }

    toggleDifficultySelector(show) {
        this.difficultySelector.classList.toggle('hidden', !show);
    }

    hideDifficultySelector() {
        this.difficultySelector.classList.add('hidden');
    }

    setActiveButton(buttonType, activeId) {
        document.querySelectorAll(`.${buttonType}-btn`).forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(activeId).classList.add('active');
    }

    setAITurn(isThinking) {
        if (isThinking) {
            this.gameBoard.classList.add('ai-thinking');
            this.updateGameStatus("🤖 AI is thinking...");
        } else {
            this.gameBoard.classList.remove('ai-thinking');
        }
    }
}