import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
  JWT_EXPIRES_IN: '24h',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

export default env;
