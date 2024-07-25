const express = require("express");
const AWS = require('aws-sdk');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const jwtSecret = process.env.JWT_SECRET;
const table = 'user-auth';

AWS.config.update({
    region: 'us-east-2',
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});

const docClient = new AWS.DynamoDB.DocumentClient();

const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = 3000;

// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins
    methods: 'GET,POST', // Allow specific methods
    allowedHeaders: ['Content-Type'] // Allow specific headers
};

//CORS
app.use(cors(corsOptions));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Add registered data into DynamoDB
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400).send('Incomplete data.')
    } else {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const params = {
            TableName: table,
            Item: {
                'username': username,
                'email': email,
                'password': hashedPassword
            },
            ConditionExpression: 'attribute_not_exists(username)'
        };

        docClient.put(params, (err, data) => {
            if (err) {
                if (err.code === 'ConditionalCheckFailedException') {
                    res.status(409).send('Username already exists');
                } else {
                    res.status(500).send('Error registering user');
                    console.log(err);
                };
            } else {
                res.status(201).send('User successfully registered');
            };
        });
    };
});

// Check if entered login info matches with DynamoDB data
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).send('Incomplete data.');
    } else {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const params = {
            TableName: table,
            Key: {
                'username': username
            }
        };

        docClient.get(params, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error fetching user data');
            } else {
                if (data.Item) {
                    if (data.Item.password === hashedPassword) {
                        const token = jwt.sign({ username: username }, jwtSecret, {expiresIn: '2h'});

                        // Set HttpOnly cookie
                        res.cookie('token', token, {httpOnly: true, secure: false, sameSite: 'Strict'});
                        res.status(200).send('Login successful');
                    } else {
                        res.status(401).send('Invalid username or password');
                    }
                } else {
                res.status(401).send('Invalid username or password');
                }
            }
        });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).send('Logout successful');
});

// Middleware to verify JWT and redirect to login if not valid
app.use((req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/');
    }

    try {
        jwt.verify(token, jwtSecret);
        next();
    } catch (err) {
        res.redirect('/')
    }
});

app.get('/validate-token', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        res.status(200).json({username: decoded.username});
    } catch (err) {
        res.status(401).send('Invalid token');
    }
});

// Create and export the HTTP server
const server = app.listen(PORT, () => {
    console.log(`HTTP server running on PORT ${PORT}`);
})

module.exports = server;