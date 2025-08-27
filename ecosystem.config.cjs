module.exports = {
  apps: [
    {
      name: 'codebuilder-api',
      script: 'dist/main.js',
      env: {
        PORT: 4001,
        NODE_ENV: 'production',
      },
    },
  ],
};
