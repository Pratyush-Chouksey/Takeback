require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const User = require('./models/User');
const Cup = require('./models/Cup');
const Transaction = require('./models/Transaction');

// ── Config ──────────────────────────────────────────
const TOTAL_CUPS     = 10000;
const CUPS_AVAILABLE = 7694;
const CUPS_PENDING   = 150;
const CUPS_BORROWED  = TOTAL_CUPS - CUPS_AVAILABLE - CUPS_PENDING; // 2156
const TOTAL_USERS    = 1050;
const RETURN_PAIRS   = 4000;
const QR_COUNT       = 100;
const QR_BASE_URL    = 'https://takeback-nine.vercel.app/borrow?cupId=';

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
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function randomDate(daysAgo) {
  return new Date(Date.now() - Math.random() * daysAgo * 86400000);
}

function daysAfter(date, min, max) {
  return new Date(date.getTime() + randInt(min, max) * 86400000);
}

function padId(n) {
  return `CUP_${String(n).padStart(4, '0')}`;
}

function genPhone(used) {
  const prefixes = ['7', '8', '9'];
  let phone;
  do {
    phone = pick(prefixes);
    for (let i = 0; i < 9; i++) phone += String(randInt(0, 9));
  } while (used.has(phone));
  used.add(phone);
  return phone;
}

