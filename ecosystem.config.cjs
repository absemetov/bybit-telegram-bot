module.exports = {
  apps: [
    {
      name: "api",
      script: "./src/web/server/index.js",
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
