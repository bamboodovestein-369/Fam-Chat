const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CRITICAL: This allows Railway to connect to your app
const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 10000
});

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();

io.on('connection', (socket) => {
    console.log('A user connected!');

    socket.on('set username', (username) => {
        users.set(socket.id, { username: username, online: true });
        broadcastUserList();
    });

    socket.on('chat message', (msg) => {
        msg.timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        io.emit('chat message', msg);
    });

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

function broadcastUserList() {
    const userList = Array.from(users.values()).map(u => ({
        username: u.username,
        online: u.online
    }));
    io.emit('user list', userList);
}

// CRITICAL: Use Railway's PORT and listen on 0.0.0.0
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
