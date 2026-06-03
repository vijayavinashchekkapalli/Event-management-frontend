import React from 'react';

export default function Payment({ data, errors, onChange, onNext, canNext, qrCodeSrc, upiId }) {
  const copyUpiId = async () => {
    if (!upiId) return;

    try {
      await navigator.clipboard.writeText(upiId);
    } catch {
      const tempInput = document.createElement('input');
      tempInput.value = upiId;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }
  };

  return (
    <div className="step-panel">
      <div className="step-panel__header">
        <p className="step-kicker">Step 2 of 4</p>
        <h2>Payment</h2>
        <p>Choose Razorpay or UPI, then confirm your payment details.</p>
      </div>

      <div className="payment-grid">
        <div className="payment-card">
          <div className="payment-options">
            <button type="button" className={`payment-choice ${data.paymentMethod === 'razorpay' ? 'active' : ''}`} onClick={() => onChange('paymentMethod', 'razorpay')}>
              Razorpay
            </button>
            <button type="button" className={`payment-choice ${data.paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => onChange('paymentMethod', 'upi')}>
              UPI
            </button>
          </div>

          {data.paymentMethod === 'razorpay' ? (
            <div className="hint-box">
              <strong>Razorpay</strong>
              <p>Click pay to confirm a Razorpay payment reference for the registration.</p>
              <button className="btn-primary" type="button" onClick={() => onNext({ paymentMethod: 'razorpay', paymentReference: `RAZORPAY-${Date.now()}` })}>
                Pay with Razorpay
              </button>
            </div>
          ) : (
            <div className="upi-payment-card">
              <div className="upi-mode-switch" role="tablist" aria-label="UPI display mode">
                <button
                  type="button"
                  className={`upi-mode-btn ${data.paymentViewMode !== 'id' ? 'active' : ''}`}
                  onClick={() => onChange('paymentViewMode', 'scanner')}
                >
                  UPI Scanner
                </button>
                <button
                  type="button"
                  className={`upi-mode-btn ${data.paymentViewMode === 'id' ? 'active' : ''}`}
                  onClick={() => onChange('paymentViewMode', 'id')}
                >
                  UPI ID
                </button>
              </div>

              <div className="upi-scanner-wrap">
                {data.paymentViewMode === 'id' ? (
                  <div className="upi-id-panel">
                    <div className="upi-scanner-copy">
                      <strong>UPI ID</strong>
                      <p>Copy the admin-uploaded UPI ID and complete the payment in your app.</p>
                    </div>
                    <div className="payment-meta">
                      <div className="upi-copy-row">
                        <strong>{upiId || 'UPI ID not configured'}</strong>
                        <button className="btn-secondary btn-sm" type="button" onClick={copyUpiId} disabled={!upiId}>
                          Copy UPI ID
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <img className="payment-qr" src={qrCodeSrc} alt="UPI QR code" />
                    <div className="upi-scanner-copy">
                      <strong>Scan & Pay</strong>
                      <p>Use the admin-uploaded UPI scanner or switch to UPI ID mode.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="payment-copy">
          {data.paymentMethod === 'upi' && (
            <label className="field">
              <span>Transaction ID</span>
              <input
                type="text"
                value={data.transactionId}
                onChange={(event) => onChange('transactionId', event.target.value)}
                placeholder="Enter UPI Transaction ID"
                autoComplete="off"
              />
              {errors.transactionId && <small className="field-error">{errors.transactionId}</small>}
            </label>
          )}

          <div className="hint-box">
            <strong>Important</strong>
            <p>Continue only after the payment method has been confirmed.</p>
          </div>
        </div>
      </div>

      <div className="step-actions split-actions">
        <button className="btn-primary" type="button" onClick={() => onNext({ paymentMethod: data.paymentMethod, transactionId: data.transactionId.trim(), paymentReference: data.paymentMethod === 'razorpay' ? data.paymentReference : data.transactionId.trim() })} disabled={!canNext}>
          {data.paymentMethod === 'upi' ? 'I Have Paid' : 'Next'}
        </button>
      </div>
    </div>
  );
}
