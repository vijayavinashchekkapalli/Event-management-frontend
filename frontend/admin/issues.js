// ============================================================================
// ADMIN ISSUES PANEL - LIVE SERVER COMPATIBLE
// Works with both Live Server (port 5500) and Backend Server (port 5000)
// ============================================================================

// Detect which server is being used and set API URL accordingly
const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.API_BASE_OVERRIDE) return window.API_BASE_OVERRIDE;

  try {
    const viteApiUrl = Function('return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "";')();
    if (viteApiUrl) return String(viteApiUrl).replace(/\/$/, '');
  } catch (error) {
    // ignore when import.meta is unavailable in non-module scripts
  }

  return 'http://localhost:5001';
})();

console.log('🔗 API Base URL:', API_BASE);
console.log('📍 Current URL:', window.location.href);
console.log('🖥️  Hostname:', window.location.hostname);
console.log('🔌 Port:', window.location.port);

const issueState = {
  issues: [],
  page: 1,
  pageSize: 10
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getToken() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
  console.log('[issues] admin token present:', Boolean(token));
  return token || null;
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || '').split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch (error) {
    console.warn('[issues] failed to decode JWT payload:', error.message);
    return null;
  }
}

function redirectToLogin(reason) {
  if (reason) {
    console.warn('[issues] redirecting to login:', reason);
  }
  localStorage.removeItem('adminToken');
  window.location.replace('login.html');
}

function getValidatedToken() {
  const token = getToken();
  if (!token) {
    redirectToLogin('missing token');
    return null;
  }

  const decoded = decodeJwtPayload(token);
  console.log('[issues] token decoded:', decoded);

  if (!decoded || !decoded.id || !decoded.email) {
    redirectToLogin('invalid token payload');
    return null;
  }

  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    redirectToLogin('token expired');
    return null;
  }

  return token;
}

function setTableMessage(message) {
  const table = document.getElementById('issueTable');
  if (!table) return;
  table.innerHTML = `<tr><td colspan="9" style="padding:18px;text-align:center;color:#9ca3af;">${escapeHtml(message)}</td></tr>`;
}

function setLoadingState() {
  const count = document.getElementById('issueCount');
  if (count) count.textContent = 'Loading issues...';
  setTableMessage('⏳ Loading issues...');
}

function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { 
    rows: items.slice(start, start + pageSize), 
    totalPages, 
    page: safePage, 
    total: items.length 
  };
}

function renderPagination(page, totalPages) {
  const container = document.getElementById('issuePagination');
  if (!container) return;

  container.innerHTML = `
    <div class="pagination">
      <button class="btn btn-ghost" ${page <= 1 ? 'disabled' : ''} data-action="prev">← Prev</button>
      <span class="muted">Page ${page} of ${totalPages}</span>
      <button class="btn btn-ghost" ${page >= totalPages ? 'disabled' : ''} data-action="next">Next →</button>
    </div>
  `;

  container.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      issueState.page = button.dataset.action === 'next' ? page + 1 : page - 1;
      renderIssues();
    });
  });
}

function getIssueBadgeClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'green';
  if (normalized === 'processing') return 'orange';
  if (normalized === 'resolved') return 'green';
  if (normalized === 'rejected') return 'red';
  return 'red';
}

function getIssueStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'processing') return 'Under Process';
  if (normalized === 'resolved') return 'Resolved';
  if (normalized === 'rejected') return 'Rejected';
  return 'Pending Review';
}

function getFilteredIssues() {
  const search = String(document.getElementById('issueSearch')?.value || '').trim().toLowerCase();
  const status = String(document.getElementById('issueStatusFilter')?.value || '').trim().toLowerCase();

  return issueState.issues.filter((issue) => {
    const haystack = [
      issue._id,
      issue.studentName,
      issue.username,
      issue.email,
      issue.contactNumber,
      issue.contact,
      issue.issueType,
      issue.issueDescription,
      issue.description,
      issue.status
    ].join(' ').toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesStatus = !status || String(issue.status || '').toLowerCase() === status;
    return matchesSearch && matchesStatus;
  });
}

