const mongoose = require('mongoose');

const cupSchema = new mongoose.Schema({
  cupId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['available', 'borrowed', 'pending'],
    default: 'available',
  },
  borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  borrowedAt: { type: Date, default: null },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  returnedAt: { type: Date, default: null },
  returnRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  returnRequestedAt: { type: Date, default: null },
  returnApprovedBy: { type: String, default: null },
  returnApprovedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Cup', cupSchema);
