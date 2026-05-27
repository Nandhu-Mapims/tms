const http = require('http');
const app = require('./app');
const { env } = require('./config');
const { connectDatabase, disconnectDatabase } = require('./config/database');

const server = http.createServer(app);

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the other server or set PORT to a free port.`);
    process.exit(1);
  }

  console.error('Server error', error);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDatabase();
    console.log('Database connected successfully');

    server.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

startServer();
