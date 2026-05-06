const mongoose = require('mongoose');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Cup = require('./models/Cup');

const QR_DIR = path.join(__dirname, 'qr-codes');
const TOTAL_CUPS = 20;
const BASE_URL = 'https://takeback-nine.vercel.app/borrow';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    if (!fs.existsSync(QR_DIR)) {
      fs.mkdirSync(QR_DIR, { recursive: true });
    }

    await Cup.deleteMany({});
    console.log('Cleared existing cups');

    for (let i = 1; i <= TOTAL_CUPS; i++) {
      const cupId = `CUP_${String(i).padStart(3, '0')}`;

      await Cup.create({ cupId });

      const qrUrl = `${BASE_URL}?cupId=${cupId}`;
      const filePath = path.join(QR_DIR, `${cupId}.png`);
      await QRCode.toFile(filePath, qrUrl);

      console.log(`Created ${cupId} → ${qrUrl}`);
    }

    console.log(`\nSeeded ${TOTAL_CUPS} cups with QR codes in ./qr-codes/`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();