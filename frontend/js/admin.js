const API_URL = "http://localhost:5001";

const adminState = {
  students: [],
  issues: [],
  studentPage: 1,
  issuePage: 1,
  pageSize: 8,
  selectedIssueIds: new Set(),
  filteredIssueIds: null
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setIssueHeroBadge(message) {
  const badge = document.getElementById('issueCountHero');
  if (badge) {
    badge.textContent = message;
  }
}

function updateIssueMetrics(issues) {
  const total = Array.isArray(issues) ? issues.length : 0;
  const pending = (issues || []).filter((issue) => String(issue.status || 'not-started').toLowerCase() === 'not-started').length;
  const processing = (issues || []).filter((issue) => String(issue.status || '').toLowerCase() === 'processing').length;
  const completed = (issues || []).filter((issue) => String(issue.status || '').toLowerCase() === 'completed').length;

  const values = {
    issueMetricTotal: total,
    issueMetricPending: pending,
    issueMetricProcessing: processing,
    issueMetricCompleted: completed
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = String(value);
    }
  });
}

function getIssueSelectionControls() {
  return {
    header: document.getElementById('issueSelectAll'),
    count: document.getElementById('selectedIssueCount'),
    bulkDelete: document.getElementById('bulkDeleteIssuesBtn')
  };
}

function getVisibleIssueIds() {
  return Array.isArray(adminState.filteredIssueIds)
    ? adminState.filteredIssueIds
    : (adminState.issues || []).map((issue) => String(issue._id || ''));
}

function syncIssueSelectionControls(filteredIssues = adminState.issues) {
  const { header, count, bulkDelete } = getIssueSelectionControls();
  const visibleIssues = Array.isArray(filteredIssues) ? filteredIssues : [];
  const visibleIds = visibleIssues.map((issue) => String(issue._id || ''));
  const selectedVisibleCount = visibleIds.filter((issueId) => adminState.selectedIssueIds.has(issueId)).length;
  const selectedTotal = adminState.selectedIssueIds.size;

  if (header) {
    header.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
    header.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  }

  if (count) {
    count.textContent = selectedTotal > 0 ? `${selectedTotal} selected` : 'No issues selected';
  }

  if (bulkDelete) {
    bulkDelete.disabled = selectedTotal === 0;
  }

  document.querySelectorAll('tr.issue-row').forEach((row) => {
    const issueId = row.getAttribute('data-issue-id');
    const isSelected = issueId && adminState.selectedIssueIds.has(issueId);
    row.classList.toggle('is-selected', isSelected);

    const checkbox = row.querySelector('input.issue-select-checkbox');
    if (checkbox) {
      checkbox.checked = Boolean(isSelected);
    }
  });
}

function toggleIssueSelection(issueId, checked) {
  const normalizedId = String(issueId || '');
  if (!normalizedId) return;

  if (checked) {
    adminState.selectedIssueIds.add(normalizedId);
  } else {
    adminState.selectedIssueIds.delete(normalizedId);
  }

  syncIssueSelectionControls();
}

function toggleAllIssues(checked) {
  const issueIds = getVisibleIssueIds();

  if (checked) {
    issueIds.forEach((issueId) => adminState.selectedIssueIds.add(issueId));
  } else {
    issueIds.forEach((issueId) => adminState.selectedIssueIds.delete(issueId));
  }

  syncIssueSelectionControls();
}

