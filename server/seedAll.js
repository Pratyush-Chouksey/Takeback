require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const User = require('./models/User');
const Cup = require('./models/Cup');
const Transaction = require('./models/Transaction');

// ── Config ──────────────────────────────────────────
const TOTAL_CUPS = 6300;
const CUPS_BORROWED = 1237;
const CUPS_AVAILABLE = 5063;
const TOTAL_USERS = 1050;
const RETURN_PAIRS = 3000; // completed borrow+return pairs from available cups
const QR_COUNT = 50;
const QR_BASE_URL = 'https://takeback-nine.vercel.app/borrow?cupId=';

const FIRST_NAMES = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna',
  'Ishaan','Shaurya','Atharv','Advik','Pranav','Advait','Dhruv','Kabir','Ritvik',
  'Aarush','Darsh','Priya','Ananya','Isha','Diya','Riya','Aisha','Kavya','Pooja',
  'Sneha','Neha','Shreya','Divya','Meera','Nisha','Poonam','Sunita','Geeta',
  'Anjali','Rekha','Usha','Rahul','Rohit','Amit','Sumit','Kunal','Nikhil','Vishal',
  'Sachin','Mohit','Rajesh',
];

const LAST_NAMES = [
  'Sharma','Verma','Singh','Gupta','Patel','Kumar','Joshi','Mehta',
  'Agarwal','Mishra','Tiwari','Pandey','Yadav','Shah','Nair','Pillai',
  'Reddy','Iyer','Menon','Chopra',
];

