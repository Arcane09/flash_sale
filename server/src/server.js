const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const http = require('http');
const app = require('./app');
const { PORT } = require('./config/config');
const { initSequelize, syncModels } = require('./config/sequelize');
const { seedInitialData } = require('./seeders/seed');

const port = PORT || 8080;

async function start() {
  try {
    await initSequelize();
    await syncModels();
    await seedInitialData();
    const server = http.createServer(app);
    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API server listening on port ${port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();


