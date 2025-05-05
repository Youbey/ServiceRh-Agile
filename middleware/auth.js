function authenticate(req, res, next) {
    if (req.session.isLoggedIn) {
      next(); // Continuer vers la route suivante
    } else {
      res.redirect('/users/login'); // Redirige vers la page de connexion si non authentifié
    }
  }
  
  module.exports = authenticate;
  