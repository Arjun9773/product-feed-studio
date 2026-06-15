const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Merchant = require('../models/Merchant');
const Access = require('../models/Access');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getTenantDb } = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const router = express.Router();

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    // Step 1: Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Step 2: Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Step 3: Check access — companyId match + active status
    const access = await Access.findOne({
      userId:    user.userId,
      companyId: user.companyId,
      status:    'active',
    });
    if (!access) {
      return res.status(401).json({ message: 'Access denied. Please contact admin.' });
    }

    // Step 4: Get merchant + company info
    const merchant = await Merchant.findOne({ companyId: user.companyId });
    const company  = await Company.findOne({ companyId: user.companyId });

    // Step 5: Create JWT token
    const token = generateToken({
      id:        user._id,
      userId:    user.userId,
      userType:  user.userType,
      companyId: user.companyId,
      email:     user.email,
    });

    // Step 6: Save login log — fail ஆனாலும் login block பண்ணாத
    try {
      const mainDb = mongoose.connection.useDb(process.env.MAIN_DB_NAME);
      await mainDb.collection('userlogs').insertOne({
        userId:    user.userId,
        email:     user.email,
        userType:  user.userType,
        companyId: user.companyId,
        action:    'login',
        loginAt:   new Date(),
        ip:        req.ip || req.headers['x-forwarded-for'] || '',
      });
    } catch (logErr) {
      console.error('Login log failed:', logErr.message);
    }

    // Step 7: Send response
    res.json({
      token,
      userId:      user.userId,
      userType:    user.userType,
      companyId:   user.companyId,
      companyName: company?.companyName  || '',
      companyUrl:  user.companyUrl       || '',
      email:       user.email,
      shopName:    merchant?.feed_info?.feed_name || '',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  try {
    // Logout log — fail ஆனாலும் response block பண்ணாத
    try {
      const mainDb = mongoose.connection.useDb(process.env.MAIN_DB_NAME);
      await mainDb.collection('userlogs').insertOne({
        userId:    req.user.userId,
        email:     req.user.email || '',
        userType:  req.user.userType,
        companyId: req.user.companyId,
        action:    'logout',
        logoutAt:  new Date(),
        ip:        req.ip || req.headers['x-forwarded-for'] || '',
      });
    } catch (logErr) {
      console.error('Logout log failed:', logErr.message);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/check-email
// ─────────────────────────────────────────────
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ exists: false });
  const user = await User.findOne({ email: email.toLowerCase() });
  res.json({ exists: !!user });
});

// ─────────────────────────────────────────────
// GET /api/auth/check-companyname
// ─────────────────────────────────────────────
router.get('/check-companyname', async (req, res) => {
  const { companyName } = req.query;
  if (!companyName) return res.json({ exists: false });
  const company = await Company.findOne({
    companyId: companyName.toLowerCase().trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  });
  res.json({ exists: !!company });
});

