import React from 'react';

const whatsappLogoSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="g" x1="18" y1="16" x2="104" y2="104" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#22c55e" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="50" fill="url(#g)" opacity="0.16" />
    <path d="M60 17C36.8 17 18 35.1 18 57.4c0 12.5 6.1 23.9 16.2 31.4L31 102l13.9-3.2c4.7 1.3 9.7 2 15.1 2 23.2 0 42-18.1 42-40.4S83.2 17 60 17Z" fill="#22c55e"/>
    <path d="M47.8 43.9c-.7-1.7-1.3-1.8-2-1.8h-1.7c-.6 0-1.7.2-2.6 1.2-.9 1-3.4 3.3-3.4 8 0 4.7 3.5 9.2 4 9.8.6.7 6.8 10.9 16.8 15.3 8.3 3.7 10 3 11.8 2.8 1.8-.1 5.8-2.2 6.6-4.4.8-2.2.8-4 .6-4.4-.2-.4-.9-.6-1.9-1.1-1-.5-5.8-2.9-6.8-3.3-1-.4-1.8-.6-2.6.5-.8 1.2-3.1 3.3-3.8 4-.7.7-1.4.8-2.4.3-1-.5-4.3-1.6-8.2-5.2-3-2.7-5.1-6-5.7-7.1-.6-1.1-.1-1.7.4-2.2.4-.4 1-1.2 1.5-1.8.5-.6.7-1.1 1-1.8.3-.7.1-1.4-.1-2-.2-.6-2.6-6.1-3.6-8.5Z" fill="#ffffff"/>
  </svg>
`)}`;

export default function WhatsAppJoin({ onConfirmJoin, canNext, inviteLink, joined, error }) {
  const handleJoinGroup = () => {
    if (!inviteLink) return;
    window.open(inviteLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="step-panel registration-step-content step-content-wrapper whatsapp-step-panel">
      <div className="whatsapp-hero">
        <div className="whatsapp-logo-shell" aria-hidden="true">
          <img className="whatsapp-logo-image" src={whatsappLogoSvg} alt="WhatsApp" />
          <span className="whatsapp-logo-orb whatsapp-logo-orb--one" />
          <span className="whatsapp-logo-orb whatsapp-logo-orb--two" />
        </div>

        <div className="step-panel__header whatsapp-step__header">
          <p className="step-kicker">Step 3 of 4</p>
          <h2>Join the official WhatsApp group</h2>
          <p>Stay connected with your team and never miss important updates or announcements.</p>
        </div>
      </div>

      <div className="whatsapp-card whatsapp-card--premium">
        <div className="whatsapp-benefits-grid">
          <div className="benefit">
            <div className="benefit-icon">🔔</div>
            <div className="benefit-label">Event Updates</div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">👥</div>
            <div className="benefit-label">Team Coordination</div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">📣</div>
            <div className="benefit-label">Important Announcements</div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🎧</div>
            <div className="benefit-label">Live Support</div>
          </div>
        </div>

        <div className="whatsapp-cta">
          <button className="btn-primary whatsapp-join-btn whatsapp-join-btn--large" type="button" onClick={handleJoinGroup} disabled={!inviteLink}>
            <span className="whatsapp-btn-icon">🌐</span>
            <span className="whatsapp-btn-text">Join WhatsApp Group</span>
            <span className="whatsapp-btn-arrow">›</span>
          </button>

          <div className="divider-or"><span>or</span></div>

          <button
            className={`btn-outline-ghost whatsapp-i-joined ${joined ? 'confirmed' : ''}`}
            type="button"
            onClick={onConfirmJoin}
            disabled={joined || !inviteLink}
          >
            {joined ? '✓ I Joined the Group' : 'I Joined the Group'}
          </button>
        </div>

        <p className="whatsapp-card__note">
          The invite link is hidden for security reasons.
        </p>
      </div>

      {error && <small className="field-error whatsapp-error">{error}</small>}

      <div className="step-actions split-actions whatsapp-step-actions">
        <button className="btn-primary" type="button" disabled={!canNext}>
          Next
        </button>
      </div>
    </div>
  );
}