async function deleteSelectedIssues() {
  const selectedIds = Array.from(adminState.selectedIssueIds);

  if (!selectedIds.length) {
    alert('Select at least one issue first.');
    return;
  }

  const confirmed = confirm(`Delete ${selectedIds.length} selected issue${selectedIds.length === 1 ? '' : 's'}? This cannot be undone.`);
  if (!confirmed) return;

  try {
    const token = await getToken();
    if (!token) {
      alert('Session expired. Please login again.');
      window.location.href = '/admin/login.html';
      return;
    }

    const results = await Promise.allSettled(
      selectedIds.map((issueId) => fetch(`${API_URL}/api/admin/issues/${issueId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }))
    );

    const failed = results.filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok));

    if (failed.length) {
      throw new Error(`Failed to delete ${failed.length} selected issue${failed.length === 1 ? '' : 's'}`);
    }

    adminState.selectedIssueIds.clear();
    await loadIssues();
  } catch (err) {
    console.error('[admin.js] bulk delete error:', err.message);
    alert(err.message || 'Bulk delete failed');
  }
}

// 🔐 Get token: prefer server admin token, otherwise Firebase ID token
async function getToken() {
  const serverToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
  if (serverToken) return serverToken;
  const user = window.firebaseUser;
  if (!user) return null;
  return await user.getIdToken();
}
// expose to pages that load this script directly
window.getToken = getToken;

// ======================
// 🚪 LOGOUT
// ======================

function adminLogout() {
  if (confirm('Are you sure you want to logout?')) {
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Log the logout action
      console.log('[admin.js] admin logout triggered');
      
      // Show logout toast
      const message = 'Logged out successfully';
      console.log('[admin.js]', message);
      
      // Use replace to prevent back navigation - use relative path to work with any server
      window.location.replace('/admin/login.html');
    } catch (err) {
      console.error('[admin.js] logout error:', err);
      // Force redirect even if cleanup fails
      window.location.replace('/admin/login.html');
    }
  }
}
window.adminLogout = adminLogout;

// ======================
// 📊 DASHBOARD DATA
// ======================

async function loadDashboard() {
  try {
    const token = await getToken();
    console.log('[admin.js] fetch dashboard', `${API_URL}/api/admin/dashboard`);
    const res = await fetch(`${API_URL}/api/admin/dashboard`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please login again.');
        window.location.href = '/admin/login.html';
        return;
      }
      throw new Error(errorBody.msg || `HTTP ${res.status}`);
    }
    const data = await res.json();

    document.getElementById("totalUsers").innerText = data.totalUsers || 0;
    document.getElementById("totalTeams").innerText = data.totalRegistrations || 0;

  } catch (err) {
    console.error("Dashboard Error:", err);
  }
}

// ======================
// 🧑‍🤝‍🧑 FETCH TEAMS/STUDENTS
// ======================

async function loadStudents() {
  try {
    const token = await getToken();
    console.log('[admin.js] fetch students', `${API_URL}/api/admin/students`);
    const res = await fetch(`${API_URL}/api/admin/students`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please login again.');
        window.location.href = '/admin/login.html';
        return;
      }
      throw new Error(errorBody.msg || `HTTP ${res.status}`);
    }
    const body = await res.json();
    adminState.students = body.teams || [];
    adminState.studentPage = 1;
    renderStudents();

  } catch (err) {
    console.error("Student Load Error:", err);
  }
}

// ======================
// 🆘 FETCH ISSUES
// ======================

async function loadIssues() {
  try {
    const token = await getToken();
    console.log('[admin.js] fetch issues', `${API_URL}/api/admin/issues`);
    const res = await fetch(`${API_URL}/api/admin/issues`, { 
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      method: 'GET'
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error('[admin.js] Load issues failed:', res.status, errorBody);

      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please login again.');
        window.location.href = '/admin/login.html';
        return;
      }

      throw new Error(errorBody.msg || `HTTP ${res.status}`);
    }

    
    const body = await res.json();
    adminState.issues = body.issues || [];
    adminState.filteredIssueIds = adminState.issues.map((issue) => String(issue._id || ''));
    adminState.selectedIssueIds = new Set(
      Array.from(adminState.selectedIssueIds).filter((issueId) => adminState.issues.some((issue) => String(issue._id || '') === String(issueId)))
    );
    adminState.issuePage = 1;
    setIssueHeroBadge(`${adminState.issues.length} issues in queue`);
    updateIssueMetrics(adminState.issues);
    renderIssues();
    syncIssueSelectionControls(adminState.issues);
    console.log('[admin.js] Loaded', adminState.issues.length, 'issues');

  } catch (err) {
    console.error("[admin.js] Issue Load Error:", err.message);
    setIssueHeroBadge('Issue queue unavailable');
    updateIssueMetrics([]);
    alert('Failed to load issues: ' + err.message);
  }
}

function getIssueBadgeClass(status) {
  const normalized = String(status || 'not-started').toLowerCase();
  if (normalized === 'completed') return 'green';
  if (normalized === 'processing') return 'orange';
  return 'red';
}

function getIssueStatusLabel(status) {
  const normalized = String(status || 'not-started').toLowerCase();
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'processing') return 'Processing';
  return 'Pending';
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim().toLowerCase() : '';
}

function getRegistrationBadgeClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('approved')) return 'green';
  if (normalized.includes('rejected')) return 'red';
  return 'orange';
}

function getRegistrationStatusLabel(status) {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized.includes('approved')) return 'Approved';
  if (normalized.includes('rejected')) return 'Rejected';
  return 'Pending Admin Approval';
}

function getPaymentMethodLabel(paymentMethod) {
  const normalized = String(paymentMethod || '').trim().toLowerCase();
  if (!normalized) return '—';
  if (normalized === 'upi') return 'UPI';
  if (normalized === 'razorpay') return 'Razorpay';
  if (normalized === 'free') return 'Free';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getPaymentStatusLabel(team) {
  const registrationStatus = String(team?.registrationStatus || '').toLowerCase();
  const hasPaymentProof = Boolean(team?.paymentReference || team?.transactionId || String(team?.paymentMethod || '').toLowerCase() === 'free');

  if (registrationStatus.includes('rejected')) return 'Rejected';
  if (hasPaymentProof) return 'Approved';
  return 'Pending';
}

function getPaymentStatusBadgeClass(team) {
  const registrationStatus = String(team?.registrationStatus || '').toLowerCase();
  const hasPaymentProof = Boolean(team?.paymentReference || team?.transactionId || String(team?.paymentMethod || '').toLowerCase() === 'free');

  if (registrationStatus.includes('rejected')) return 'red';
  if (hasPaymentProof) return 'green';
  return 'orange';
}

function getPaymentLabel(team) {
  if (team.paymentMethod === 'razorpay') {
    return team.paymentReference ? `razorpay: ${team.paymentReference}` : 'razorpay pending';
  }

  if (team.paymentMethod === 'upi') {
    return team.transactionId ? `upi: ${team.transactionId}` : 'upi pending';
  }

  return team.paymentReference || team.transactionId || '';
}

function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { rows: items.slice(start, start + pageSize), totalPages, page: safePage, total: items.length };
}

function renderPageControls(containerId, page, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="pagination">
      <button class="btn btn-ghost" ${page <= 1 ? 'disabled' : ''} data-action="prev">Prev</button>
      <span class="muted">Page ${page} of ${totalPages}</span>
      <button class="btn btn-ghost" ${page >= totalPages ? 'disabled' : ''} data-action="next">Next</button>
    </div>
  `;
  container.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => onPageChange(button.dataset.action));
  });
}

function renderStudents() {
  const table = document.getElementById('studentTable');
  const search = getValue('studentSearch');
  const year = getValue('studentYearFilter');
  const stream = getValue('studentStreamFilter');

  const filtered = adminState.students.filter((team) => {
    const haystack = `${team.teamName || ''} ${team.leaderName || ''} ${team.email || ''} ${team.stream || ''} ${team.contact || ''} ${team.year || ''} ${team.registrationStatus || ''}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesYear = !year || String(team.year || '').toLowerCase() === year;
    const matchesStream = !stream || String(team.stream || '').toLowerCase() === stream;
    return matchesSearch && matchesYear && matchesStream;
  });

  const pageData = paginate(filtered, adminState.studentPage, adminState.pageSize);
  adminState.studentPage = pageData.page;

  if (table) {
    table.innerHTML = '';
    pageData.rows.forEach(team => {
      const detailsPayload = encodeURIComponent(JSON.stringify(team || {}));
      const paymentMethodLabel = getPaymentMethodLabel(team.paymentMethod);
      const paymentReference = team.transactionId || team.paymentReference || '—';
      const paymentStatusLabel = getPaymentStatusLabel(team);
      const paymentStatusClass = getPaymentStatusBadgeClass(team);
      const registrationStatusLabel = getRegistrationStatusLabel(team.registrationStatus);
      table.innerHTML += `
        <tr>
          <td>
            <button class="btn btn-details" type="button" data-tooltip="View Details" data-team="${detailsPayload}" onclick="openTeamDetailsModal(JSON.parse(decodeURIComponent(this.dataset.team)))">i</button>
          </td>
          <td title="${escapeHtml(team.teamName || '')}">${escapeHtml(team.teamName || '—')}</td>
          <td title="${escapeHtml(team.leaderName || '')}">${escapeHtml(team.leaderName || '—')}</td>
          <td title="${escapeHtml(team.email || '')}">${escapeHtml(team.email || '—')}</td>
          <td>${escapeHtml(team.year || '—')}</td>
          <td title="${escapeHtml(team.stream || '')}">${escapeHtml(team.stream || '—')}</td>
          <td title="${escapeHtml(team.contact || '')}">${escapeHtml(team.contact || '—')}</td>
          <td>${escapeHtml(paymentMethodLabel)}</td>
          <td title="${escapeHtml(paymentReference)}">${escapeHtml(paymentReference)}</td>
          <td><span class="badge ${paymentStatusClass}">${escapeHtml(paymentStatusLabel)}</span></td>
          <td><span class="badge ${getRegistrationBadgeClass(team.registrationStatus)}">${escapeHtml(registrationStatusLabel)}</span></td>
          <td class="actions-cell">
            <div class="action-buttons">
              <button class="btn btn-danger" type="button" onclick="deleteRegistration('${team._id}')" title="Delete registration">Delete</button>
              <button class="approve-btn" type="button" onclick="approveRegistration('${team._id}')" title="Approve registration">Approve</button>
              <button class="reject-btn" type="button" onclick="rejectRegistration('${team._id}')" title="Reject registration">Reject</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  const count = document.getElementById('studentCount');
  if (count) count.textContent = `${pageData.total} result${pageData.total === 1 ? '' : 's'}`;

  renderPageControls('studentPagination', pageData.page, pageData.totalPages, (action) => {
    adminState.studentPage = action === 'next' ? pageData.page + 1 : pageData.page - 1;
    renderStudents();
  });
}

function renderIssues() {
  const table = document.getElementById('issueTable');
  const search = getValue('issueSearch');
  const status = getValue('issueStatusFilter');

  const filtered = adminState.issues.filter((issue) => {
    const haystack = `${issue.issueType || ''} ${issue.studentName || ''} ${issue.email || ''} ${issue.contact || ''} ${issue.description || ''} ${issue.issueDescription || ''} ${issue.status || ''}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesStatus = !status || String(issue.status || '').toLowerCase() === status;
    return matchesSearch && matchesStatus;
  });

  adminState.filteredIssueIds = filtered.map((issue) => String(issue._id || ''));

  const pageData = paginate(filtered, adminState.issuePage, adminState.pageSize);
  adminState.issuePage = pageData.page;

  if (table) {
    table.innerHTML = '';
    pageData.rows.forEach(issue => {
      const issueId = String(issue._id || '');
      const isSelected = adminState.selectedIssueIds.has(issueId);
      const issuePreview = String(issue.issueDescription || issue.description || issue.issueType || '—');
      const issueDetails = String(issue.description || issue.issueDescription || '—');
      const issueShort = issuePreview.length > 56 ? `${issuePreview.slice(0, 56).trim()}…` : issuePreview;
      const submittedDate = issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—';

      table.innerHTML += `
        <tr class="issue-row ${isSelected ? 'is-selected' : ''}" data-issue-id="${issueId}">
          <td class="issue-select-cell">
            <label class="issue-select-wrap" aria-label="Select issue ${issueId}">
              <input
                class="issue-select-checkbox"
                type="checkbox"
                ${isSelected ? 'checked' : ''}
                aria-label="Select issue ${issueId}"
                onchange="toggleIssueSelection('${issueId}', this.checked)"
              />
            </label>
          </td>
          <td>${issue.issueType || ''}</td>
          <td>${issue.studentName || ''}</td>
          <td>${issue.email || '—'}</td>
          <td>${issue.contact || ''}</td>
          <td>${issueShort}</td>
          <td>${issueDetails}</td>
          <td>${submittedDate}</td>
          <td><span class="badge ${getIssueBadgeClass(issue.status)}">${getIssueStatusLabel(issue.status)}</span></td>
          <td class="table-actions"><button class="btn btn-ghost" onclick="updateStatus('${issue._id}', 'processing')">Process</button><button class="btn btn-primary" onclick="updateStatus('${issue._id}', 'completed')">Complete</button><button class="btn btn-danger" onclick="deleteIssue('${issue._id}')">Delete</button></td>
        </tr>
      `;
    });
  }

  const count = document.getElementById('issueCount');
  if (count) count.textContent = `${pageData.total} result${pageData.total === 1 ? '' : 's'}`;

  syncIssueSelectionControls(filtered);

  renderPageControls('issuePagination', pageData.page, pageData.totalPages, (action) => {
    adminState.issuePage = action === 'next' ? pageData.page + 1 : pageData.page - 1;
    renderIssues();
  });
}


window.toggleIssueSelection = toggleIssueSelection;
window.toggleAllIssues = toggleAllIssues;
window.deleteSelectedIssues = deleteSelectedIssues;
// ======================
// 🔄 UPDATE ISSUE STATUS
// ======================

async function updateStatus(id, status) {
  try {
    const token = await getToken();
    console.log('[admin.js] update issue', `${API_URL}/api/admin/issues/${id}`, { status });
    await fetch(`${API_URL}/api/admin/issues/${id}`, {
      method: "PUT",
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {}),
      body: JSON.stringify({ status })
    });

    alert("Status Updated");
    loadIssues();

  } catch (err) {
    console.error("Update Error:", err);
  }
}

async function deleteIssue(id) {
  const confirmed = confirm('Are you sure you want to delete this issue? This action cannot be undone.');
  if (!confirmed) {
    console.log('[admin.js] delete cancelled by user');
    return;
  }
  
  try {
    const token = await getToken();
    if (!token) {
      console.warn('[admin.js] No token found, redirecting to login');
      alert('Session expired. Please login again.');
      window.location.href = '/admin/login.html';
      return;
    }

    console.log('[admin.js] deleting issue:', id);
    console.log('[admin.js] endpoint:', `${API_URL}/api/admin/issues/${id}`);
    console.log('[admin.js] token present:', !!token);

    const res = await fetch(`${API_URL}/api/admin/issues/${id}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[admin.js] delete response status:', res.status);

    // Handle auth errors specifically
    if (res.status === 401 || res.status === 403) {
      console.warn('[admin.js] Auth error on delete:', res.status);
      alert('Session expired. Please login again.');
      window.location.href = '/admin/login.html';
      return;
    }

    const body = await res.json();
    console.log('[admin.js] delete response body:', body);

    if (!res.ok) {
      throw new Error(body.msg || body.error || `HTTP ${res.status}`);
    }

    console.log('[admin.js] issue deleted successfully:', id);
    alert("Issue deleted successfully");
    
    // Remove from UI immediately
    const rows = document.querySelectorAll('tr');
    rows.forEach(row => {
      if (row.textContent.includes(id)) {
        row.style.opacity = '0';
        row.style.transition = 'opacity 300ms ease';
        setTimeout(() => row.remove(), 300);
      }
    });

    // Reload full list to be sure
    setTimeout(() => loadIssues(), 500);

  } catch (err) {
    console.error("[admin.js] Delete Error:", err.message);
    alert('Failed to delete issue: ' + err.message);
  }
}

async function approveRegistration(id) {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/admin/approve/${id}`, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {})
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to approve registration');
    }
    alert('Registration approved');
    loadStudents();
  } catch (err) {
    console.error('Approve Error:', err);
    alert('Failed to approve registration');
  }
}

async function rejectRegistration(id) {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/admin/reject/${id}`, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {})
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to reject registration');
    }
    alert('Registration rejected');
    loadStudents();
  } catch (err) {
    console.error('Reject Error:', err);
    alert('Failed to reject registration');
  }
}

async function deleteRegistration(id) {
  const confirmed = confirm('Are you sure you want to delete this registration? This action cannot be undone.');
  if (!confirmed) return;

  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/admin/registrations/${id}`, {
      method: 'DELETE',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': `Bearer ${token}` } : {})
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to delete registration');
    }
    alert('Registration deleted');
    loadStudents();
  } catch (err) {
    console.error('Delete Registration Error:', err);
    alert('Failed to delete registration');
  }
}

// ======================
// 📥 DOWNLOAD DATA
// ======================

async function downloadData() {
  try {
    const token = await getToken();
    console.log('[admin.js] download word', `${API_URL}/api/admin/download`);
    const res = await fetch(`${API_URL}/api/admin/download`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to download Word document');
    }

    // server returns a Word attachment; handle blob
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = 'none';
    a.href = url;
    a.download = "registrations.doc";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

  } catch (err) {
    console.error("Download Error:", err);
    alert(err.message || 'Failed to download Word document');
  }
}

// ======================
// 🚀 AUTO LOAD (based on page)
// ======================

window.onload = () => {
  if (document.getElementById("issueTable")) {
    loadIssues();
    ['issueSearch', 'issueStatusFilter'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'issueSearch' ? 'input' : 'change', () => { adminState.issuePage = 1; renderIssues(); });
    });
  }

  if (document.getElementById("studentTable")) {
    loadStudents();
    ['studentSearch', 'studentYearFilter', 'studentStreamFilter'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'studentSearch' ? 'input' : 'change', () => { adminState.studentPage = 1; renderStudents(); });
    });
  }

  if (document.getElementById("totalUsers")) {
    loadDashboard();
  }
};