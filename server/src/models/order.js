const { DataTypes } = require('sequelize');
const { getSequelize } = require('../config/sequelize');
const Product = require('./product');

const sequelize = getSequelize();

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    hold_expires_at: {
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
    tableName: 'orders',
    timestamps: false,
  }
);

Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = Order;


