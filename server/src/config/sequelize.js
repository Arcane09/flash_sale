const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('./config');

let sequelize;

function getSequelize() {
  if (!sequelize) {
    sequelize = new Sequelize(
      DB_CONFIG.database,
      DB_CONFIG.username,
      DB_CONFIG.password,
      {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        dialect: DB_CONFIG.dialect,
        logging: false,
      }
    );
  }
  return sequelize;
}

async function initSequelize() {
  const instance = getSequelize();
  await instance.authenticate();
  return instance;
}

async function syncModels() {
  // Ensure models are registered
  // eslint-disable-next-line global-require
  require('../models');
  const instance = getSequelize();
  await instance.sync({ alter: true });
}

module.exports = {
  getSequelize,
  initSequelize,
  syncModels,
};


