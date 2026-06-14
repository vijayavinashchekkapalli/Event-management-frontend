const BANNER_API_URL = (() => {
  if (typeof window !== 'undefined' && window.API_BASE_OVERRIDE) return `${window.API_BASE_OVERRIDE}/api/admin/banner`;
  let base = '';
  try {
    const viteApiUrl = Function('return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "";')();
    if (viteApiUrl) base = String(viteApiUrl).replace(/\/$/, '');
  } catch (error) {
    // ignore when import.meta is unavailable in non-module scripts
  }
  if (!base && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      base = 'http://localhost:5001';
    }
  }
  return `${base}/api/admin/banner`;
})();
const MAX_BANNERS_LABEL = 'Up to 8 banners';

const bannerAdminState = {
  banners: [],
  editingId: null
};

function getBannerToken() {
  return typeof getToken === 'function' ? getToken() : Promise.resolve(null);
}

function clearBannerForm() {
  bannerAdminState.editingId = null;
  const form = document.getElementById('bannerForm');
  if (form) form.reset();

  const status = document.getElementById('bannerFormStatus');
  if (status) status.textContent = '';

  const button = document.getElementById('bannerSubmitBtn');
  if (button) button.textContent = 'Create';
}

function populateBannerForm(banner) {
  bannerAdminState.editingId = banner._id;
  const title = document.getElementById('bannerTitle');
  const link = document.getElementById('bannerLink');
  const registrationLink = document.getElementById('bannerRegistrationLink');
  const whatsappGroupLink = document.getElementById('bannerWhatsappGroupLink');
  const upiId = document.getElementById('bannerUpiId');
  const upiAmount = document.getElementById('bannerUpiAmount');
  const upiQrEnabled = document.getElementById('bannerUpiQrEnabled');
  const upiIdEnabled = document.getElementById('bannerUpiIdEnabled');
  const announcement = document.getElementById('bannerAnnouncement');
  const active = document.getElementById('bannerIsActive');
  const file = document.getElementById('bannerImage');
  const upiFile = document.getElementById('bannerUpiImage');
  const status = document.getElementById('bannerFormStatus');
  const button = document.getElementById('bannerSubmitBtn');

  if (title) title.value = banner.title || '';
  if (link) link.value = banner.link || '';
  if (registrationLink) registrationLink.value = banner.registrationLink || '';
  if (whatsappGroupLink) whatsappGroupLink.value = banner.whatsappGroupLink || '';
  if (upiId) upiId.value = banner.upiId || '';
  if (upiAmount) upiAmount.value = banner.upiAmount || '';
  if (upiQrEnabled) upiQrEnabled.checked = banner.upiQrEnabled !== false;
  if (upiIdEnabled) upiIdEnabled.checked = banner.upiIdEnabled !== false;
  if (announcement) announcement.value = banner.announcement || '';
  if (active) active.checked = Boolean(banner.isActive);
  if (file) file.value = '';
  if (upiFile) upiFile.value = '';
  if (status) status.textContent = `Editing banner ${banner.title || banner._id}`;
  if (button) button.textContent = 'Update Banner';
}

