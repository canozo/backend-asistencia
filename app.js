require('dotenv').config();
require('./config/startup').startup();

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const port = 5000;
const origin = process.env.CORS_ORIGIN || '*';

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use('/api/auth', require('./api/auth'));
app.use('/api/semester', require('./api/semester'));
app.use('/api/admin', require('./api/admin'));
app.use('/api/professor', require('./api/professor'));
app.use('/api/student', require('./api/student'));
app.use('/api/camera', require('./api/camera'));
app.use('/api/campus', require('./api/campus'));
app.use('/api/building', require('./api/building'));
app.use('/api/classroom', require('./api/classroom'));
app.use('/api/class', require('./api/class'));
app.use('/api/section', require('./api/section'));
app.use('/api/schedule', require('./api/schedule'));
app.use('/api/attendance', require('./api/attendance'));

server.listen(port, () => console.log(`Servidor HTTP escuchando (${port})`));
