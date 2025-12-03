/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { initSequelize, syncModels } = require('../config/sequelize');
const {
  Product,
  User,
  Order,
  InventoryEvent,
} = require('../models');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Seed initial demo data.
 * By default, this only runs if there are no products yet (to avoid wiping
 * existing data every time the server restarts).
 */
async function seedInitialData({ force = false } = {}) {
  await initSequelize();
  await syncModels();

  const now = new Date();
  const saleStarts = new Date(now.getTime() - 5 * 60 * 1000);
  // Keep each seeded flash sale live for 4 days from now
  const saleEnds = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const seedProducts = [
    {
      name: 'Flash Sneakers',
      description: 'Limited edition sneakers for flash sale.',
      price: 99.99,
      total_stock: 100,
      sale_starts_at: saleStarts,
      sale_ends_at: saleEnds,
    },
    {
      name: 'Pro Headphones',
      description: 'High quality noise-cancelling headphones.',
      price: 149.99,
      total_stock: 50,
      sale_starts_at: saleStarts,
      sale_ends_at: saleEnds,
    },
    {
      name: 'iPhone 15 Pro Max',
      description:
        'Latest flagship smartphone with titanium design and A17 Pro chip.',
      price: 1199.99,
      total_stock: 100,
      sale_starts_at: saleStarts,
      sale_ends_at: saleEnds,
    },
    {
      name: 'PlayStation 5 Pro',
      description:
        'Next‑gen console with 4K gaming, ray tracing and ultra‑fast SSD.',
      price: 699.99,
      total_stock: 200,
      sale_starts_at: saleStarts,
      sale_ends_at: saleEnds,
    },
    {
      name: 'Sony WH‑1000XM5 Headphones',
      description: 'Industry‑leading noise cancelling wireless headphones.',
      price: 349.99,
      total_stock: 50,
      sale_starts_at: saleStarts,
      sale_ends_at: saleEnds,
    },
    {
      name: 'MacBook Pro 16”',
      description: 'Powerful laptop with M‑series chip, perfect for pros.',
      price: 2499.99,
      total_stock: 30,
      sale_starts_at: saleStarts,
      sale_ends_at: saleEnds,
    },
  ];

  if (force) {
    console.log('Seeding database (force mode)...');
    // For demo/assessment, clear existing data when force:true.
    // Need to delete children before parents because of FK constraints.
    await InventoryEvent.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Product.bulkCreate(seedProducts);

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
      email: ADMIN_EMAIL,
      password_hash: adminPasswordHash,
      role: 'admin',
    });

    console.log('Seed complete.');
    return;
  }

  console.log('Seeding missing demo data (idempotent)...');

  // In normal startup, only insert products that don't already exist.
  // This lets us add new seed products over time without wiping real data.
  // eslint-disable-next-line no-restricted-syntax
  for (const product of seedProducts) {
    // eslint-disable-next-line no-await-in-loop
    await Product.findOrCreate({
      where: { name: product.name },
      defaults: product,
    });
  }

  const existingAdmin = await User.findOne({
    where: { email: ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
      email: ADMIN_EMAIL,
      password_hash: adminPasswordHash,
      role: 'admin',
    });
  }

  console.log('Seed check complete.');
}

// When executed directly via `npm run seed`, force reseed.
if (require.main === module) {
  seedInitialData({ force: true })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed', err);
      process.exit(1);
    });
}

module.exports = { seedInitialData };