// ── Helpers ─────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function randomDate(daysAgo) {
  const now = Date.now();
  return new Date(now - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

function padId(n) {
  return `CUP_${String(n).padStart(4, '0')}`;
}

function genPhone(usedPhones) {
  const prefixes = ['7', '8', '9'];
  let phone;
  do {
    phone = pick(prefixes);
    for (let i = 0; i < 9; i++) phone += String(randInt(0, 9));
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return phone;
}

function genEmail(first, last, usedEmails) {
  let email;
  do {
    const num = randInt(10, 999);
    email = `${first.toLowerCase()}.${last.toLowerCase()}${num}@gmail.com`;
  } while (usedEmails.has(email));
  usedEmails.add(email);
  return email;
}

// ── Main ────────────────────────────────────────────
async function seed() {
  console.log('🌱 Takeback Seed Script — Starting...\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── Clear everything ──
  console.log('🗑  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Cup.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  console.log('   Done.\n');

  // ════════════════════════════════════════════════════
  //  1. CREATE USERS
  // ════════════════════════════════════════════════════
  console.log(`👤 Creating ${TOTAL_USERS} users...`);
  const usedPhones = new Set();
  const usedEmails = new Set();
  const userDocs = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    userDocs.push({
      name: `${first} ${last}`,
      email: genEmail(first, last, usedEmails),
      phone: genPhone(usedPhones),
      wallet: randInt(0, 500),
      createdAt: randomDate(180),
    });
    if ((i + 1) % 500 === 0) console.log(`   ...${i + 1} users prepared`);
  }

  const users = await User.insertMany(userDocs);
  console.log(`   ✅ ${users.length} users created.\n`);

  // ════════════════════════════════════════════════════
  //  2. CREATE CUPS
  // ════════════════════════════════════════════════════
  console.log(`☕ Creating ${TOTAL_CUPS} cups...`);
  const cupDocs = [];
  let cupIndex = 1;

  // --- Borrowed cups ---
  for (let i = 0; i < CUPS_BORROWED; i++, cupIndex++) {
    const user = pick(users);
    const borrowedAt = randomDate(30);
    cupDocs.push({
      cupId: padId(cupIndex),
      status: 'borrowed',
      borrowedBy: user._id,
      borrowedAt,
    });
    if (cupIndex % 500 === 0) console.log(`   ...${cupIndex} cups prepared`);
  }

  // --- Available cups ---
  for (let i = 0; i < CUPS_AVAILABLE; i++, cupIndex++) {
    cupDocs.push({
      cupId: padId(cupIndex),
      status: 'available',
    });
    if (cupIndex % 500 === 0) console.log(`   ...${cupIndex} cups prepared`);
  }

  // Insert in batches of 1000
  for (let b = 0; b < cupDocs.length; b += 1000) {
    await Cup.insertMany(cupDocs.slice(b, b + 1000));
    if ((b + 1000) % 500 === 0 || b + 1000 >= cupDocs.length)
      console.log(`   ...inserted ${Math.min(b + 1000, cupDocs.length)} cups`);
  }
  console.log(`   ✅ ${cupDocs.length} cups created.\n`);

  // ════════════════════════════════════════════════════
  //  3. CREATE TRANSACTIONS
  // ════════════════════════════════════════════════════
  console.log('📋 Creating transactions...');
  const txDocs = [];

  // Borrow txn for every currently-borrowed cup
  for (let i = 0; i < CUPS_BORROWED; i++) {
    const cup = cupDocs[i];
    txDocs.push({
      userId: cup.borrowedBy,
      cupId: cup.cupId,
      type: 'borrow',
      amount: -150,
      timestamp: cup.borrowedAt,
    });
  }
  console.log(`   ...${txDocs.length} borrow transactions for active borrows`);

  // 3000 completed borrow+return pairs from available cups
  for (let i = 0; i < RETURN_PAIRS; i++) {
    const user = pick(users);
    const availIdx = CUPS_BORROWED + randInt(0, CUPS_AVAILABLE - 1);
    const cup = cupDocs[availIdx];
    const borrowDate = randomDate(30);
    // return 1-3 days after borrow
    const returnDate = new Date(borrowDate.getTime() + randInt(1, 3) * 24 * 60 * 60 * 1000);

    txDocs.push({
      userId: user._id,
      cupId: cup.cupId,
      type: 'borrow',
      amount: -150,
      timestamp: borrowDate,
    });
    txDocs.push({
      userId: user._id,
      cupId: cup.cupId,
      type: 'return',
      amount: 50,
      timestamp: returnDate,
    });

    if ((i + 1) % 500 === 0) console.log(`   ...${i + 1} borrow/return pairs prepared`);
  }

  // Insert in batches of 1000
  for (let b = 0; b < txDocs.length; b += 1000) {
    await Transaction.insertMany(txDocs.slice(b, b + 1000));
    if ((b + 1000) % 500 === 0 || b + 1000 >= txDocs.length)
      console.log(`   ...inserted ${Math.min(b + 1000, txDocs.length)} transactions`);
  }
  console.log(`   ✅ ${txDocs.length} transactions created.\n`);

  // ════════════════════════════════════════════════════
  //  4. GENERATE QR CODES (first 50 only)
  // ════════════════════════════════════════════════════
  console.log(`📱 Generating QR codes for first ${QR_COUNT} cups...`);
  const qrDir = path.join(__dirname, 'qr-codes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  for (let i = 1; i <= QR_COUNT; i++) {
    const id = padId(i);
    const url = `${QR_BASE_URL}${id}`;
    const filePath = path.join(qrDir, `${id}.png`);
    await QRCode.toFile(filePath, url, { width: 300, margin: 2 });
    if (i % 10 === 0) console.log(`   ...${i}/${QR_COUNT} QR codes`);
  }
  console.log(`   ✅ ${QR_COUNT} QR codes saved to ./qr-codes/\n`);

  // ════════════════════════════════════════════════════
  //  SUMMARY
  // ════════════════════════════════════════════════════
  const borrowOnlyCount = CUPS_BORROWED;
  const pairBorrowCount = RETURN_PAIRS;
  const pairReturnCount = RETURN_PAIRS;

  console.log('═══════════════════════════════════════');
  console.log('  🌱 SEED COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Users created:        ${users.length}`);
  console.log(`  Cups created:         ${cupDocs.length} (${CUPS_BORROWED} borrowed, ${CUPS_AVAILABLE} available)`);
  console.log(`  Transactions created: ${txDocs.length} (${borrowOnlyCount} borrow + ${RETURN_PAIRS} borrow/return pairs)`);
  console.log(`  QR codes generated:   ${QR_COUNT}`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
