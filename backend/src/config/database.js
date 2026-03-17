const prisma = require('../prisma/client');

const connectDatabase = async () => {
  await prisma.$connect();
  console.log('Database connected successfully');
};

module.exports = {
  connectDatabase,
  prisma,
};
