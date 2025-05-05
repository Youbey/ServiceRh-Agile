require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');



var tokenRouter = require('./routes/gentoken.js');
var usersRouter = require('./routes/users');
var quizRouter = require('./routes/quiz');


const app = express();

// Configuration des middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configuration des middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Servir les fichiers HTML statiques depuis /views
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route spécifique pour servir genToken.html à /gentoken
app.get('/gentoken', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'genToken.html'));
});

// Middleware pour les sessions
app.use(session({
  secret: 'simpleLoginSecret',
  resave: false,
  saveUninitialized: true,
}));




// Monter le routeur pour l'API de génération de token
app.use('/api/token', tokenRouter);
// Définir les routes
app.use('/users', usersRouter);
app.use('/quiz', quizRouter);

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'error.html'));
});



module.exports = app;