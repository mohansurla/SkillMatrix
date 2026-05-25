module.exports = {
  database: {
    path: process.env.DB_PATH || './data/skillmatrix.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'skillmatrix_super_secret_2024_xK9mP3qR',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
};
