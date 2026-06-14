const Team = require('../models/Team');
const User = require('../models/User');
const Setting = require('../models/Setting');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');
const { getRedisClient, invalidateDashboardCache } = require('../config/redis');
const { sendRegistrationApprovedEmail, sendRegistrationRejectedEmail } = require('../config/mailer');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRegistrationStatusLabel(status) {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  return 'Pending Admin Approval';
}

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    const adminUser = await User.findOne({
      isAdmin: true,
      $or: [
        { username: String(identifier).trim().toLowerCase() },
        { email: String(identifier).trim().toLowerCase() },
        { phone: String(identifier).trim() }
      ]
    }).select('+password +isAdmin +email').maxTimeMS(10000);

    if (!adminUser) {
      console.log('[adminController] admin login failed: admin user not found for identifier:', identifier);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Verify password with proper error handling
    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, adminUser.password);
    } catch (bcryptErr) {
      console.error('[adminController] bcrypt error:', bcryptErr.message);
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }

    if (!passwordMatches) {
      console.log('[adminController] admin login failed: bad password for:', adminUser.email || adminUser.phone);
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const fallbackIdentifier = String(adminUser.phone || adminUser._id).trim().toLowerCase();
    const fallbackUsername = String(adminUser.username || adminUser.phone || adminUser._id).trim().toLowerCase();
    const fallbackEmail = `${fallbackIdentifier}@admin.co`;

    if (!adminUser.username || !adminUser.email) {
      await User.updateOne(
        { _id: adminUser._id },
        {
          $set: {
            username: adminUser.username || fallbackUsername,
            email: adminUser.email || fallbackEmail
          }
        }
      );
      console.log('[adminController] backfilled missing admin identity fields');
      adminUser.username = adminUser.username || fallbackUsername;
      adminUser.email = adminUser.email || fallbackEmail;
    }

    const adminEmail = adminUser.email || fallbackEmail;

    const token = jwt.sign(
      {
        id: adminUser._id,
        email: adminEmail,
        admin: true
      },
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: '7d'
      }
    );

    console.log('[adminController] admin login success:', adminEmail);

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: adminUser._id,
        email: adminEmail,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        phone: adminUser.phone
      }
    });
  } catch (err) {
    console.error('[adminController] login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const redis = getRedisClient();
    const cacheKey = 'admin:dashboard:v1';

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'public, max-age=60');
        return res.json(JSON.parse(cached));
      }
    }

    const [totalRegistrations, totalUsers, totalMembers, yearBreakdown, streamBreakdown] = await Promise.all([
      Team.estimatedDocumentCount().maxTimeMS(10000),
      User.estimatedDocumentCount().maxTimeMS(10000),
      Team.collection.aggregate([
        {
          $project: {
            membersCount: {
              $size: { $ifNull: ['$members', []] }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$membersCount' }
          }
        }
      ], { maxTimeMS: 10000 }).toArray(),
      // Use native collection.aggregate so we can pass maxTimeMS option reliably
      Team.collection.aggregate([
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ], { maxTimeMS: 10000 }).toArray(),
      Team.collection.aggregate([
        { $group: { _id: '$stream', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ], { maxTimeMS: 10000 }).toArray()
    ]);

    const payload = {
      totalRegistrations,
      totalUsers,
      totalMembers: totalMembers[0]?.total || 0,
      yearBreakdown,
      streamBreakdown
    };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(payload), { EX: Number(process.env.DASHBOARD_CACHE_TTL_SECONDS || 60) });
      } catch (cacheErr) {
        console.warn('[adminController] cache set failed:', cacheErr.message);
      }
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json(payload);
  } catch (err) {
    console.error('[adminController] dashboard error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.listRegistrations = async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 }).lean();
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const team = await Team.findByIdAndUpdate(id, updates, { new: true });
    if (!team) return res.status(404).json({ msg: 'Team not found' });
    await invalidateDashboardCache();
    res.json({ msg: 'Updated', team });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    await invalidateDashboardCache();
    return res.json({ msg: 'Deleted', team });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.exportRegistrations = async (req, res) => {
  try {
    const teams = await Team.find()
      .sort({ createdAt: 1 })
      .select('teamName leaderName email year stream contact paymentMethod upiMethod paymentReference transactionId paymentStatus whatsappJoined whatsappInviteLink registrationStatus approvedAt rejectedAt userId members createdAt')
      .lean();

    const teamSections = teams.length
      ? teams.map((team, teamIndex) => {
          const members = Array.isArray(team.members) ? team.members : [];
          const memberRows = members.length
            ? members.map((member, idx) => {
                if (typeof member === 'string') {
                  return `<tr><td>${idx + 1}</td><td>${escapeHtml(member)}</td><td></td><td></td><td></td></tr>`;
                }

                return `<tr><td>${idx + 1}</td><td>${escapeHtml(member?.name || '')}</td><td>${escapeHtml(member?.phone || '')}</td><td>${escapeHtml(member?.stream || '')}</td><td>${escapeHtml(member?.year || '')}</td></tr>`;
              }).join('')
            : '<tr><td colspan="5">No members</td></tr>';

          return `
            <div class="section">
              <h2>${teamIndex + 1}. ${escapeHtml(team.teamName || 'Team')}</h2>
              <table>
                <tr><th>Team Name</th><td>${escapeHtml(team.teamName)}</td></tr>
                <tr><th>Leader Name</th><td>${escapeHtml(team.leaderName)}</td></tr>
                <tr><th>Email</th><td>${escapeHtml(team.email)}</td></tr>
                <tr><th>Year</th><td>${escapeHtml(team.year)}</td></tr>
                <tr><th>Stream</th><td>${escapeHtml(team.stream)}</td></tr>
                <tr><th>Contact</th><td>${escapeHtml(team.contact)}</td></tr>
                <tr><th>Payment Method</th><td>${escapeHtml(team.paymentMethod)}</td></tr>
                <tr><th>UPI Method</th><td>${escapeHtml(team.upiMethod || '')}</td></tr>
                <tr><th>Payment Reference</th><td>${escapeHtml(team.paymentReference || team.transactionId)}</td></tr>
                <tr><th>Payment Status</th><td>${escapeHtml(team.paymentStatus || '')}</td></tr>
                <tr><th>WhatsApp Joined</th><td>${team.whatsappJoined ? 'Yes' : 'No'}</td></tr>
                <tr><th>WhatsApp Link</th><td>${escapeHtml(team.whatsappInviteLink)}</td></tr>
                <tr><th>Status</th><td>${escapeHtml(getRegistrationStatusLabel(team.registrationStatus))}</td></tr>
                <tr><th>Approved At</th><td>${escapeHtml(team.approvedAt || '')}</td></tr>
                <tr><th>Rejected At</th><td>${escapeHtml(team.rejectedAt || '')}</td></tr>
                <tr><th>User ID</th><td>${escapeHtml(team.userId || '')}</td></tr>
              </table>

              <div class="section">
                <h3>Team Members (Order-wise)</h3>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Stream</th>
                      <th>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${memberRows}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join('<hr style="margin:24px 0;border:0;border-top:1px solid #999;" />')
      : '<p>No registrations found.</p>';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; }
            h1, h2, h3 { margin: 0 0 10px 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; }
            th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; vertical-align: top; }
            .section { margin-top: 14px; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>All Team Registration Details</h1>
          <p>Total teams: ${teams.length}</p>
          ${teamSections}
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.doc"');
    res.send(html);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getRegistrationLink = async (req, res) => {
  try {
    const doc = await Setting.findOne({ key: 'registration_link' }).lean();
    res.json({ link: doc?.value || '' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.setRegistrationLink = async (req, res) => {
  try {
    const { link } = req.body;
    const doc = await Setting.findOneAndUpdate({ key: 'registration_link' }, { value: link }, { upsert: true, new: true });
    res.json({ msg: 'Updated', link: doc.value });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

async function updateTeamApprovalStatus(res, teamId, status) {
  const team = await Team.findById(teamId);
  if (!team) {
    return { statusCode: 404, payload: { msg: 'Team not found' } };
  }

  team.registrationStatus = status;
  team.approvedAt = status === 'approved' ? new Date() : null;
  team.rejectedAt = status === 'rejected' ? new Date() : null;
  await team.save();
  await invalidateDashboardCache();

  try {
    const mailPayload = {
      ...team.toObject(),
      registrationId: team._id,
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:5001',
      paymentStatus: team.paymentStatus || (team.paymentReference || team.transactionId ? 'Completed' : 'Pending'),
      refundStatus: status === 'rejected' ? 'Refund will be processed within 7–9 working days' : 'Not applicable'
    };

    if (status === 'approved') {
      void sendRegistrationApprovedEmail(mailPayload);
    }

    if (status === 'rejected') {
      void sendRegistrationRejectedEmail(mailPayload);
    }
  } catch (mailError) {
    console.error('[adminController] registration status email failed:', mailError.message);
  }

  return { statusCode: 200, payload: { msg: `Registration ${status}`, team } };
}

exports.approveRegistration = async (req, res) => {
  try {
    const result = await updateTeamApprovalStatus(res, req.params.id, 'approved');
    return res.status(result.statusCode).json(result.payload);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.rejectRegistration = async (req, res) => {
  try {
    const result = await updateTeamApprovalStatus(res, req.params.id, 'rejected');
    return res.status(result.statusCode).json(result.payload);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.downloadRegistrationWord = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    const members = Array.isArray(team.members) ? team.members : [];

    const memberRows = members.length
      ? members.map((member, idx) => {
          const memberName = typeof member === 'string' ? member : member.name || '';
          return `<tr><td>${idx + 1}</td><td>${escapeHtml(memberName)}</td></tr>`;
        }).join('')
      : '<tr><td colspan="2">No members</td></tr>';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; }
            h1, h2 { margin: 0 0 10px 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 8px; }
            th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
            .section { margin-top: 14px; }
          </style>
        </head>
        <body>
          <h1>Team Registration Details</h1>
          <table>
            <tr><th>Team Name</th><td>${escapeHtml(team.teamName)}</td></tr>
            <tr><th>Leader Name</th><td>${escapeHtml(team.leaderName)}</td></tr>
            <tr><th>Year</th><td>${escapeHtml(team.year)}</td></tr>
            <tr><th>Department / Stream</th><td>${escapeHtml(team.stream)}</td></tr>
            <tr><th>Contact Number</th><td>${escapeHtml(team.contact)}</td></tr>
            <tr><th>Email</th><td>${escapeHtml(team.email)}</td></tr>
          </table>

          <div class="section">
            <h2>Team Members</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                ${memberRows}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const fileName = `${String(team.teamName || 'team').replace(/[^a-z0-9_-]/gi, '_')}_details.doc`;
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.downloadRegistrationExcel = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) return res.status(404).json({ msg: 'Team not found' });

    const fields = [
      'teamName',
      'leaderName',
      'year',
      'stream',
      'contact',
      'members',
      'paymentMethod',
      'upiMethod',
      'paymentReference',
      'transactionId',
      'paymentStatus',
      'whatsappJoined',
      'whatsappInviteLink',
      'userId'
    ];

    const parser = new Parser({ fields });
    const row = {
      ...team,
      members: JSON.stringify(team.members || [])
    };
    const csv = parser.parse([row]);

    const fileName = `${String(team.teamName || 'team').replace(/[^a-z0-9_-]/gi, '_')}_details.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
