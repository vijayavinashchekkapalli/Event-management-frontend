const connectDB = require('../config/db');
const Issue = require('../models/Issue');

async function run(email) {
  try {
    await connectDB();
    const q = { email: String(email || '').trim().toLowerCase() };
    const issues = await Issue.find(q).sort({ createdAt: -1 }).lean();
    console.log(`Found ${issues.length} issues for ${q.email}`);
    console.log(JSON.stringify(issues, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying issues:', err.message);
    process.exit(2);
  }
}

const emailArg = process.argv[2];
if (!emailArg) {
  console.error('Usage: node find_issues_by_email.js <email>');
  process.exit(1);
}

run(emailArg);
