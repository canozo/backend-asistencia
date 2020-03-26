require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const cors = require('cors');

const uploadRouter = require('./api/upload/upload');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000' }));

app.use('/upload', uploadRouter);

app.get('/', (req, res) => res.json({ status: 'success', msg: 'hola' }));

server.listen(port, () => console.log(`Servidor corriendo en el puerto ${port}`));
