import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-please-change-in-production',
  nodeEnv: process.env.NODE_ENV || 'development'
};