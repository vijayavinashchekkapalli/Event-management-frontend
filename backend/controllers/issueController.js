const Issue = require('../models/Issue');
const User = require('../models/User');
const { sendIssueCreatedEmail, sendIssueStatusUpdateEmail } = require('../config/mailer');

exports.createIssue = async (req, res) => {
  try {
    const {
      issueType,
      studentName,
      name,
      contact,
      contactNumber,
      registeredEmail,
      description,
      issueDescription,
      email
    } = req.body;
    const resolvedName = String(studentName || name || '').trim();
    const resolvedContact = contact || contactNumber || '';
    const resolvedDescription = description || issueDescription || '';
    const resolvedEmail = String(email || registeredEmail || '').trim().toLowerCase();

    if (!issueType || !resolvedName) {
      return res.status(400).json({ msg: 'Missing required issue fields' });
    }

    const issue = new Issue({
      issueType,
      studentName: resolvedName,
      contact: resolvedContact,
      description: resolvedDescription,
      email: resolvedEmail,
      userId: req.user?.uid || req.user?.id || req.user?.email || resolvedEmail || null
    });
    await issue.save();

    // Send confirmation email (non-blocking)
    if (resolvedEmail) {
      try {
        await sendIssueCreatedEmail({
          email: resolvedEmail,
          issueId: issue._id.toString(),
          issueType: issue.issueType,
          studentName: issue.studentName,
          description: issue.description,
          submittedDate: issue.createdAt
        });
        console.log('[issueController] confirmation email sent:', resolvedEmail);
      } catch (mailError) {
        console.error('[issueController] confirmation email failed:', mailError.message);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({ msg: 'Issue created', issue });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.listIssues = async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 }).lean();
    res.json({ issues });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.listUserIssues = async (req, res) => {
  try {
    const identifiers = [req.user?.uid, req.user?.id, req.user?.email]
      .filter(Boolean)
      .map((value) => String(value).trim());

    const query = identifiers.length
      ? {
          $or: [
            { userId: { $in: identifiers } },
            { email: { $in: identifiers.map((value) => value.toLowerCase()) } }
          ]
        }
      : {};

    if (!Object.keys(query).length && req.query.email) {
      query.email = String(req.query.email).trim().toLowerCase();
    }

    if (!Object.keys(query).length && req.query.contact) {
      query.contact = String(req.query.contact).trim();
    }

    const issues = await Issue.find(query).sort({ createdAt: -1 }).lean();
    res.json({ issues });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ msg: 'Issue not found' });

    const oldStatus = issue.status;
    issue.status = status || issue.status;
    if (typeof adminResponse === 'string') {
      issue.adminResponse = adminResponse.trim();
    }
    await issue.save();

    // Send status update email if status changed and email exists
    if (status && status !== oldStatus && issue.email) {
      try {
        await sendIssueStatusUpdateEmail({
          email: issue.email,
          issueId: issue._id.toString(),
          issueType: issue.issueType,
          studentName: issue.studentName,
          newStatus: status,
          updatedDate: new Date()
        });
        console.log('[issueController] status update email sent:', issue.email);
      } catch (mailError) {
        console.error('[issueController] status update email failed:', mailError.message);
        // Don't fail the request if email fails
      }
    }

    res.json({ msg: 'Updated', issue });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ID format
    if (!id || id.length !== 24) {
      console.log('[issueController] invalid issue ID format:', id);
      return res.status(400).json({ msg: 'Invalid issue ID format' });
    }

    console.log('[issueController] deleting issue:', id, 'by user:', req.user?.email || req.user?.uid);
    
    const issue = await Issue.findByIdAndDelete(id);
    
    if (!issue) {
      console.log('[issueController] issue not found:', id);
      return res.status(404).json({ msg: 'Issue not found', id });
    }

    console.log('[issueController] issue deleted successfully:', id);
    res.json({ 
      success: true,
      msg: 'Issue deleted successfully',
      issueId: id
    });
  } catch (err) {
    console.error('[issueController] delete issue error:', err.message, 'stack:', err.stack);
    res.status(500).json({ 
      success: false,
      msg: 'Server error deleting issue', 
      error: err.message 
    });
  }
};
