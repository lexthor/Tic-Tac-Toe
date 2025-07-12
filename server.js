const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', () => {
        let roomId = Math.random().toString(36).substring(2, 7);
        while (rooms[roomId]) {
            roomId = Math.random().toString(36).substring(2, 7);
        }
        rooms[roomId] = { players: [socket.id], board: Array(9).fill(null), currentPlayer: 'cross' };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && rooms[roomId].players.length === 1) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit('startGame', rooms[roomId]);
        } else {
            socket.emit('error', 'Room is full or does not exist.');
        }
    });

    socket.on('makeMove', (data) => {
        const { roomId, cellIndex, pieceType } = data;
        if (rooms[roomId] && rooms[roomId].players.includes(socket.id)) {
            const room = rooms[roomId];
            if (room.board[cellIndex] === null && pieceType === room.currentPlayer) {
                room.board[cellIndex] = pieceType;
                room.currentPlayer = room.currentPlayer === 'cross' ? 'circle' : 'cross';
                io.to(roomId).emit('moveMade', room);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.indexOf(socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit('playerLeft', {});
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});