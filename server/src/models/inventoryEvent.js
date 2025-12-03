const { DataTypes } = require('sequelize');
const { getSequelize } = require('../config/sequelize');
const Product = require('./product');

const sequelize = getSequelize();

const InventoryEvent = sequelize.define(
  'InventoryEvent',
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
    type: {
      type: DataTypes.ENUM(
        'stock_added',
        'hold_created',
        'hold_released',
        'order_confirmed'
      ),
      allowNull: false,
    },
    delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'inventory_events',
    timestamps: false,
  }
);

InventoryEvent.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = InventoryEvent;


