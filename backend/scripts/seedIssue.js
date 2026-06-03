const connectDB = require('../config/db');
const Issue = require('../models/Issue');

(async () => {
  try {
    await connectDB();
    const issue = new Issue({
      issueType: 'test',
      studentName: 'Seeded User',
      contact: '9999999999',
      description: 'Seeded issue for testing admin listing',
      status: 'not-started'
    });
    await issue.save();
    console.log('Seeded issue id:', issue._id);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
})();