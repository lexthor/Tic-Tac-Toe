// Game state variables
let currentPlayer = 'cross';
let gameBoard = Array(9).fill(null);
let gameActive = true;
let gameMode = 'human'; // 'human' or 'ai'
let aiDifficulty = 'easy'; // 'easy', 'medium', 'hard'
let scores = {
    cross: 0,
    circle: 0,
    draw: 0
};

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
];

// Initialize game
function initGame() {
    updateTurnIndicator();
    updateScoreDisplay();
    setPlayerTurn();
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
    event.target.parentElement.classList.add('dragging');
}

function dragEnd(event) {
    event.target.parentElement.classList.remove('dragging');
}

function dragOver(event) {
    event.preventDefault();
    if (!event.target.classList.contains('dropBox') || event.target.querySelector('div')) {
        return;
    }
    event.target.classList.add('drag-over');
}

function dragLeave(event) {
    event.target.classList.remove('drag-over');
}

function drop(event) {
    event.preventDefault();
    event.target.classList.remove('drag-over');

    if (!gameActive) return;

    const data = event.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);

    // Check if the drop target is valid
    if (!event.target.classList.contains('dropBox') || event.target.querySelector('div')) {
        return;
    }

    // Check if it's the correct player's turn
    const pieceType = draggedElement.classList.contains('cross') ? 'cross' : 'circle';
    if (pieceType !== currentPlayer) {
        updateGameStatus("❌ Wait for your turn!");
        return;
    }

    // In AI mode, only allow human (cross) to make moves via drag
    if (gameMode === 'ai' && currentPlayer === 'circle') {
        updateGameStatus("🤖 AI is thinking...");
        return;
    }

    makeMove(event.target, pieceType);
}

function makeMove(targetCell, pieceType) {
    const cellIndex = parseInt(targetCell.dataset.cell);
    gameBoard[cellIndex] = pieceType;

    // Clone the piece and move it to the board
    const originalPiece = document.querySelector(`.${pieceType}:not(.used)`);
    if (originalPiece) {
        const clonedPiece = originalPiece.cloneNode(true);
        clonedPiece.id = originalPiece.id + '_placed';
        clonedPiece.draggable = false;
        targetCell.appendChild(clonedPiece);

        // Mark the original drag box as used
        originalPiece.parentElement.classList.add('used');
    }

    // Check for game end
    if (checkWinner()) {
        endGame(`🎉 ${pieceType === 'cross' ? 'Player1' : 'Player2'} wins!`);
        scores[pieceType]++;
        updateScoreDisplay();
        highlightWinningCells();
    } else if (gameBoard.every(cell => cell !== null)) {
        endGame("🤝 It's a draw!");
        scores.draw++;
        updateScoreDisplay();
    } else {
        // Switch turns
        currentPlayer = currentPlayer === 'cross' ? 'circle' : 'cross';
        updateTurnIndicator();
        setPlayerTurn();
        updateGameStatus(`${currentPlayer === 'cross' ? 'Player1' : 'Player2'} turn`);

        // If it's AI's turn, make AI move
        if (gameMode === 'ai' && currentPlayer === 'circle') {
            setTimeout(makeAIMove, 1000); // Delay for realistic thinking time
        }
    }
}

function checkWinner() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c];
    });
}

function highlightWinningCells() {
    winningCombinations.forEach(combination => {
        const [a, b, c] = combination;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            document.querySelectorAll('.dropBox')[a].classList.add('winning-cell');
            document.querySelectorAll('.dropBox')[b].classList.add('winning-cell');
            document.querySelectorAll('.dropBox')[c].classList.add('winning-cell');
        }
    });
}

function endGame(message) {
    gameActive = false;
    updateGameStatus(message);

    // Show modal after a short delay
    setTimeout(() => {
        document.getElementById('modalTitle').textContent = message;
        document.getElementById('modalMessage').textContent = 'Ready for another round?';
        document.getElementById('gameOverModal').style.display = 'flex';
    }, 1500);
}

function updateGameStatus(message) {
    document.getElementById('gameStatus').textContent = message;
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    indicator.textContent = `${currentPlayer === 'cross' ? 'Player1' : 'Player2'} turn`;
}

function updateScoreDisplay() {
    document.getElementById('crossScore').textContent = scores.cross;
    document.getElementById('circleScore').textContent = scores.circle;
    document.getElementById('drawScore').textContent = scores.draw;
}

function setPlayerTurn() {
    const crossSide = document.getElementById('crossSide');
    const circleSide = document.getElementById('circleSide');

    if (gameMode === 'ai') {
        // In AI mode, always keep cross (human) enabled, disable circle (AI)
        crossSide.classList.remove('disabled-side');
        circleSide.classList.add('disabled-side');
    } else {
        // In human vs human mode, alternate normally
        if (currentPlayer === 'cross') {
            crossSide.classList.remove('disabled-side');
            circleSide.classList.add('disabled-side');
        } else {
            circleSide.classList.remove('disabled-side');
            crossSide.classList.add('disabled-side');
        }
    }
}

