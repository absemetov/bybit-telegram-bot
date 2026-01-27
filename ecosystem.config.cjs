module.exports = {
  apps: [
    {
      name: "bybit-web",
      script: "./src/web/index.js",
      watch: false,
      time: true,
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
