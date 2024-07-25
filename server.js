const WebSocket = require('ws');
const url = require('url');
const server = require('./app'); // Import the HTTP server from app.js

const wss = new WebSocket.Server({ server });

let connectedUsers = [];

wss.on('connection', (socket, req) => {
    const parameters = url.parse(req.url, true).query;
    const username = parameters.username;

    if (!username) {
        socket.close(1008, 'Username is required');
        return;
    }

    socket.username = username;
    connectedUsers.push({ username, socket });
    broadcastConnectedUsers();
    console.log(`${username} connected`);

    // Notify all clients about the new user
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'notify', message: `${username} has joined the chat` }));
        }
    });


    // Handle incoming messages from the client
    socket.on('message', (message) => {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const decodedMessage = message.toString();
        console.log(`Received from ${username}: ${message}`);

        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ 
                    type: 'message', 
                    username, 
                    message: decodedMessage,
                    timestamp: timestamp
                }));
            };
        });
    });

    // Handle client disconnection
    socket.on('close', () => {
        console.log(`${username} disconnected`);

        // Notify all clients about the disconnection
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'notify', message: `${username} has left the chat` }));
            }
        });
        connectedUsers = connectedUsers.filter(user => user.socket !== socket);
        broadcastConnectedUsers();
    });

    function broadcastConnectedUsers() {
        const userList = connectedUsers.map(user => user.username);
        wss.clients.forEach((client) => {
            client.send(JSON.stringify({type: 'userList', users: userList}));
        });
    };
});