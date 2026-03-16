const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getTenantDb } = require('../config/db');

const router = express.Router();

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken({
      user_id: user.user_id,
      id: user._id,
      role: user.role,
      store_id: user.store_id || null,
      shopName: user.shopName,
    });

    res.json({
      token,
      user_id: user.user_id,
      role: user.role,
      store_id: user.store_id || null,
      shopName: user.shopName,
      name: user.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/check-email?email=x  (public — check if email already registered)
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ exists: false });
  const user = await User.findOne({ email: email.toLowerCase() });
  res.json({ exists: !!user });
});

router.get('/check-shopname', async (req, res) => {
  const { shopName } = req.query;
  if (!shopName) return res.json({ exists: false });
  const user = await User.findOne({ 
    shopName: { $regex: new RegExp(`^${shopName.trim()}$`, 'i') } 
  });
  res.json({ exists: !!user });
});

// POST /api/auth/signup  (public — anyone can register as store_admin)
router.post('/signup', async (req, res) => {
  const { name, email, password, shopName, phone } = req.body;
  if (!name || !email || !password || !shopName)
    return res.status(400).json({ message: 'name, email, password, and shopName are required' });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Derive store_id from shopName
    const baseStoreId = shopName.toLowerCase().trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    // ✅ ADD THIS — make store_id unique by appending a number if already taken
    let store_id = baseStoreId;
    let counter = 1;
    while (await User.findOne({ store_id })) {
      store_id = `${baseStoreId}_${counter}`;
      counter++;
    }

    const user = await User.create({ name, email, password, shopName, phone: phone || '', store_id, role: 'store_admin' });

    const tenantDb = getTenantDb(store_id);
    await tenantDb.collection('settings').insertOne({
      ownerId: user._id,
      shopName,
      store_id,
      status: 'active',
      createdAt: new Date(),
    });

    res.status(201).json({
      message: 'Store created successfully',
      store_id,
      shopName,
      id: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/seed-super-admin  (one-time setup — creates first super_admin)
router.post('/seed-super-admin', async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'super_admin' });
    if (exists) return res.status(400).json({ message: 'Super admin already exists' });

    const { name, email, password, shopName } = req.body;
    if (!name || !email || !password || !shopName)
      return res.status(400).json({ message: 'name, email, password, and shopName are required' });

    const admin = await User.create({ name, email, password, shopName, role: 'super_admin' });
    res.status(201).json({ message: 'Super admin created', id: admin._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/all-stores  (super_admin only — list all store_admins)
router.get('/all-stores', auth, roleCheck('super_admin'), async (req, res) => {
  try {
    const stores = await User.find({ role: 'store_admin' }).select('-password');
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
