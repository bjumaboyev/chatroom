const WebSocket = require('ws');
const url = require('url');
const server = require('./app'); // Import the HTTP server from app.js

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket, req) => {
    const parameters = url.parse(req.url, true).query;
    const username = parameters.username;

    if (!username) {
        socket.close(1008, 'Username is required');
        return;
    }

    socket.username = username;
    console.log(`${username} connected`);

    // Notify all clients about the new user
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(`${username} has joined the chat`);
        }
    });

    // Handle incoming messages from the client
    socket.on('message', (message) => {
        console.log(`Received from ${username}: ${message}`);

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(`${username}: ${message}`);
        }
    });
});

    // Handle client disconnection
    socket.on('close', () => {
        console.log(`${username} disconnected`);

        // Notify all clients about the disconnection
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`${username} has left the chat`);
            }
        });
    });
});

console.log('WebSocket server is running on ws://localhost:3000');

