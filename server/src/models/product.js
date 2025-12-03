const { DataTypes } = require('sequelize');
const { getSequelize } = require('../config/sequelize');

const sequelize = getSequelize();

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sale_starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sale_ends_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'products',
    timestamps: false,
  }
);

module.exports = Product;


