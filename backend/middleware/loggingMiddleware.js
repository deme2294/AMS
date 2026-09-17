// middleware/loggingMiddleware.js

const loggingMiddleware = (req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next();
  };
  
  module.exports = loggingMiddleware;
  