const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 10000
});

app.use(express.static(path.join(__dirname, 'public')));

// Track users with their online status
// Format: socket.id -> { username, online }
const users = new Map();

io.on('connection', (socket) => {
    console.log('A user connected!');

    // When client sends their username, mark them as online
    socket.on('set username', (username) => {
        users.set(socket.id, { username: username, online: true });
        broadcastUserList();
    });

    // Handle chat messages
    socket.on('chat message', (msg) => {
        msg.timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        io.emit('chat message', msg);
    });

    // When user disconnects, mark them as offline (DON'T delete)
    socket.on('disconnect', () => {
        console.log('A user disconnected!');
        const user = users.get(socket.id);
        if (user) {
            user.online = false;
            users.set(socket.id, user);
            broadcastUserList();
        }
    });
});

// Helper function to send user list to everyone
function broadcastUserList() {
    const userList = Array.from(users.values()).map(u => ({
        username: u.username,
        online: u.online
    }));
    io.emit('user list', userList);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