function renderBannerRows() {
  const table = document.getElementById('bannerTableBody');
  const count = document.getElementById('bannerCount');
  if (!table) return;

  table.innerHTML = '';

  if (!bannerAdminState.banners.length) {
    table.innerHTML = '<tr><td colspan="7" style="padding:12px;text-align:center;color:#999;">No banners uploaded yet.</td></tr>';
    if (count) count.textContent = '0 banners';
    return;
  }

  if (count) count.textContent = `${bannerAdminState.banners.length} banner${bannerAdminState.banners.length === 1 ? '' : 's'} (${MAX_BANNERS_LABEL})`;

  bannerAdminState.banners.forEach((banner) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="padding:8px;"><img src="${banner.imageUrl}" alt="${banner.title || 'Banner'}" style="width:110px;height:60px;object-fit:cover;border-radius:10px;" loading="lazy" /></td>
      <td style="padding:8px;">${banner.title || '-'}</td>
      <td style="padding:8px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${banner.whatsappGroupLink ? `<a href="${banner.whatsappGroupLink}" target="_blank" rel="noreferrer" title="${banner.whatsappGroupLink}">WhatsApp</a>` : '-'}</td>
      <td style="padding:8px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${banner.registrationLink ? `<a href="${banner.registrationLink}" target="_blank" rel="noreferrer" title="${banner.registrationLink}">Registration</a>` : '-'}</td>
      <td style="padding:8px;">${banner.isActive ? '<span class="banner-pill banner-pill--active">Active</span>' : '<span class="banner-pill">Inactive</span>'}</td>
      <td style="padding:8px;">${new Date(banner.createdAt).toLocaleDateString()}</td>
      <td class="table-actions" style="padding:8px;">
        <button class="btn btn-ghost" type="button" data-banner-action="edit">Edit</button>
        <button class="btn btn-ghost" type="button" data-banner-action="toggle">${banner.isActive ? 'Disable' : 'Enable'}</button>
        <button class="btn btn-primary" type="button" data-banner-action="delete">Delete</button>
      </td>
    `;

    row.querySelector('[data-banner-action="edit"]').addEventListener('click', () => populateBannerForm(banner));
    row.querySelector('[data-banner-action="toggle"]').addEventListener('click', () => updateBanner(banner._id, { isActive: !banner.isActive }, false));
    row.querySelector('[data-banner-action="delete"]').addEventListener('click', () => deleteBanner(banner._id));
    table.appendChild(row);
  });
}

async function loadBannerAdmin() {
  try {
    const token = await getBannerToken();
    console.log('[banner-admin.js] Fetching banners from:', BANNER_API_URL);
    
    const response = await fetch(BANNER_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    console.log('[banner-admin.js] Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const body = await response.json();
    console.log('[banner-admin.js] Response body:', body);
    
    bannerAdminState.banners = body.banners || [];
    console.log('[banner-admin.js] Banners loaded:', bannerAdminState.banners.length);
    renderBannerRows();
  } catch (error) {
    console.error('[banner-admin.js] Banner load error:', error);
    console.error('[banner-admin.js] Error stack:', error.stack);
    
    // Update UI to show error instead of staying in loading state
    const table = document.getElementById('bannerTableBody');
    const count = document.getElementById('bannerCount');
    
    if (table) {
      table.innerHTML = `<tr><td colspan="7" style="padding:18px;text-align:center;color:#d32f2f;font-weight:500;">Failed to load banners: ${error.message}</td></tr>`;
    }
    if (count) {
      count.textContent = 'Error loading banners';
    }
    bannerAdminState.banners = [];
  }
}

async function loadFeeSettings() {
  try {
    const token = await getBannerToken();
    const url = `${BANNER_API_URL.replace('/api/admin/banner','')}/api/fees`;
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) return;
    const body = await response.json();
    const fee = body.feeSettings || { feeType: 'per_team', amount: '' };
    const feeTypeInputs = document.getElementsByName('feeType');
    feeTypeInputs.forEach((input) => input.checked = (input.value === (fee.feeType || 'per_team')));
    const feeAmount = document.getElementById('feeAmount');
    if (feeAmount) feeAmount.value = fee.amount || '';
  } catch (err) {
    console.warn('[banner-admin] loadFeeSettings failed', err);
  }
}

async function submitFeeSettings(event) {
  event.preventDefault();
  const status = document.getElementById('feeSettingsStatus');
  const saveBtn = document.getElementById('saveFeeSettingsBtn');
  const feeType = Array.from(document.getElementsByName('feeType')).find(i => i.checked)?.value || 'per_team';
  const amount = document.getElementById('feeAmount')?.value.trim() || '';
  try {
    if (saveBtn) saveBtn.disabled = true;
    if (status) status.textContent = 'Saving fee settings...';
    const token = await getBannerToken();
    const url = `${BANNER_API_URL.replace('/api/admin/banner','')}/api/fees`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
      body: JSON.stringify({ feeType, amount })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Failed to save fee settings');
    if (status) status.textContent = 'Fee settings saved';
  } catch (err) {
    console.error('[banner-admin] submitFeeSettings error', err);
    if (status) status.textContent = `Error: ${err.message || err}`;
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function submitBanner(event) {
  event.preventDefault();

  const status = document.getElementById('bannerFormStatus');
  const title = document.getElementById('bannerTitle');
  const link = document.getElementById('bannerLink');
  const registrationLink = document.getElementById('bannerRegistrationLink');
  const whatsappGroupLink = document.getElementById('bannerWhatsappGroupLink');
  const upiId = document.getElementById('bannerUpiId');
  const upiAmount = document.getElementById('bannerUpiAmount');
  const upiQrEnabled = document.getElementById('bannerUpiQrEnabled');
  const upiIdEnabled = document.getElementById('bannerUpiIdEnabled');
  const announcement = document.getElementById('bannerAnnouncement');
  const active = document.getElementById('bannerIsActive');
  const file = document.getElementById('bannerImage');
  const upiFile = document.getElementById('bannerUpiImage');
  const submitBtn = document.getElementById('bannerSubmitBtn');

  if (!file?.files?.length && !bannerAdminState.editingId) {
    if (status) status.textContent = 'Please choose a banner image.';
    return;
  }

  const formData = new FormData();
  if (title) formData.append('title', title.value.trim());
  if (link) formData.append('link', link.value.trim());
  if (registrationLink) formData.append('registrationLink', registrationLink.value.trim());
  if (whatsappGroupLink) formData.append('whatsappGroupLink', whatsappGroupLink.value.trim());
  if (upiId) formData.append('upiId', upiId.value.trim());
  if (upiAmount) formData.append('upiAmount', upiAmount.value.trim());
  if (upiQrEnabled) formData.append('upiQrEnabled', String(upiQrEnabled.checked));
  if (upiIdEnabled) formData.append('upiIdEnabled', String(upiIdEnabled.checked));
  if (announcement) formData.append('announcement', announcement.value.trim());
  if (active) formData.append('isActive', String(active.checked));
  if (file?.files?.length) formData.append('image', file.files[0]);
  if (upiFile?.files?.length) formData.append('upiImage', upiFile.files[0]);

  try {
    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = bannerAdminState.editingId ? 'Updating banner...' : 'Creating banner...';

    const token = await getBannerToken();
    const method = bannerAdminState.editingId ? 'PUT' : 'POST';
    const url = `${BANNER_API_URL}${bannerAdminState.editingId ? `/${bannerAdminState.editingId}` : ''}`;
    
    console.log('[banner-admin.js] submit banner', method, url);
    
    const response = await fetch(url, {
      method: method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    console.log('[banner-admin.js] Submit response:', response.status, response.statusText);

    const body = await response.json();
    
    if (!response.ok) {
      throw new Error(body.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (status) status.textContent = body.message || 'Banner saved successfully';
    console.log('[banner-admin.js] Banner saved:', body);
    
    clearBannerForm();
    await loadBannerAdmin();
  } catch (error) {
    console.error('[banner-admin.js] Submit error:', error);
    if (status) status.textContent = `Error: ${error.message || 'Failed to save banner'}`;
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function updateBanner(id, updates, refresh = true) {
  try {
    const token = await getBannerToken();
    const formData = new FormData();

    Object.entries(updates).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const url = `${BANNER_API_URL}/${id}`;
    console.log('[banner-admin.js] update banner', url, updates);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    console.log('[banner-admin.js] Update response:', response.status, response.statusText);

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('[banner-admin.js] Banner updated:', body);
    if (refresh) await loadBannerAdmin();
  } catch (error) {
    console.error('[banner-admin.js] Update error:', error);
    alert(`Error: ${error.message || 'Failed to update banner'}`);
  }
}

async function deleteBanner(id) {
  if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) return;

  try {
    const token = await getBannerToken();
    const url = `${BANNER_API_URL}/${id}`;
    console.log('[banner-admin.js] delete banner', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    console.log('[banner-admin.js] Delete response:', response.status, response.statusText);

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('[banner-admin.js] Banner deleted:', body);
    await loadBannerAdmin();
  } catch (error) {
    console.error('[banner-admin.js] Delete error:', error);
    alert(`Error: ${error.message || 'Failed to delete banner'}`);
  }
}

window.loadBannerAdmin = loadBannerAdmin;
window.clearBannerForm = clearBannerForm;
window.populateBannerForm = populateBannerForm;
window.submitBanner = submitBanner;
window.updateBanner = updateBanner;
window.deleteBanner = deleteBanner;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBannerAdmin);
} else {
  // DOM is already loaded (e.g., script loaded after DOMContentLoaded)
  initializeBannerAdmin();
}

function initializeBannerAdmin() {
  console.log('[banner-admin.js] Initializing banner admin...');
  
  const form = document.getElementById('bannerForm');
  if (form) {
    form.addEventListener('submit', submitBanner);
    console.log('[banner-admin.js] Form submit listener attached');
  } else {
    console.warn('[banner-admin.js] Banner form not found');
  }

  const resetBtn = document.getElementById('bannerResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', clearBannerForm);
    console.log('[banner-admin.js] Reset button listener attached');
  }

  const bannerTableBody = document.getElementById('bannerTableBody');
  if (bannerTableBody) {
    console.log('[banner-admin.js] Banner table found, loading banners...');
    loadBannerAdmin();
  } else {
    console.warn('[banner-admin.js] Banner table body not found');
  }

  // Fee settings form
  const feeForm = document.getElementById('feeSettingsForm');
  if (feeForm) {
    feeForm.addEventListener('submit', submitFeeSettings);
    document.getElementById('resetFeeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('feeAmount').value = '';
    });
    loadFeeSettings();
  } else {
    console.warn('[banner-admin.js] Fee settings form not found');
  }
}
