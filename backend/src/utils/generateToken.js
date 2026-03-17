const jwt = require('jsonwebtoken');
const { env } = require('../config');

const generateToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

module.exports = generateToken;
