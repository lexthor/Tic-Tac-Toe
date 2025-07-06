// Game state variables
let currentPlayer = 'cross';
let gameBoard = Array(9).fill(null);
let gameActive = true;
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
    
    // Make the move
    const cellIndex = parseInt(event.target.dataset.cell);
    gameBoard[cellIndex] = currentPlayer;
    
    // Clone the piece and move it to the board (keep original in drag area)
    const clonedPiece = draggedElement.cloneNode(true);
    clonedPiece.id = draggedElement.id + '_placed';
    clonedPiece.draggable = false;
    event.target.appendChild(clonedPiece);
    
    // Mark the original drag box as used
    draggedElement.parentElement.classList.add('used');
    
    // Check for game end
    if (checkWinner()) {
        endGame(`🎉 ${currentPlayer === 'cross' ? 'Player 1' : 'Player 2'} wins!`);
        scores[currentPlayer]++;
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
        updateGameStatus(`${currentPlayer === 'cross' ? 'Player 1' : 'Player 2'} turn`);
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
    indicator.textContent = `${currentPlayer === 'cross' ? 'Player 1' : 'Player 2'} turn`;
}

function updateScoreDisplay() {
    document.getElementById('crossScore').textContent = scores.cross;
    document.getElementById('circleScore').textContent = scores.circle;
    document.getElementById('drawScore').textContent = scores.draw;
}

function setPlayerTurn() {
    const crossSide = document.getElementById('crossSide');
    const circleSide = document.getElementById('circleSide');
    
    if (currentPlayer === 'cross') {
        crossSide.classList.remove('disabled-side');
        circleSide.classList.add('disabled-side');
    } else {
        circleSide.classList.remove('disabled-side');
        crossSide.classList.add('disabled-side');
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
        const dragBox = crossSide.children[i-1];
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
        const dragBox = circleSide.children[i-1];
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

// Initialize the game
initGame();