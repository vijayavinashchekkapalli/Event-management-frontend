const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:5001';

function calculatePasswordStrength(password) {
  if (password.length < 8) return 'poor';
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};:'"<>,.?/]/.test(password)) strength++;
  
  if (strength <= 2) return 'poor';
  if (strength <= 4) return 'medium';
  return 'strong';
}

function updatePasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthIndicator = document.getElementById('strengthIndicator');
  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');
  const strengthHint = document.getElementById('strengthHint');
  
  if (password.length === 0) {
    strengthIndicator.classList.remove('visible');
    return;
  }
  
  strengthIndicator.classList.add('visible');
  const strength = calculatePasswordStrength(password);
  
  strengthBar.className = 'strength-bar ' + strength;
  strengthLabel.className = 'strength-label ' + strength;
  
  if (strength === 'poor') {
    strengthLabel.textContent = '🔴 Poor';
    strengthHint.textContent = password.length < 8 ? 'At least 8 characters required.' : 'Add uppercase, numbers, and symbols.';
  } else if (strength === 'medium') {
    strengthLabel.textContent = '🟡 Medium';
    strengthHint.textContent = 'Almost there! Add more character variety.';
  } else {
    strengthLabel.textContent = '🟢 Strong';
    strengthHint.textContent = 'Excellent! Your password is secure.';
  }
}

