// middleware/authMiddleware.js

const { getLogin, logout, forgotPassword, resetPassword, redeemAccount, resendRedemptionCode, changePassword, getCurrentUser, registerCustomer } = require("../models/LoginModel");

const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'cms_default_jwt_secret_change_me';

const authMiddleware = {
  login: (req, res, next) => getLogin(req, res, next),
  logout: (req, res, next) => logout(req, res, next),
  forgotPassword: (req, res, next) => forgotPassword(req, res, next),
  resetPassword: (req, res, next) => resetPassword(req, res, next),
  redeemAccount: (req, res, next) => redeemAccount(req, res, next),
  resendRedemptionCode: (req, res, next) => resendRedemptionCode(req, res, next),
  changePassword: (req, res, next) => changePassword(req, res, next),
  getCurrentUser: (req, res, next) => getCurrentUser(req, res, next),
  register: (req, res, next) => registerCustomer(req, res, next),

  verifyToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided!" });

    try {
      const verified = jwt.verify(token, JWT_SECRET_KEY);
      req.user = verified;
      next();
    } catch (err) {
      res.status(400).json({ message: "Invalid Token" });
    }
  }
};

module.exports = authMiddleware;
