require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  // Updated collection name
  const collection = db.collection('gmc_admin_companies');

  const exists = await collection.findOne({ role: 'super_admin' });
  if (exists) {
    console.log('Super admin already exists:', exists.email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('gmcadmin@123', 10);
  await collection.insertOne({
    name: 'Super Admin',
    email: 'superadmin@gmail.com',
    password: hashedPassword,
    shopName: 'GMC Admin',
    store_id: null,
    role: 'super_admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Super admin created successfully!');
  console.log('Email: superadmin@gmail.com');
  console.log('Password: gmcadmin@123');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});