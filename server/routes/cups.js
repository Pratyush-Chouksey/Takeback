const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Cup = require('../models/Cup');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// GET /api/cups/:cupId — public (no auth needed for viewing cup info)
router.get('/:cupId', async (req, res) => {
  try {
    const cup = await Cup.findOne({ cupId: req.params.cupId });

    if (!cup) {
      return res.status(404).json({ success: false, message: 'Cup not found' });
    }

    return res.json({ success: true, cup });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// All routes below require authentication
router.use(authMiddleware);

// POST /api/cups/borrow
// Borrow a cup — deducts ₹150 from wallet
router.post('/borrow', async (req, res) => {
  try {
    const { cupId } = req.body;

    const cup = await Cup.findOne({ cupId });
    if (!cup) {
      return res.status(400).json({ success: false, message: 'Cup not found' });
    }
    if (cup.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Cup is not available' });
    }

    const user = await User.findById(req.user.userId);
    if (user.wallet < 150) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct wallet
    user.wallet -= 150;
    await user.save();

    // Update cup status
    cup.status = 'borrowed';
    cup.borrowedBy = user._id;
    cup.borrowedAt = new Date();
    cup.returnedBy = null;
    cup.returnedAt = null;
    await cup.save();

    // Log transaction
    await Transaction.create({
      userId: user._id,
      cupId: cup.cupId,
      type: 'borrow',
      amount: -150,
    });

    return res.json({
      success: true,
      message: 'Cup borrowed successfully',
      cup,
      wallet: user.wallet,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cups/return
// Submit a return request — Rs. 50 credited after admin verification
router.post('/return', async (req, res) => {
  try {
    const { cupId } = req.body;

    const cup = await Cup.findOne({ cupId });
    if (!cup) {
      return res.status(400).json({ success: false, message: 'Cup not found' });
    }
    if (cup.status !== 'borrowed') {
      return res.status(400).json({ success: false, message: 'Cup is not currently borrowed' });
    }

    // Update cup status — no wallet credit yet
    cup.status = 'pending';
    cup.returnRequestedBy = req.user.userId;
    cup.returnRequestedAt = new Date();
    cup.returnedBy = req.user.userId;
    cup.returnedAt = new Date();
    await cup.save();

    return res.json({
      success: true,
      message: 'Return request submitted. ₹50 will be credited once our team verifies the cup.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
