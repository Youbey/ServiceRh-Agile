var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var session = require('express-session');

var tokenRouter = require('./routes/gentoken.js');
var usersRouter = require('./routes/users');
var quizRouter = require('./routes/quiz');
var resultatsCandidat = require('./routes/resultatsCandidat');
var quizCreateRouter = require('./routes/quiz_create');
var quizListRouter = require('./routes/quiz_list');
var quizzRouter = require('./routes/quizz');
var cors = require('cors');

var app = express();
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST'],
  credentials: true,
};
app.use(cors(corsOptions));

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Définir les routes
app.use('/api/token', tokenRouter);
app.use('/users', usersRouter);
app.use('/quiz_create', quizCreateRouter);
app.use('/quiz_list', quizListRouter);
app.use('/create', quizCreateRouter);
app.use('/quiz', quizRouter);
app.use('/resultatsCandidat', resultatsCandidat);
app.use('/api', quizzRouter);
app.use("/", indexRouter);


// Servir les fichiers HTML statiques depuis /views
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route spécifique pour servir genToken.html à /gentoken
app.get('/gentoken', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'genToken.html'));
});

app.get('/quizz', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'quizz.html'));
});


// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', 'error.html'));

});

module.exports = app;