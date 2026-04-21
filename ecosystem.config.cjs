module.exports = {
  apps: [
    {
      name: "audiosen-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/audiosen-web",
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      max_memory_restart: "512M",
    },
  ],
};
