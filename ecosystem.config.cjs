module.exports = {
  apps: [
    {
      name: "bybit-bot",
      script: "./src/index.js",
      watch: true,
      interpreter: "node",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "bybit-web",
      script: "./src/web/index.js",
      watch: true,
      interpreter: "node",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
