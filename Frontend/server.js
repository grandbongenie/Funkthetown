const http = require('http');
const app = require('./app');
const fs = require('fs');
const https = require('https');

const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

// Port HTTP : 3000
const httpPort = normalizePort(process.env.HTTP_PORT || '3000');
// Port HTTPS : 3000
//const httpsPort = normalizePort(process.env.HTTPS_PORT || '3000');

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + httpPort;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Serveur HTTP
const server = http.createServer(app);
server.on('error', errorHandler);
server.on('listening', () => {
  console.log('Serveur HTTP démarré sur le port ' + httpPort);
});
server.listen(httpPort);

// Serveur HTTPS
// const httpsServer = https.createServer({
//   key: fs.readFileSync('/etc/letsencrypt/live/funkthetown.net/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/funkthetown.net/fullchain.pem'),
// }, app);

// httpsServer.listen(httpsPort, () => {
//   console.log('Serveur HTTPS démarré sur le port ' + httpsPort);
// });
