require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const cors = require('cors');
const fs = require('fs');

const uploadRouter = require('./api/upload/upload');

const app = express();
const server = http.createServer(app);
const port = 5000;
const origin = process.env.CORS_ORIGIN || '*';

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use('/upload', uploadRouter);

app.get('/api', (req, res) => res.json({ status: 'success', msg: 'hola' }));

server.listen(port, () => console.log(`Servidor HTTP escuchando (${port})`));