function genEmail(first, last, used) {
  let email;
  do {
    email = `${first.toLowerCase()}.${last.toLowerCase()}${randInt(10, 999)}@gmail.com`;
  } while (used.has(email));
  used.add(email);
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

  // ════════════════════════════════════════════════
  //  1. CREATE USERS
  // ════════════════════════════════════════════════
  console.log(`👤 Creating ${TOTAL_USERS} users...`);
  const usedPhones = new Set();
  const usedEmails = new Set();
  const userDocs   = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    const first = pick(FIRST_NAMES);
    const last  = pick(LAST_NAMES);
    userDocs.push({
      name:      `${first} ${last}`,
      email:     genEmail(first, last, usedEmails),
      phone:     genPhone(usedPhones),
      wallet:    randInt(50, 800),
      createdAt: randomDate(180),
    });
    if ((i + 1) % 500 === 0)
      console.log(`   ...${i + 1} users prepared`);
  }

  const users = await User.insertMany(userDocs);
  console.log(`   ✅ ${users.length} users created.\n`);

  // ════════════════════════════════════════════════
  //  2. CREATE CUPS
  // ════════════════════════════════════════════════
  console.log(`☕ Creating ${TOTAL_CUPS} cups...`);
  const cupDocs = [];
  let idx = 1;

  // ── Borrowed cups (2156) ──
  for (let i = 0; i < CUPS_BORROWED; i++, idx++) {
    const user       = pick(users);
    const borrowedAt = randomDate(30);
    cupDocs.push({
      cupId:      padId(idx),
      status:     'borrowed',
      borrowedBy: user._id,
      borrowedAt,
    });
    if (idx % 1000 === 0)
      console.log(`   ...${idx} cups prepared`);
  }

  // ── Pending cups (150) ──
  for (let i = 0; i < CUPS_PENDING; i++, idx++) {
    const borrowUser   = pick(users);
    const returnUser   = pick(users);
    const borrowedAt   = randomDate(8);   // borrowed 1-8 days ago
    const returnedAt   = daysAfter(borrowedAt, 1, 3);

    cupDocs.push({
      cupId:                padId(idx),
      status:               'pending',
      borrowedBy:           borrowUser._id,
      borrowedAt,
      returnRequestedBy:    returnUser._id,
      returnRequestedAt:    returnedAt,
    });
    if (idx % 1000 === 0)
      console.log(`   ...${idx} cups prepared`);
  }

  // ── Available cups (7694) ──
  for (let i = 0; i < CUPS_AVAILABLE; i++, idx++) {
    cupDocs.push({
      cupId:  padId(idx),
      status: 'available',
    });
    if (idx % 1000 === 0)
      console.log(`   ...${idx} cups prepared`);
  }

  // Insert in batches of 1000
  for (let b = 0; b < cupDocs.length; b += 1000) {
    await Cup.insertMany(cupDocs.slice(b, b + 1000));
    console.log(`   ...inserted ${Math.min(b + 1000, cupDocs.length)} / ${TOTAL_CUPS} cups`);
  }
  console.log(`   ✅ ${cupDocs.length} cups created.\n`);

  // ════════════════════════════════════════════════
  //  3. CREATE TRANSACTIONS
  // ════════════════════════════════════════════════
  console.log('📋 Creating transactions...');
  const txDocs = [];

  // Borrow txn for every currently-borrowed cup
  for (let i = 0; i < CUPS_BORROWED; i++) {
    const cup = cupDocs[i];
    txDocs.push({
      userId:    cup.borrowedBy,
      cupId:     cup.cupId,
      type:      'borrow',
      amount:    -150,
      timestamp: cup.borrowedAt,
    });
  }
  console.log(`   ...${CUPS_BORROWED} borrow txns for active borrows`);

  // Borrow txn for every pending cup (no return credit yet)
  for (let i = CUPS_BORROWED; i < CUPS_BORROWED + CUPS_PENDING; i++) {
    const cup = cupDocs[i];
    txDocs.push({
      userId:    cup.borrowedBy,
      cupId:     cup.cupId,
      type:      'borrow',
      amount:    -150,
      timestamp: cup.borrowedAt,
    });
  }
  console.log(`   ...${CUPS_PENDING} borrow txns for pending cups`);

  // 4000 completed borrow + return pairs (historical)
  const availStart = CUPS_BORROWED + CUPS_PENDING;
  for (let i = 0; i < RETURN_PAIRS; i++) {
    const user       = pick(users);
    const cup        = cupDocs[availStart + randInt(0, CUPS_AVAILABLE - 1)];
    const borrowDate = randomDate(90);
    const returnDate = daysAfter(borrowDate, 1, 4);

    txDocs.push({
      userId:    user._id,
      cupId:     cup.cupId,
      type:      'borrow',
      amount:    -150,
      timestamp: borrowDate,
    });
    txDocs.push({
      userId:    user._id,
      cupId:     cup.cupId,
      type:      'return',
      amount:    50,
      timestamp: returnDate,
    });

    if ((i + 1) % 1000 === 0)
      console.log(`   ...${i + 1} / ${RETURN_PAIRS} return pairs prepared`);
  }

  // Insert in batches of 1000
  for (let b = 0; b < txDocs.length; b += 1000) {
    await Transaction.insertMany(txDocs.slice(b, b + 1000));
    console.log(`   ...inserted ${Math.min(b + 1000, txDocs.length)} / ${txDocs.length} transactions`);
  }
  console.log(`   ✅ ${txDocs.length} transactions created.\n`);

  // ════════════════════════════════════════════════
  //  4. GENERATE QR CODES (first 100 cups)
  // ════════════════════════════════════════════════
  console.log(`📱 Generating ${QR_COUNT} QR codes...`);
  const qrDir = path.join(__dirname, 'qr-codes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  for (let i = 1; i <= QR_COUNT; i++) {
    const id       = padId(i);
    const filePath = path.join(qrDir, `${id}.png`);
    await QRCode.toFile(filePath, `${QR_BASE_URL}${id}`, {
      width: 300, margin: 2,
    });
    if (i % 20 === 0)
      console.log(`   ...${i} / ${QR_COUNT} QR codes done`);
  }
  console.log(`   ✅ ${QR_COUNT} QR codes saved to ./qr-codes/\n`);

  // ════════════════════════════════════════════════
  //  SUMMARY
  // ════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════');
  console.log('  🌱 SEED COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`  Users:        ${users.length}`);
  console.log(`  Cups:         ${TOTAL_CUPS}`);
  console.log(`    Available:  ${CUPS_AVAILABLE}`);
  console.log(`    Borrowed:   ${CUPS_BORROWED}`);
  console.log(`    Pending:    ${CUPS_PENDING}`);
  console.log(`  Transactions: ${txDocs.length}`);
  console.log(`    Active borrows:   ${CUPS_BORROWED}`);
  console.log(`    Pending borrows:  ${CUPS_PENDING}`);
  console.log(`    Historical pairs: ${RETURN_PAIRS} x2 = ${RETURN_PAIRS * 2}`);
  console.log(`  QR codes:     ${QR_COUNT}`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});