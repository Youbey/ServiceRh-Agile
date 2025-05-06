function authenticate(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
      return next(); // Continuer si l'utilisateur est authentifié
  }
  res.status(403).send('<h1>Accès interdit</h1><a href="/users/login">Se connecter</a>');
}

module.exports = authenticate;