function renderIssues() {
  const table = document.getElementById('issueTable');
  if (!table) return;

  const filtered = getFilteredIssues();
  const pageData = paginate(filtered, issueState.page, issueState.pageSize);
  issueState.page = pageData.page;

  if (!pageData.rows.length) {
    setTableMessage('No issues reported yet');
    const count = document.getElementById('issueCount');
    if (count) count.textContent = pageData.total ? `${pageData.total} result${pageData.total === 1 ? '' : 's'}` : '0 results';
    renderPagination(pageData.page, pageData.totalPages);
    return;
  }

  table.innerHTML = pageData.rows.map((issue) => {
    const submittedDate = issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—';
    return `
      <tr>
        <td>${escapeHtml(issue._id || '—')}</td>
        <td>${escapeHtml(issue.studentName || issue.username || '—')}</td>
        <td>${escapeHtml(issue.email || '—')}</td>
        <td>${escapeHtml(issue.contactNumber || issue.contact || '—')}</td>
        <td>${escapeHtml(issue.issueType || '—')}</td>
        <td style="max-width:240px;white-space:normal;">${escapeHtml(issue.issueDescription || issue.description || '—')}</td>
        <td>${escapeHtml(submittedDate)}</td>
        <td style="max-width:320px;white-space:normal;">${escapeHtml(issue.adminResponse || '—')}</td>
        <td><span class="badge ${getIssueBadgeClass(issue.status)}">${escapeHtml(getIssueStatusLabel(issue.status))}</span></td>
        <td class="table-actions">
          <button class="btn btn-ghost" onclick="updateStatus('${escapeHtml(issue._id)}', 'processing')">Process</button>
          <button class="btn btn-ghost" onclick="updateStatus('${escapeHtml(issue._id)}', 'resolved')">Resolve</button>
          <button class="btn btn-ghost" onclick="updateStatus('${escapeHtml(issue._id)}', 'rejected')">Reject</button>
          <button class="btn btn-primary" onclick="updateStatus('${escapeHtml(issue._id)}', 'completed')">Complete</button>
          <button class="btn btn-danger" onclick="deleteIssue('${escapeHtml(issue._id)}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  const count = document.getElementById('issueCount');
  if (count) count.textContent = `${pageData.total} result${pageData.total === 1 ? '' : 's'}`;

  renderPagination(pageData.page, pageData.totalPages);
}

async function loadIssues() {
  const token = getValidatedToken();
  if (!token) {
    return;
  }

  console.log('📊 Fetching issues from:', `${API_BASE}/api/admin/issues`);
  setLoadingState();

  try {
    const response = await fetch(`${API_BASE}/api/admin/issues`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // Prevent caching - important for Live Server
      cache: 'no-store'
    });

    console.log('📡 Response Status:', response.status);
    const data = await response.json().catch(() => ([]));
    console.log('📦 Data received:', data);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('🚫 Authentication failed (401/403)');
        redirectToLogin(`issue fetch rejected (${response.status})`);
        return;
      }
      throw new Error(data.msg || data.error || `HTTP ${response.status}`);
    }

    issueState.issues = Array.isArray(data) ? data : data.issues || [];
    console.log('[issues] issues fetched:', issueState.issues.length);
    issueState.page = 1;
    renderIssues();
  } catch (error) {
    console.error('❌ Load failed:', error);
    setTableMessage(`Failed to load issues: ${error.message}`);
    const count = document.getElementById('issueCount');
    if (count) count.textContent = 'Failed to load issues';
  }
}

async function updateStatus(id, status) {
  const token = getValidatedToken();
  if (!token) {
    return;
  }
  console.log('🔄 Updating issue:', id, 'to status:', status);

  let adminResponse = '';
  if (status === 'resolved' || status === 'rejected') {
    adminResponse = prompt('Add an admin response (optional):', '') || '';
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/issues/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, adminResponse }),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));
    console.log('📡 Update Response:', response.status, data);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        redirectToLogin(`issue update rejected (${response.status})`);
        return;
      }
      throw new Error(data.msg || data.error || `HTTP ${response.status}`);
    }

    console.log('✅ Status updated successfully');
    loadIssues();
  } catch (error) {
    console.error('❌ Update failed:', error);
    alert(`Failed to update issue: ${error.message}`);
  }
}

async function deleteIssue(id) {
  const confirmed = confirm('Are you sure you want to delete this issue? This action cannot be undone.');
  if (!confirmed) return;

  const token = getValidatedToken();
  if (!token) {
    return;
  }

  console.log('🗑️  Deleting issue:', id);

  try {
    const response = await fetch(`${API_BASE}/api/admin/issues/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));
    console.log('📡 Delete Response:', response.status, data);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        redirectToLogin(`issue delete rejected (${response.status})`);
        return;
      }
      throw new Error(data.msg || data.error || `HTTP ${response.status}`);
    }

    console.log('✅ Issue deleted successfully');
    loadIssues();
  } catch (error) {
    console.error('❌ Delete failed:', error);
    alert(`Failed to delete issue: ${error.message}`);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 Page loaded, initializing issues panel...');
  
  document.getElementById('issueSearch')?.addEventListener('input', () => {
    issueState.page = 1;
    renderIssues();
  });

  document.getElementById('issueStatusFilter')?.addEventListener('change', () => {
    issueState.page = 1;
    renderIssues();
  });

  loadIssues();
});

// Expose functions for inline onclick handlers
window.loadIssues = loadIssues;
window.updateStatus = updateStatus;
window.deleteIssue = deleteIssue;
