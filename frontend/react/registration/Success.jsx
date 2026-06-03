import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const TOTAL_SUCCESS_SECONDS = 60;

function formatClock(value) {
  return String(Math.max(value, 0)).padStart(2, '0');
}

function formatSubmittedAt(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

export default function Success({
  submissionResult,
  successMeta = {},
  successCountdown = TOTAL_SUCCESS_SECONDS,
  onRestart,
  isSubmitting,
  onSubmit,
  submitError,
  formData = {},
  onGoToStep = null,
  onGoToDashboardNow = null,
  onConfirmChange = null
}) {
  const normalizedMembers = Array.isArray(formData.teamMembers) ? formData.teamMembers : [];
  const memberCount = Math.max(Number(formData.teamSize || 0) - 1, 0);
  const countdownSeconds = Math.max(Number(successCountdown || 0), 0);
  const countdownProgress = useMemo(() => Math.max((countdownSeconds / TOTAL_SUCCESS_SECONDS) * 100, 0), [countdownSeconds]);
  const submittedAt = formatSubmittedAt(successMeta.submittedAt);
  const registrationId = successMeta.registrationId || formData.registrationId || 'Pending generation';
  const paymentStatus = successMeta.paymentStatus || (formData.paymentReference || formData.transactionId ? 'Completed' : 'Pending');
  const countdownLabel = `${countdownSeconds}s`;
  
  const handleEditTeamDetails = () => {
    if (onGoToStep) {
      onGoToStep(1);
    }
  };

  const handleEditPayment = () => {
    if (onGoToStep) {
      onGoToStep(2);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
    })
  };

  return (
    <div className="step-panel success-panel">
      {submitError && <div className="error-banner">{submitError}</div>}

      {submissionResult ? (
        <div className="success-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title" aria-describedby="success-description">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="success-modal-shell"
          >
            <div className="success-particles" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={index} className={`success-particle particle-${index + 1}`} />
              ))}
            </div>

            <div className="success-modal-card">
              <div className="success-modal-glow" aria-hidden="true" />
              <div className="success-modal-topbar">
                <div className="success-modal-badge">Registration Confirmed</div>
                <div className="success-modal-status">Pending Verification</div>
              </div>

              <div className="success-modal-hero">
                <div className="success-icon success-icon--large">✓</div>
                <div>
                  <p className="step-kicker">Submission Complete</p>
                  <h2 id="success-title">Registration Submitted Successfully 🎉</h2>
                  <p id="success-description">{submissionResult || 'Your registration has been submitted successfully.'}</p>
                </div>
              </div>

              <div className="success-countdown-wrap">
                <div className="success-countdown-label">Redirecting to Dashboard in</div>
                <div className="success-countdown-clock" aria-live="polite" aria-atomic="true">
                  <span className="success-countdown-digits">{countdownLabel}</span>
                </div>
                <div className="success-countdown-copy">
                  Redirecting to Dashboard in {countdownSeconds}s...
                </div>
                <div className="success-progress-track" aria-hidden="true">
                  <div className="success-progress-fill" style={{ width: `${countdownProgress}%` }} />
                </div>
              </div>

              <div className="success-details-grid">
                <div className="success-detail-card">
                  <span>Registration ID</span>
                  <strong>{registrationId}</strong>
                </div>
                <div className="success-detail-card">
                  <span>Submitted Date &amp; Time</span>
                  <strong>{submittedAt}</strong>
                </div>
                <div className="success-detail-card">
                  <span>Payment Status</span>
                  <strong>{paymentStatus}</strong>
                </div>
                <div className="success-detail-card success-detail-card--wide">
                  <span>Verification</span>
                  <strong>{successMeta.verificationMessage || 'Verification Pending - Your application is under admin review.'}</strong>
                </div>
              </div>

              <div className="success-actions">
                <button className="btn-primary success-now-btn" type="button" onClick={onGoToDashboardNow}>
                  Go to Dashboard Now
                </button>
                <p className="success-lock-note">This screen stays visible for the full 60-second countdown before redirecting automatically.</p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : isSubmitting ? (
        <div className="loading-box">
          <div className="spinner" />
          <p>Submitting your registration...</p>
        </div>
      ) : (
        <>
          <div className="step-panel__header">
            <p className="step-kicker">Step 4 of 4</p>
            <h2>Review & Submit</h2>
            <p>Please review all the details below before completing your registration.</p>
          </div>

          <div className="review-box">
            {/* Team Details Section */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants} className="review-section">
              <div className="section-header">
                <h3 className="section-title">👤 Team Details</h3>
                <button className="edit-btn" onClick={handleEditTeamDetails} title="Edit team details">
                  ✎ Edit
                </button>
              </div>
              <div className="review-grid">
                <div className="review-item">
                  <label>Team Name</label>
                  <p>{formData.teamName || '—'}</p>
                </div>
                <div className="review-item">
                  <label>Team Leader</label>
                  <p>{formData.teamLeaderName || '—'}</p>
                </div>
                <div className="review-item">
                  <label>Leader Email</label>
                  <p>{formData.email || '—'}</p>
                </div>
                <div className="review-item">
                  <label>Contact Number</label>
                  <p>{formData.contactNumber || '—'}</p>
                </div>
                <div className="review-item">
                  <label>Year</label>
                  <p>{formData.year || '—'}</p>
                </div>
                <div className="review-item">
                  <label>Stream</label>
                  <p>{formData.stream || '—'}</p>
                </div>
                <div className="review-item">
                  <label>Team Size</label>
                  <p className="team-size-badge">{formData.teamSize || '—'} members</p>
                </div>
              </div>
            </motion.div>

            {/* Team Members Section */}
            {memberCount > 0 && (
              <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants} className="review-section">
                <div className="section-header">
                  <h3 className="section-title">👥 Team Members ({memberCount})</h3>
                </div>
                <div className="team-members-list">
                  {normalizedMembers.map((member, index) => (
                    <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + index * 0.05 }} className="member-card">
                      <div className="member-header">
                        <span className="member-badge">Member {index + 1}</span>
                      </div>
                      <div className="member-grid">
                        <div className="member-item">
                          <label>Name</label>
                          <p>{member.name || '—'}</p>
                        </div>
                        <div className="member-item">
                          <label>Phone</label>
                          <p>{member.phone || '—'}</p>
                        </div>
                        <div className="member-item">
                          <label>Year</label>
                          <p>{member.year || '—'}</p>
                        </div>
                        <div className="member-item">
                          <label>Stream</label>
                          <p>{member.stream || '—'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Payment Section */}
            <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants} className="review-section">
              <div className="section-header">
                <h3 className="section-title">💳 Payment Details</h3>
                <button className="edit-btn" onClick={handleEditPayment} title="Edit payment">
                  ✎ Edit
                </button>
              </div>
              <div className="payment-info">
                <div className="payment-row">
                  <div className="payment-item">
                    <label>Payment Method</label>
                    <p className={`payment-method-badge ${formData.paymentMethod || 'upi'}`}>
                      {formData.paymentMethod === 'razorpay' ? '💰 Razorpay' : '📱 UPI'}
                    </p>
                  </div>
                  {formData.paymentMethod === 'razorpay' ? (
                    <div className="payment-item">
                      <label>Payment Reference ID</label>
                      <p className="ref-code">{formData.paymentReference || '—'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="payment-item">
                        <label>Transaction ID</label>
                        <p className="ref-code">{formData.transactionId || '—'}</p>
                      </div>
                      <div className="payment-item">
                        <label>UPI ID</label>
                        <p>{formData.paymentReference || '—'}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="payment-status">
                  <span className="success-badge">✔ Payment Completed</span>
                </div>
              </div>
            </motion.div>

            {/* WhatsApp Section */}
            <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="review-section">
              <h3 className="section-title">💬 WhatsApp Confirmation</h3>
              <div className="whatsapp-status">
                <div className="status-item">
                  <span className={`status-badge ${formData.whatsappJoined ? 'joined' : 'not-joined'}`}>
                    {formData.whatsappJoined ? '✔ Group Joined' : '✗ Not Joined'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Submission Confirmation */}
            <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants} className="submission-notice">
              <label className="confirm-acceptance">
                <input
                  type="checkbox"
                  checked={Boolean(formData.submissionConfirmed)}
                  onChange={(event) => onConfirmChange && onConfirmChange(event.target.checked)}
                />
                <span>I confirm that all the information above is correct and complete.</span>
              </label>
              <p>📋 Your registration will be saved as pending admin approval after submission.</p>
            </motion.div>
          </div>

          <div className="step-actions split-actions">
            <button className="btn-secondary" type="button" onClick={onRestart} disabled={isSubmitting} title="Start over with a new registration">
              Start Over
            </button>
            <button className="btn-primary" type="button" onClick={onSubmit} disabled={isSubmitting || !formData.whatsappJoined || !formData.submissionConfirmed} title="Complete your registration">
              {isSubmitting ? 'Submitting...' : 'Accept & Submit'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
