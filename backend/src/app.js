const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const baseRoutes = require('./routes/base.routes');
const notFoundHandler = require('./middlewares/notFoundHandler');
const globalErrorHandler = require('./middlewares/globalErrorHandler');
const { env } = require('./config');

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.env === 'development' ? 'dev' : 'combined'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', baseRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
