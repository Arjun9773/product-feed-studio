const express = require('express');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Access = require('../../models/Access');
const Company = require('../../models/Company');

const router = express.Router();

// GET /api/settings/profile — Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    let userId = req.user.userId;

    // Super admin viewing a store — get that store's admin profile
    if (req.user.userType === 'super_admin') {
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) {
        const storeUser = await User.findOne({
          companyId: tenantId,
          userType:  'store_admin',
        }).select('-password');
        if (storeUser) return res.json(storeUser);
      }
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
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: 'Old and new password are required' });

    if (newPassword.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const user = await User.findOne({ userId: req.user.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

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

    const users = await User.find({
      companyId,
      userId: { $ne: req.user.userId },
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

    const adminUser = await User.findOne({ userId: req.user.userId });
    const company   = await Company.findOne({ companyId: req.user.companyId });

    const newUser = await User.create({
      companyId:   req.user.companyId,
      companyName: company?.companyName || '',
      companyUrl:  company?.companyUrl  || '',
      userName:    userName || '',
      email,
      password,
      phone:    adminUser?.phone || '',
      userType: 'user',
    });

    await Access.create({
      companyId:   req.user.companyId,
      companyName: company?.companyName || '',
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

    const user = await User.findOne({ userId, companyId: req.user.companyId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.deleteOne({ userId });
    await Access.deleteOne({ userId, companyId: req.user.companyId });

    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/settings/users-log — Activity log
router.get('/users-log', auth, async (req, res) => {
  try {
    const logs = await Access.find({ companyId: req.user.companyId })
      .sort({ createdAt: -1 })
      .limit(50);

    const logsWithEmail = await Promise.all(
      logs.map(async (log) => {
        const user = await User.findOne({ userId: log.userId }).select('email');
        return {
          userId:    log.userId,
          email:     user?.email || '',
          userType:  log.userType,
          status:    log.status,
          action:    log.status === 'active' ? 'User added' : 'User removed',
          createdAt: log.createdAt,
        };
      })
    );

    res.json(logsWithEmail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;