function isValidEmailAddress(value) {
  const email = String(value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.signup = async () => {
  const firstName = document.getElementById("firstName").value.trim();
  const middleName = document.getElementById("middleName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const status = document.getElementById("signupStatus");
  const submitBtn = document.querySelector('button[onclick*="signup"]');

  // Prevent double submissions
  if (submitBtn && submitBtn.disabled) {
    console.log('[auth.js] Signup already in progress');
    return;
  }

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

  function getSignupErrorMessage(rawMessage) {
    const message = String(rawMessage || '').toLowerCase();

    if (message.includes('email already registered') || message.includes('email already exists')) {
      return 'Email already registered. Please sign in with your login credentials.';
    }

    if (
      message.includes('already registered') ||
      message.includes('already taken') ||
      message.includes('duplicate') ||
      message.includes('exists')
    ) {
      return 'Account already exists. Please sign in with your login credentials.';
    }

    return rawMessage || 'Could not create your account.';
  }

  if (!firstName || !lastName || !phone || !email || !password || !confirmPassword) {
    status.textContent = "Please fill in all required fields.";
    status.className = "status error";
    return;
  }

  if (!isValidEmailAddress(email)) {
    status.textContent = "Please enter a valid email address.";
    status.className = "status error";
    return;
  }

  if (password.length < 8) {
    status.textContent = "Password must be at least 8 characters long.";
    status.className = "status error";
    return;
  }

  const passwordStrength = calculatePasswordStrength(password);
  if (passwordStrength !== 'strong') {
    status.textContent = "Password must be strong (use uppercase, lowercase, numbers, and symbols).";
    status.className = "status error";
    return;
  }

  if (password !== confirmPassword) {
    status.textContent = "Password and confirm password do not match.";
    status.className = "status error";
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    
    status.textContent = "Creating your account...";
    status.className = "status";

    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        firstName,
        middleName,
        lastName,
        email,
        phone,
        password,
        confirmPassword
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.token || !data.user) {
      throw new Error(getSignupErrorMessage(data.message || data.msg || data.error));
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    status.textContent = "Your account is created successfully.";
    status.className = "status success";

    // Show a persistent success modal with 60s countdown and manual redirect
    (function showSignupSuccessModal() {
      const successMessage = 'Your account is successfully created.';
      // Compatibility alias: prevents runtime errors if any stale code path still references submissionResult.
      const submissionResult = successMessage;
      const TOTAL_SECONDS = 60;
      let secondsLeft = TOTAL_SECONDS;
      let countdownInterval = null;
      let redirectTimer = null;
      let redirected = false;

      function createEl(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.keys(attrs).forEach((k) => {
          if (k === 'class') el.className = attrs[k];
          else if (k === 'html') el.innerHTML = attrs[k];
          else el.setAttribute(k, attrs[k]);
        });
        (Array.isArray(children) ? children : [children]).forEach((c) => { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
        return el;
      }

      // Overlay
      const overlay = createEl('div', { class: 'eo-success-overlay', role: 'dialog', 'aria-modal': 'true' });
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.display = 'grid';
      overlay.style.placeItems = 'center';
      overlay.style.background = 'rgba(2,6,23,0.7)';
      overlay.style.backdropFilter = 'blur(6px)';
      overlay.style.zIndex = 99999;

      // Card
      const card = createEl('div', { class: 'eo-success-card' });
      card.style.width = 'min(720px, 96%)';
      card.style.borderRadius = '18px';
      card.style.padding = '26px';
      card.style.background = 'linear-gradient(135deg, rgba(8,10,35,0.92), rgba(32,24,60,0.86))';
      card.style.boxShadow = '0 24px 60px rgba(2,6,23,0.6)';
      card.style.color = '#e6f2ff';
      card.style.textAlign = 'center';
      card.style.fontFamily = 'Poppins, sans-serif';

      const icon = createEl('div', { class: 'eo-success-icon', html: '✅' });
      icon.style.fontSize = '48px';
      icon.style.width = '86px';
      icon.style.height = '86px';
      icon.style.lineHeight = '86px';
      icon.style.borderRadius = '999px';
      icon.style.margin = '0 auto 12px';
      icon.style.background = 'linear-gradient(90deg,#22c55e,#16a34a)';
      icon.style.boxShadow = '0 8px 28px rgba(34,197,94,0.24)';

      const title = createEl('h2', { html: 'Your account is successfully created' });
      title.style.margin = '6px 0 4px';
      title.style.fontSize = '20px';
      title.style.color = '#86efac';

      const info = createEl('p', { html: submissionResult });
      info.style.color = '#dcfce7';
      info.style.margin = '6px 0 12px';

      const regInfo = createEl('div', { class: 'eo-reg-info' });
      regInfo.style.display = 'grid';
      regInfo.style.gridTemplateColumns = '1fr 1fr';
      regInfo.style.gap = '10px';
      regInfo.style.margin = '12px 0 18px';

      const regIdCard = createEl('div', {}, [createEl('div', { html: 'Registration ID', class: 'label' }), createEl('div', { html: (data.user && data.user._id) ? (data.user._id) : (data.user && data.user.id) ? data.user.id : '—' })]);
      regIdCard.style.textAlign = 'left';
      const timeCard = createEl('div', {}, [createEl('div', { html: 'Submitted' , class: 'label'}), createEl('div', { html: new Date().toLocaleString() })]);
      timeCard.style.textAlign = 'left';
      regInfo.appendChild(regIdCard);
      regInfo.appendChild(timeCard);

      // Countdown
      const countdownWrap = createEl('div', { class: 'eo-countdown-wrap' });
      countdownWrap.style.margin = '6px 0 18px';

      const countdownLabel = createEl('div', { html: 'Redirecting to Dashboard in' });
      countdownLabel.style.color = '#86efac';
      countdownLabel.style.fontSize = '13px';
      countdownLabel.style.marginBottom = '8px';

      const countdownDigits = createEl('div', { html: `${secondsLeft}s` });
      countdownDigits.style.fontSize = '44px';
      countdownDigits.style.fontWeight = '700';
      countdownDigits.style.letterSpacing = '0.04em';
      countdownDigits.style.textShadow = '0 0 12px rgba(56,189,248,0.6)';

      const progressTrack = createEl('div');
      progressTrack.style.width = '100%';
      progressTrack.style.height = '10px';
      progressTrack.style.background = 'rgba(148,163,184,0.12)';
      progressTrack.style.borderRadius = '999px';
      progressTrack.style.marginTop = '10px';
      const progressFill = createEl('div');
      progressFill.style.height = '100%';
      progressFill.style.width = '100%';
      progressFill.style.borderRadius = '999px';
      progressFill.style.background = 'linear-gradient(90deg,#22d3ee,#3b82f6,#a855f7)';
      progressFill.style.transition = 'width 1s linear';
      progressTrack.appendChild(progressFill);

      // Manual button
      const actions = createEl('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'center';
      actions.style.gap = '12px';

      const nowBtn = createEl('button', { html: 'Go to Dashboard Now' });
      nowBtn.className = 'btn-primary';
      nowBtn.style.minWidth = '220px';
      nowBtn.style.padding = '12px 18px';

      // Prevent accidental overlay close
      overlay.addEventListener('click', (ev) => ev.stopPropagation());
      card.addEventListener('click', (ev) => ev.stopPropagation());

      actions.appendChild(nowBtn);

      countdownWrap.appendChild(countdownLabel);
      countdownWrap.appendChild(countdownDigits);
      countdownWrap.appendChild(progressTrack);

      card.appendChild(icon);
      card.appendChild(title);
      card.appendChild(info);
      card.appendChild(regInfo);
      card.appendChild(countdownWrap);
      card.appendChild(actions);

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      function updateUI() {
        countdownDigits.innerHTML = `${secondsLeft}s`;
        const pct = Math.max((secondsLeft / TOTAL_SECONDS) * 100, 0);
        progressFill.style.width = `${pct}%`;
      }

      function doRedirect() {
        if (redirected) return;
        redirected = true;
        cleanup();
        window.location.href = '/user/dashboard.html';
      }

      function cleanup() {
        if (countdownInterval) clearInterval(countdownInterval);
        if (redirectTimer) clearTimeout(redirectTimer);
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }

      nowBtn.addEventListener('click', doRedirect);

      countdownInterval = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          updateUI();
          doRedirect();
          return;
        }
        updateUI();
      }, 1000);

      redirectTimer = setTimeout(() => {
        doRedirect();
      }, TOTAL_SECONDS * 1000);

      // initialize
      updateUI();

      // Prevent accidental navigation away via single-clicks on overlay
      window.addEventListener('beforeunload', cleanup);
    })();
  } catch (error) {
    console.error('[auth.js] Signup error:', error);
    status.textContent = error?.message || "Could not create your account.";
    status.className = "status error";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.login = async () => {
  const identifierInput = document.getElementById("identifier") || document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const status = document.getElementById("statusText") || document.getElementById("signupStatus");
  const submitBtn = document.querySelector('button[onclick*="login"]');

  if (!identifierInput || !passwordInput) {
    throw new Error('Login form is missing required fields.');
  }

  // Prevent double submissions
  if (submitBtn && submitBtn.disabled) {
    console.log('[auth.js] Login already in progress');
    return;
  }

  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;

  if (!identifier || !password) {
    if (status) {
      status.textContent = 'Please enter both username/email/phone and password.';
      status.className = 'status error';
    }
    return;
  }

  try {
    if (submitBtn) submitBtn.disabled = true;
    
    if (status) {
      status.textContent = 'Logging in...';
      status.className = 'status';
    }

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Login failed. Please try again.');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (status) {
      status.textContent = 'Login success. Redirecting...';
      status.className = 'status success';
    }

    setTimeout(() => {
      window.location.href = '/user/dashboard.html';
    }, 800);
  } catch (error) {
    console.error('[auth.js] Login error:', error);
    if (status) {
      status.textContent = error?.message || 'Login failed. Please try again.';
      status.className = 'status error';
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

// Attach password strength checker to the password input
if (document.getElementById('password')) {
  document.getElementById('password').addEventListener('input', updatePasswordStrength);
}