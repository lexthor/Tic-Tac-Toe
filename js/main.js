import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const game = new Game(socket);

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    if (roomId) {
        game.ui.hideGameStartModal();
        game.ui.hideOnlineModal();
        game.setGameMode('online', true);
        game.joinRoom(roomId);
    }
});