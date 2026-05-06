const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const Cup = require('../models/Cup');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// All admin routes require the x-admin-key header
router.use(adminMiddleware);

// GET /api/admin/cups
// Return all cups sorted: borrowed → pending → available, populate borrower info
router.get('/cups', async (req, res) => {
  try {
    const statusOrder = { borrowed: 0, pending: 1, available: 2 };

    const cups = await Cup.find()
      .populate('borrowedBy', 'name phone')
      .lean();

    cups.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

    return res.json({ success: true, cups });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/cups/stats
// Return counts by status
router.get('/cups/stats', async (req, res) => {
  try {
    const [total, available, borrowed, pending] = await Promise.all([
      Cup.countDocuments(),
      Cup.countDocuments({ status: 'available' }),
      Cup.countDocuments({ status: 'borrowed' }),
      Cup.countDocuments({ status: 'pending' }),
    ]);

    return res.json({ success: true, stats: { total, available, borrowed, pending } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/cups/:cupId/verify
// Admin confirms a returned cup is physically received — reset to available
router.patch('/cups/:cupId/verify', async (req, res) => {
  try {
    const cup = await Cup.findOne({ cupId: req.params.cupId });

    if (!cup) {
      return res.status(404).json({ success: false, message: 'Cup not found' });
    }

    if (cup.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cup is not pending verification' });
    }

    cup.status = 'available';
    cup.borrowedBy = null;
    cup.borrowedAt = null;
    cup.returnedBy = null;
    cup.returnedAt = null;
    await cup.save();

    return res.json({ success: true, message: 'Cup verified and available', cup });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
// Return all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('name phone wallet createdAt').sort({ createdAt: -1 });

    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/transactions
// Return all transactions, newest first, with user info
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name phone')
      .sort({ timestamp: -1 });

    return res.json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
