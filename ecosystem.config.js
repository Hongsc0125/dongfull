module.exports = {
  apps: [
    {
      name: 'event-board-bot',
      script: 'src/bot/index.js',
      env: {
        NODE_ENV: 'production'
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: 'event-board-web',
      script: 'npm',
      args: 'start',
      cwd: './client',
      env: {
        NODE_ENV: 'production',
        PORT: 3777
      },
      restart_delay: 5000,
      max_restarts: 10,
    }
  ]
};