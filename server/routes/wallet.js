const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── POST /api/wallet/create-order ── */
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1)
      return res.status(400).json({ error: 'Invalid amount' });

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount:   amount * 100,
      currency: 'INR',
      receipt:  `tb_${req.user.userId}_${Date.now()}`,
    });
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/* ── POST /api/wallet/verify ── */
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body        = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ error: 'Invalid payment signature' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.wallet += Number(amount);
    await user.save();

    await Transaction.create({
      userId:    user._id,
      cupId:     'WALLET_RECHARGE',
      type:      'recharge',
      amount:    Number(amount),
      timestamp: new Date(),
    });

    res.json({ success: true, wallet: user.wallet, message: `₹${amount} added to your wallet` });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ── POST /api/wallet/verify-dev  (DEV ONLY — never call in production) ── */
router.post('/verify-dev', authMiddleware, async (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ error: 'Not available in production' });

  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.wallet += Number(amount);
    await user.save();

    await Transaction.create({
      userId:    user._id,
      cupId:     'WALLET_RECHARGE',
      type:      'recharge',
      amount:    Number(amount),
      timestamp: new Date(),
    });

    res.json({ success: true, wallet: user.wallet });
  } catch (err) {
    console.error('verify-dev error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

/* ── GET /api/wallet/balance ── */
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

module.exports = router;
