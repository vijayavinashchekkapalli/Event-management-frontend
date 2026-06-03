const Setting = require('../models/Setting');

// Key pattern: feeSettings:<eventId> (eventId optional)
function settingsKey(eventId) {
  return `feeSettings:${eventId || 'default'}`;
}

exports.getFeeSettings = async (req, res) => {
  try {
    const eventId = String(req.params.eventId || req.query.eventId || '').trim() || 'default';
    const key = settingsKey(eventId);
    const doc = await Setting.findOne({ key }).maxTimeMS(10000).lean();
    if (!doc) {
      return res.json({ feeSettings: { eventId, feeType: 'per_team', amount: '' } });
    }
    return res.json({ feeSettings: Object.assign({ eventId }, doc.value || {}) });
  } catch (error) {
    console.error('[feeController] getFeeSettings error:', error.message);
    res.status(500).json({ message: 'Failed to load fee settings', error: error.message });
  }
};

exports.updateFeeSettings = async (req, res) => {
  try {
    const eventId = String(req.params.eventId || req.body.eventId || 'default').trim() || 'default';
    const feeType = String(req.body.feeType || '').trim();
    const amountRaw = String(req.body.amount || '').trim();
    const amount = amountRaw === '' ? '' : Number(amountRaw);

    if (!['per_team', 'per_head'].includes(feeType)) {
      return res.status(400).json({ message: 'Invalid feeType. Must be per_team or per_head' });
    }

    if (amountRaw !== '' && (Number.isNaN(amount) || amount < 0)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const key = settingsKey(eventId);
    const value = { feeType, amount, updatedAt: new Date() };

    const updated = await Setting.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Fee settings updated', feeSettings: Object.assign({ eventId }, value) });
  } catch (error) {
    console.error('[feeController] updateFeeSettings error:', error.message);
    res.status(500).json({ message: 'Failed to update fee settings', error: error.message });
  }
};
