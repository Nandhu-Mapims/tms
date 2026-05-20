const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'CLIENT_URL'];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoDbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  clientUrl: process.env.CLIENT_URL,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterModel:
    process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
  openRouterHttpReferer: process.env.OPENROUTER_HTTP_REFERER || '',
  openRouterAppTitle:
    process.env.OPENROUTER_APP_TITLE || 'MAPIMS Ticket Management',
};
