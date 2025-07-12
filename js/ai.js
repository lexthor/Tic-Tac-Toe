import { WINNING_COMBINATIONS } from './constants.js';

export class AI {
    constructor(difficulty = 'easy') {
        this.difficulty = difficulty;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getMove(gameBoard) {
        switch (this.difficulty) {
            case 'easy':
                return this.getEasyMove(gameBoard);
            case 'medium':
                return this.getMediumMove(gameBoard);
            case 'hard':
                return this.getHardMove(gameBoard);
            default:
                return this.getRandomMove(gameBoard);
        }
    }

    getEasyMove(gameBoard) {
        return Math.random() < 0.5 ? this.getHardMove(gameBoard) : this.getRandomMove(gameBoard);
    }

    getRandomMove(gameBoard) {
        const availableMoves = [];
        gameBoard.forEach((cell, index) => {
            if (cell === null) availableMoves.push(index);
        });
        return availableMoves.length > 0
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : -1;
    }

    getMediumMove(gameBoard) {
        return Math.random() < 0.7 ? this.getHardMove(gameBoard) : this.getRandomMove(gameBoard);
    }

    getHardMove(gameBoard) {
        // Try to win
        for (let i = 0; i < 9; i++) {
            if (gameBoard[i] === null) {
                gameBoard[i] = 'circle';
                if (this.checkWinner(gameBoard)) {
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
                if (this.checkWinner(gameBoard)) {
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
        return this.getRandomMove(gameBoard);
    }

    checkWinner(gameBoard) {
        return WINNING_COMBINATIONS.some(combination => {
            const [a, b, c] = combination;
            return gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c];
        });
    }
}