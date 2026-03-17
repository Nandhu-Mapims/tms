const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'CLIENT_URL'];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  clientUrl: process.env.CLIENT_URL,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
};
