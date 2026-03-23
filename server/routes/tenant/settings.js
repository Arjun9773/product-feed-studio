const express = require('express');
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Access = require('../../models/Access');
const Company = require('../../models/Company');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const router = express.Router();

// GET /api/settings/profile — Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    let userId = req.user.userId;

    // Super admin — email from super admin, other details from switched store
    if (req.user.userType === 'super_admin') {
      const tenantId = req.headers['x-tenant-id'];

      // Get super admin email
      const superAdmin = await User.findOne({ userId }).select('email');

      if (tenantId) {
        // Get switched store admin profile
        const storeUser = await User.findOne({
          companyId: tenantId,
          userType:  'store_admin',
        }).select('-password');

        if (storeUser) {
          // Return store data but override email with super admin email
          return res.json({
            ...storeUser.toObject(),
            email: superAdmin?.email || '',
          });
        }
      }

      // No store selected — return super admin own profile
      const admin = await User.findOne({ userId }).select('-password');
      return res.json(admin);
    }

    // Store admin / user — own profile
    const user = await User.findOne({ userId }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// PUT /api/settings/profile — Update phone number
router.put('/profile', auth, async (req, res) => {
  try {
    const { phone } = req.body;

    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { phone, updatedAt: new Date() } }
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings/password — Update password
router.put('/password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ message: 'New password is required' });
    if (newPassword.length < 8)
      return res.status(400).json({ message: 'Minimum 8 characters required' });
    if (!/[A-Z]/.test(newPassword))
      return res.status(400).json({ message: 'Must contain at least one uppercase letter' });
    if (!/[0-9]/.test(newPassword))
      return res.status(400).json({ message: 'Must contain at least one number' });

    let userId = req.user.userId;

    // Super admin → change switched store admin password
    if (req.user.userType === 'super_admin') {
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) {
        const storeUser = await User.findOne({
          companyId: tenantId,
          userType:  'store_admin',
        });
        if (storeUser) userId = storeUser.userId;
      }
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET /api/settings/users — List all users in same company
router.get('/users', auth, async (req, res) => {
  try {
    const companyId = req.user.userType === 'super_admin'
      ? req.headers['x-tenant-id']
      : req.user.companyId;

    if (!companyId) return res.status(400).json({ message: 'Company ID is required' });

    const company = await Company.findOne({ companyId });
    if (!company) return res.status(404).json({ message: 'Store not found' });

    // Show only 'user' type — not store_admin or super_admin
    const users = await User.find({
      companyId,
      userType: 'user', // ← only users ✅
      userId:   { $ne: req.user.userId },
    }).select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/settings/add-user — Add new user to company
router.post('/add-user', auth, async (req, res) => {
  try {
    if (!['super_admin', 'store_admin'].includes(req.user.userType)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { email, password, userName } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Super admin adding user → use switched store company
    // Store admin adding user → use own company
    const targetCompanyId = req.user.userType === 'super_admin'
      ? req.headers['x-tenant-id']
      : req.user.companyId;

    if (!targetCompanyId) {
      return res.status(400).json({ message: 'No store selected' });
    }

    const adminUser = await User.findOne({ userId: req.user.userId });
    const company   = await Company.findOne({ companyId: targetCompanyId });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const newUser = await User.create({
      companyId:   targetCompanyId,        
      companyName: company.companyName,    
      companyUrl:  company.companyUrl || '', 
      userName:    userName || '',
      email,
      password,
      phone:    adminUser?.phone || '',
      userType: 'user',
    });

    await Access.create({
      companyId:   targetCompanyId,
      companyName: company.companyName,
      userId:      newUser.userId,
      userType:    'user',
      status:      'active',
    });

    res.status(201).json({
      message: 'User added successfully',
      userId:  newUser.userId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/settings/users/:userId — Remove user from company
router.delete('/users/:userId', auth, async (req, res) => {
  try {
    if (!['super_admin', 'store_admin'].includes(req.user.userType)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    // Super admin → use switched store companyId
    // Store admin → use own companyId
    const companyId = req.user.userType === 'super_admin'
      ? req.headers['x-tenant-id']
      : req.user.companyId;

    if (!companyId) return res.status(400).json({ message: 'No store selected' });

    const user = await User.findOne({ userId, companyId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.deleteOne({ userId });
    await Access.deleteOne({ userId, companyId });

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/settings/users-log — Activity log
router.get('/users-log', auth, async (req, res) => {
  try {
    const mainDb = mongoose.connection.useDb('gmc_main_admin_db');

    let query = {};

    if (req.user.userType === 'super_admin') {
      // Super admin → show switched store's store_admin + users logs
      const tenantId = req.headers['x-tenant-id'];
      if (!tenantId) return res.status(400).json({ message: 'No store selected' });

      query = {
        companyId: tenantId,
        userType:  { $in: ['store_admin', 'user'] },
      };
    } else {
      // Store admin → own company users logs only
      query = {
        companyId: req.user.companyId,
        userType:  'user',
      };
    }

    const logs = await mainDb.collection('userlogs')
      .find(query)
      .sort({ loginAt: -1 })
      .limit(50)
      .toArray();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Create uploads folder if not exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only jpeg/png/webp allowed'));
  }
});

// POST /api/settings/upload-photo
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const photoPath = `/uploads/${req.file.filename}`;

    // Super admin → save to switched store's user
    // Store admin → save to own document
    let userId = req.user.userId;

    if (req.user.userType === 'super_admin') {
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) {
        const storeUser = await User.findOne({
          companyId: tenantId,
          userType:  'store_admin',
        });
        if (storeUser) userId = storeUser.userId;
      }
    }

    await User.findOneAndUpdate(
      { userId },
      { $set: { photoPath, updatedAt: new Date() } }
    );

    res.json({ message: 'Photo uploaded', photoPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
       
// DELETE /api/settings/remove-photo
router.delete('/remove-photo', auth, async (req, res) => {
  try {
    let userId = req.user.userId;

    if (req.user.userType === 'super_admin') {
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) {
        const storeUser = await User.findOne({
          companyId: tenantId,
          userType:  'store_admin',
        });
        if (storeUser) userId = storeUser.userId;
      }
    }

    const user = await User.findOne({ userId });
    if (user?.photoPath) {
      const filePath = path.join(uploadDir, path.basename(user.photoPath));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await User.findOneAndUpdate(
      { userId },
      { $set: { photoPath: '', updatedAt: new Date() } }
    );

    res.json({ message: 'Photo removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;