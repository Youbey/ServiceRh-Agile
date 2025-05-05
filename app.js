var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const tokenRouter = require('./routes/gentoken.js');

const app = express();

// Configuration des middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Servir les fichiers statiques depuis /public
app.use(express.static(path.join(__dirname, 'public')));

// Servir les fichiers HTML statiques depuis /views
app.use('/views', express.static(path.join(__dirname, 'views')));

// Route spécifique pour servir genToken.html à /gentoken
app.get('/gentoken', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'genToken.html'));
});

// Monter le routeur pour l'API de génération de token
app.use('/api/token', tokenRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page (using a JSON response for simplicity)
  res.status(err.status || 500);
  res.json({ error: err.message });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;