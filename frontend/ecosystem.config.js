module.exports = {
  apps: [{
    name: 'togaar-falakcart',
    script: '.next/standalone/server.js',
    cwd: '/www/wwwroot/togaar.com/falakcart/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0',
      NEXT_PUBLIC_API_URL: 'https://togaar.com/api',
      NEXT_PUBLIC_APP_URL: 'https://togaar.com'
    },
    error_file: '/www/wwwroot/togaar.com/falakcart/logs/pm2-error.log',
    out_file: '/www/wwwroot/togaar.com/falakcart/logs/pm2-out.log',
    log_file: '/www/wwwroot/togaar.com/falakcart/logs/pm2-combined.log',
    time: true
  }]
};