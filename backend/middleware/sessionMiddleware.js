// middleware/sessionMiddleware.js

const checkSessionExpiration = (req, res, next) => {
  // Check if the session exists and the user is logged in
  if (req.session && req.session.user) {
    // Reset the expiration timer on each request to keep the session alive
    req.session.touch();
    return next();
  } else {
    // Session has expired or does not exist
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error ending session." });
      }
      // Optionally, redirect to login or send a response
      return res.status(401).json({ message: "Session expired. Please log in again." });
    });
  }
};

module.exports = { checkSessionExpiration };
