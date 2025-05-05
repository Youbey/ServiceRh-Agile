require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var session = require('express-session');


var usersRouter = require('./routes/users');
var quizRouter = require('./routes/quiz');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html'); // Set HTML as view engine
app.engine('html', require('ejs').renderFile); // Use EJS to render HTML files

// Middleware pour les sessions
app.use(session({
  secret: 'simpleLoginSecret',
  resave: false,
  saveUninitialized: true,
}));


// Configuration des middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Définir les routes
app.use('/users', usersRouter);
app.use('/quiz', quizRouter);

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'error.html'));

});

module.exports = app;