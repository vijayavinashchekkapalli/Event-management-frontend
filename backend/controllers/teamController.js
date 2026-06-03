const Team = require("../models/Team");
const Payment = require('../models/Payment');
const { invalidateDashboardCache } = require('../config/redis');
const { isValidEmail, sendRegistrationSubmittedEmail } = require('../config/mailer');

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getOwnerIdentifiers(user) {
  return [user?.id, user?.uid, user?.email, user?.phone_number].filter(Boolean);
}

exports.registerTeam = async (req, res) => {
  try {
    const teamName = req.body.teamName;
    const leaderName = req.body.leaderName || req.body.teamLeaderName;
    const email = String(req.body.email || req.body.leaderEmail || req.body.teamLeaderEmail || '').trim().toLowerCase();
    const year = req.body.year;
    const stream = req.body.stream;
    const collegeName = req.body.collegeName || req.body.college || '';
    const contact = req.body.contact || req.body.contactNumber;
    const members = req.body.members || req.body.teamMembers || [];
    const paymentMethod = String(req.body.paymentMethod || '').trim().toLowerCase();
    const upiMethod = String(req.body.upiMethod || '').trim().toLowerCase();
    const transactionId = String(req.body.transactionId || req.body.txn || req.body.paymentReference || '').trim();
    const paymentReference = String(req.body.paymentReference || req.body.paymentId || transactionId || '').trim();
    const paymentStatus = String(req.body.paymentStatus || (transactionId ? 'completed' : 'pending')).trim().toLowerCase() || 'pending';
    const paymentSubmissionId = String(req.body.paymentSubmissionId || '').trim();
    const whatsappJoined = req.body.whatsappJoined === true || req.body.whatsappJoined === 'true';
    const whatsappInviteLink = req.body.whatsappInviteLink || '';
    let paymentSubmission = null;

    if (paymentSubmissionId) {
      paymentSubmission = await Payment.findById(paymentSubmissionId).maxTimeMS(10000).lean();
      if (!paymentSubmission) {
        return res.status(404).json({ msg: 'Payment submission not found' });
      }

      if (paymentSubmission.email && paymentSubmission.email !== email) {
        return res.status(400).json({ msg: 'Payment submission does not match the registration email' });
      }
    }

    const teamLeader = { email, name: leaderName };
    const teamMemberEmails = Array.isArray(members)
      ? members.map((member) => String(member?.email || member?.mail || member?.contactEmail || '').trim().toLowerCase()).filter(Boolean)
      : [];
    const recipientEmails = Array.from(new Set([teamLeader.email, ...teamMemberEmails].filter(Boolean)));

    console.log('[teamController] registerTeam', { teamName, leaderName, email, year, stream, contact });
    console.log('Leader Email:', teamLeader.email);
    console.log('Team Member Emails:', teamMemberEmails);

    if (!teamName || !leaderName || !email || !year || !stream || !contact) {
      return res.status(400).json({ msg: 'Missing required registration fields' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'Enter a valid team leader email address' });
    }

    if (paymentMethod === 'upi' && !transactionId) {
      return res.status(400).json({ msg: 'Please enter valid transaction ID' });
    }

    if (paymentMethod === 'upi' && !['qr', 'upi-id'].includes(upiMethod)) {
      return res.status(400).json({ msg: 'Please choose a UPI payment method' });
    }

    if (transactionId) {
      const duplicateTransaction = await Team.findOne({ transactionId }).maxTimeMS(10000).lean();
      if (duplicateTransaction) {
        return res.status(409).json({ msg: 'This transaction ID has already been used' });
      }
    }

    // Check for duplicate registration regardless of status (pending, approved, rejected)
    const existingTeam = await Team.findOne({
      email: new RegExp(`^${escapeRegExp(email)}$`, 'i')
    }).maxTimeMS(10000).lean();

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate Candidate - This email is already registered.',
        msg: 'Duplicate Candidate - This email is already registered.'
      });
    }

    const team = new Team({
      teamName,
      leaderName,
      email,
      year,
      stream,
      collegeName,
      contact,
      members,
      paymentMethod,
      upiMethod,
      paymentReference: paymentSubmission?.transactionId || paymentReference,
      transactionId: paymentSubmission?.transactionId || transactionId,
      paymentSubmissionId: paymentSubmission?._id ? String(paymentSubmission._id) : paymentSubmissionId,
      paymentScreenshotUrl: paymentSubmission?.screenshotUrl || '',
      paymentScreenshotPublicId: paymentSubmission?.screenshotPublicId || '',
      paymentSubmittedAt: paymentSubmission?.submittedAt || (paymentStatus === 'completed' ? new Date() : null),
      paymentVerificationStatus: paymentSubmission?.status || 'pending',
      paymentReviewNote: paymentSubmission?.reviewNote || '',
      paymentReviewedAt: paymentSubmission?.reviewedAt || null,
      paymentStatus: paymentSubmission?.status || paymentStatus,
      whatsappJoined,
      whatsappInviteLink,
      userId: req.user.id || req.user.uid || req.user.email || '',
      registrationStatus: 'pending',
      approvedAt: null,
      rejectedAt: null
    });

    await team.save();
    await invalidateDashboardCache();

    let emailDelivery = null;
    try {
      console.log('Recipients:', recipientEmails);
      emailDelivery = await sendRegistrationSubmittedEmail({
        email: team.email,
        teamName: team.teamName,
        leaderName: team.leaderName,
        year: team.year,
        stream: team.stream,
        collegeName: team.collegeName,
        contact: team.contact,
        members: team.members,
        paymentMethod: team.paymentMethod,
        upiMethod: team.upiMethod,
        paymentReference: team.paymentReference,
        transactionId: team.transactionId,
        paymentStatus: team.paymentStatus,
        whatsappJoined: team.whatsappJoined,
        registrationStatus: 'Pending Admin Approval'
      });
      console.log('[teamController] registration email delivery summary:', emailDelivery);
    } catch (mailError) {
      console.error('[teamController] registration submitted email failed:', mailError.message);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      msg: 'Team Registered Successfully',
      team,
      registrationStatus: team.registrationStatus,
      emailDelivery
    });
  } catch (err) {
    console.error('[teamController] registerTeam error:', err.message);
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const fields = Object.keys(err.keyPattern || {});
      if (fields.includes('email')) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate Candidate - This email is already registered.',
          msg: 'Duplicate Candidate - This email is already registered.'
        });
      }
      const field = fields[0] || 'field';
      return res.status(409).json({ msg: `${field} already registered` });
    }

    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.listMyRegistrations = async (req, res) => {
  try {
    const ownerIds = getOwnerIdentifiers(req.user);
    const query = ownerIds.length
      ? {
          $or: [
            { userId: { $in: ownerIds } },
            { email: { $in: ownerIds.filter((value) => String(value).includes('@')).map((value) => String(value).toLowerCase()) } }
          ]
        }
      : { userId: req.user?.uid || req.user?.id || req.user?.email || '' };
    
    const teams = await Team.find(query)
      .sort({ createdAt: -1 })
      .maxTimeMS(15000)
      .lean()
      .limit(100);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ teams: teams || [] });
  } catch (err) {
    console.error('[teamController] listMyRegistrations error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};