// ─────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { companyName, companyUrl, email, password, phone } = req.body;
  if (!companyName || !companyUrl || !email || !password)
    return res.status(400).json({ message: 'companyName, companyUrl, email and password are required' });

  try {
    // Step 1: Check email already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Step 2: Create company
    const company = await Company.create({
      companyName,
      companyUrl,
      status: 'active',
    });

    // Step 3: Create user
    const user = await User.create({
      companyId:   company.companyId,
      companyName: companyName,
      companyUrl,
      email,
      password,
      phone:    phone || '',
      userType: 'store_admin',
    });

    // Step 4: Create merchant
    const merchant = await Merchant.create({
      companyId: company.companyId,
      userId:    user.userId,
      status:    'active',
    });

    // Step 5: Create access record
    await Access.create({
      companyId:   company.companyId,
      userId:      user.userId,
      userType:    'store_admin',
      companyName: companyName,
      status:      'active',
    });

    // Step 6: Provision tenant DB
    const tenantDb = getTenantDb(company.companyId);
    await tenantDb.collection('settings').insertOne({
      companyId:   company.companyId,
      companyName,
      companyUrl,
      userId:      user.userId,
      merchantId:  merchant._id,
      status:      'active',
      createdAt:   new Date(),
    });

    res.status(201).json({
      message:     'Store created successfully',
      companyId:   company.companyId,
      companyName,
      userId:      user.userId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/seed-super-admin
// ─────────────────────────────────────────────
router.post('/seed-super-admin', async (req, res) => {
  try {
    const exists = await User.findOne({ userType: 'super_admin' });
    if (exists) return res.status(400).json({ message: 'Super admin already exists' });

    const { companyUrl, email, password } = req.body;
    if (!companyUrl || !email || !password)
      return res.status(400).json({ message: 'companyUrl, email and password are required' });

    const company = await Company.create({
      companyName: 'GMC Admin',
      status:      'active',
    });

    const admin = await User.create({
      companyId:  company.companyId,
      companyUrl,
      email,
      password,
      userType: 'super_admin',
    });

    await Access.create({
      companyId: company.companyId,
      userId:    admin.userId,
      userType:  'super_admin',
      userName:  companyUrl,
      status:    'active',
    });

    res.status(201).json({ message: 'Super admin created', userId: admin.userId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  console.log("FORGOT PASSWORD HIT");

  try {
    const { email } = req.body;
    console.log("Email:", email);

    const user = await User.findOne({ email });
    console.log("User Found:", !!user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    console.log("Token Created");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 60000;

    await user.save();
    console.log("User Saved");

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log("Transport Created");

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: `"DigitalDataFeed" <${process.env.EMAIL}>`,
      to: email,
      subject: "Reset Your Password - DigitalDataFeed",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                
                <tr>
                  <td style="background:#4f46e5;padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;">DigitalDataFeed</h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin-top:0;color:#111827;">
                      Reset Your Password
                    </h2>

                    <p style="font-size:16px;color:#4b5563;line-height:1.6;">
                      We received a request to reset the password for your
                      DigitalDataFeed account.
                    </p>

                    <p style="font-size:16px;color:#4b5563;line-height:1.6;">
                      Click the button below to create a new password.
                    </p>

                    <div style="text-align:center;margin:35px 0;">
                      <a
                        href="${resetUrl}"
                        style="
                          background:#4f46e5;
                          color:#ffffff;
                          text-decoration:none;
                          padding:14px 30px;
                          border-radius:8px;
                          display:inline-block;
                          font-size:16px;
                          font-weight:600;
                        "
                      >
                        Reset Password
                      </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                      This link will expire in 1 hour for security reasons.
                    </p>

                    <p style="font-size:14px;color:#6b7280;">
                      If you did not request a password reset, you can safely
                      ignore this email.
                    </p>

                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;" />

                    <p style="font-size:12px;color:#9ca3af;">
                      If the button doesn't work, copy and paste this URL into
                      your browser:
                    </p>

                    <p style="word-break:break-all;font-size:12px;color:#4f46e5;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © ${new Date().getFullYear()} DigitalDataFeed.
                      All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `
    });

    res.json({ message: 'Reset link sent' });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired token'
      });
    }

    // Don't hash here!
    // User model pre-save hook will hash automatically
    user.password = req.body.password;

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({
      message: 'Password reset successful'
    });

  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);

    res.status(500).json({
      message: err.message
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/all-stores  (super_admin only)
// ─────────────────────────────────────────────
router.get('/all-stores', auth, roleCheck('super_admin'), async (req, res) => {
  try {
    const merchants = await Merchant.find({ status: 'active' });

    const stores = await Promise.all(
      merchants.map(async (merchant) => {
        const user    = await User.findOne({ userId: merchant.userId }).select('-password');
        const company = await Company.findOne({ companyId: merchant.companyId });
        return {
          _id:         merchant._id,
          companyId:   merchant.companyId,
          companyName: company?.companyName || '',
          companyUrl:  user?.companyUrl     || '',
          userId:      merchant.userId,
          status:      merchant.status,
        };
      })
    );

    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