function resetRound() {
    // Reset game state
    gameBoard = Array(9).fill(null);
    gameActive = true;
    currentPlayer = 'cross';

    // Clear the board
    document.querySelectorAll('.dropBox').forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('winning-cell');
    });

    // Reset drag boxes
    document.querySelectorAll('.dragBox').forEach(box => {
        box.classList.remove('used');
    });

    // Recreate all pieces in their original positions
    recreateAllPieces();

    // Update UI
    updateTurnIndicator();
    setPlayerTurn();
    updateGameStatus('Drag & Drop to Play!');

    // Hide modal
    document.getElementById('gameOverModal').style.display = 'none';
}

function recreateAllPieces() {
    // Clear all existing pieces
    document.querySelectorAll('.cross, .circle').forEach(piece => piece.remove());

    // Recreate cross pieces
    const crossSide = document.getElementById('crossSide');
    for (let i = 1; i <= 5; i++) {
        const dragBox = crossSide.children[i - 1];
        const crossPiece = document.createElement('div');
        crossPiece.className = 'cross';
        crossPiece.draggable = true;
        crossPiece.id = `cross${i}`;
        crossPiece.addEventListener('dragstart', drag);
        crossPiece.addEventListener('dragend', dragEnd);
        dragBox.appendChild(crossPiece);
    }

    // Recreate circle pieces
    const circleSide = document.getElementById('circleSide');
    for (let i = 1; i <= 5; i++) {
        const dragBox = circleSide.children[i - 1];
        const circlePiece = document.createElement('div');
        circlePiece.className = 'circle';
        circlePiece.draggable = true;
        circlePiece.id = `circle${i}`;
        circlePiece.addEventListener('dragstart', drag);
        circlePiece.addEventListener('dragend', dragEnd);
        dragBox.appendChild(circlePiece);
    }
}

function startNewGame() {
    resetRound();
    scores = { cross: 0, circle: 0, draw: 0 };
    updateScoreDisplay();
}

function startNewRound() {
    resetRound();
}

// AI Functions
function makeAIMove() {
    if (!gameActive || currentPlayer !== 'circle') return;

    updateGameStatus("🤖 AI is thinking...");
    document.getElementById('gameBoard').classList.add('ai-thinking');

    let bestMove;

    switch (aiDifficulty) {
        case 'easy':
            bestMove = getRandomMove();
            break;
        case 'medium':
            bestMove = getMediumMove();
            break;
        case 'hard':
            bestMove = getHardMove();
            break;
        default:
            bestMove = getRandomMove();
    }

    setTimeout(() => {
        document.getElementById('gameBoard').classList.remove('ai-thinking');
        if (bestMove !== -1) {
            const targetCell = document.querySelectorAll('.dropBox')[bestMove];
            makeMove(targetCell, 'circle');
        }
    }, 500);
}

function getRandomMove() {
    const availableMoves = [];
    gameBoard.forEach((cell, index) => {
        if (cell === null) availableMoves.push(index);
    });
    return availableMoves.length > 0 ?
        availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
}

function getMediumMove() {
    // 50% chance to play optimally, 50% chance to play randomly
    return Math.random() < 0.5 ? getHardMove() : getRandomMove();
}

function getHardMove() {
    // Try to win
    for (let i = 0; i < 9; i++) {
        if (gameBoard[i] === null) {
            gameBoard[i] = 'circle';
            if (checkWinner()) {
                gameBoard[i] = null;
                return i;
            }
            gameBoard[i] = null;
        }
    }

    // Try to block player from winning
    for (let i = 0; i < 9; i++) {
        if (gameBoard[i] === null) {
            gameBoard[i] = 'cross';
            if (checkWinner()) {
                gameBoard[i] = null;
                return i;
            }
            gameBoard[i] = null;
        }
    }

    // Take center if available
    if (gameBoard[4] === null) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => gameBoard[corner] === null);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available move
    return getRandomMove();
}

function setGameMode(mode) {
    gameMode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (mode === 'human') {
        document.getElementById('humanVsHumanBtn').classList.add('active');
        document.getElementById('difficultySelector').style.display = 'none';
    } else {
        document.getElementById('humanVsAiBtn').classList.add('active');
        document.getElementById('difficultySelector').style.display = 'flex';
    }

    // Reset game when mode changes
    resetRound();
}

function setDifficulty(difficulty) {
    aiDifficulty = difficulty;

    // Update button states
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(difficulty + 'Btn').classList.add('active');
}

// Event listeners
document.querySelectorAll('.dragBox div').forEach(item => {
    item.addEventListener('dragstart', drag);
    item.addEventListener('dragend', dragEnd);
});

document.querySelectorAll('.dropBox').forEach(item => {
    item.addEventListener('dragover', dragOver);
    item.addEventListener('dragleave', dragLeave);
    item.addEventListener('drop', drop);
});

document.getElementById('resetBtn').addEventListener('click', resetRound);
document.getElementById('newGameBtn').addEventListener('click', startNewGame);

// Game mode event listeners
document.getElementById('humanVsHumanBtn').addEventListener('click', () => setGameMode('human'));
document.getElementById('humanVsAiBtn').addEventListener('click', () => setGameMode('ai'));

// Difficulty event listeners
document.getElementById('easyBtn').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('mediumBtn').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('hardBtn').addEventListener('click', () => setDifficulty('hard'));

// Initialize the game
initGame();