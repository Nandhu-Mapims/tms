const mongoose = require('mongoose');

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI ?? '';
  if (!uri) {
    const err = new Error('MONGODB_URI is not set');
    err.statusCode = 500;
    throw err;
  }
  return uri;
};

const connectDatabase = async () => {
  const mongoUri = getMongoUri();
  const serverSelectionTimeoutMS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 5000);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS,
  });
};

const disconnectDatabase = async () => {
  if (mongoose.connection?.readyState === 0) return;
  await mongoose.disconnect();
};

const getDatabaseStatus = () => {
  const readyState = mongoose.connection?.readyState ?? 0;
  const stateLabelByReadyState = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING',
  };

  return {
    readyState,
    state: stateLabelByReadyState[readyState] ?? 'UNKNOWN',
    name: mongoose.connection?.name ?? null,
    host: mongoose.connection?.host ?? null,
  };
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
};
