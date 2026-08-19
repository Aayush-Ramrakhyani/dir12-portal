import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-not-for-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-not-for-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  finanvo: {
    baseUrl: process.env.FINANVO_BASE_URL || 'https://api5.finanvo.in',
    email: process.env.FINANVO_EMAIL || '',
    password: process.env.FINANVO_PASSWORD || '',
    tokenPath: process.env.FINANVO_TOKEN_PATH || 'data.token',
    timeoutMs: parseInt(process.env.FINANVO_TIMEOUT_MS || '30000', 10),
  },
};
