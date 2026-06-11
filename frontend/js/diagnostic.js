/**
 * Diagnostic tool to check backend connectivity and API status
 */

async function checkBackendConnectivity() {
  const resolveBackendBase = () => {
    if (typeof window !== 'undefined' && window.API_BASE_OVERRIDE) return window.API_BASE_OVERRIDE;

    try {
      const viteApiUrl = Function('return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "";')();
      if (viteApiUrl) return String(viteApiUrl).replace(/\/$/, '');
    } catch (error) {
      // ignore when import.meta is unavailable in non-module scripts
    }

    return 'http://localhost:5001';
  };

  const diagnostics = {
    backendUrl: resolveBackendBase(),
    checks: {}
  };

  console.log('=== BACKEND DIAGNOSTICS ===');
  console.log('Backend URL:', diagnostics.backendUrl);

  // Test 1: Basic connectivity
  try {
    console.log('\n[1/5] Testing basic connectivity to backend...');
    const res = await fetch(diagnostics.backendUrl, { method: 'HEAD' });
    diagnostics.checks.basicConnectivity = { status: res.status, ok: res.ok };
    console.log(`✓ Backend responds with status: ${res.status}`);
  } catch (err) {
    diagnostics.checks.basicConnectivity = { error: err.message };
    console.error('✗ Cannot reach backend:', err.message);
  }

  // Test 2: Dashboard API
  try {
    console.log('\n[2/5] Testing /api/admin/dashboard...');
    const res = await fetch(`${diagnostics.backendUrl}/api/admin/dashboard`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    diagnostics.checks.dashboardApi = { status: res.status, data };
    console.log(`✓ Dashboard API status: ${res.status}`, data);
  } catch (err) {
    diagnostics.checks.dashboardApi = { error: err.message };
    console.error('✗ Dashboard API error:', err.message);
  }

  // Test 3: Banner API
  try {
    console.log('\n[3/5] Testing /api/admin/banner...');
    const res = await fetch(`${diagnostics.backendUrl}/api/admin/banner`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    diagnostics.checks.bannerApi = { status: res.status, data };
    console.log(`✓ Banner API status: ${res.status}`, data);
  } catch (err) {
    diagnostics.checks.bannerApi = { error: err.message };
    console.error('✗ Banner API error:', err.message);
  }

  // Test 4: Check localStorage
  console.log('\n[4/5] Checking localStorage...');
  const adminToken = localStorage.getItem('adminToken');
  diagnostics.checks.localStorage = {
    adminToken: adminToken ? '✓ EXISTS' : '✗ NOT FOUND',
    tokenValue: adminToken ? adminToken.substring(0, 20) + '...' : 'NONE'
  };
  console.log('Admin Token:', diagnostics.checks.localStorage.adminToken);

  // Test 5: Check API endpoints
  console.log('\n[5/5] Registered API endpoints:');
  console.log(`- ${diagnostics.backendUrl}/api/admin/dashboard`);
  console.log(`- ${diagnostics.backendUrl}/api/admin/banner`);
  console.log(`- ${diagnostics.backendUrl}/api/auth/login`);

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(diagnostics, null, 2));

  return diagnostics;
}

// Make it accessible from console
window.checkBackendConnectivity = checkBackendConnectivity;

// Additional diagnostic for banner loading
async function checkBannerSystem() {
  console.log('\n=== BANNER SYSTEM DIAGNOSTICS ===');
  const backendUrl = (() => {
    if (typeof window !== 'undefined' && window.API_BASE_OVERRIDE) return window.API_BASE_OVERRIDE;

    try {
      const viteApiUrl = Function('return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "";')();
      if (viteApiUrl) return String(viteApiUrl).replace(/\/$/, '');
    } catch (error) {
      // ignore when import.meta is unavailable in non-module scripts
    }

    return 'http://localhost:5001';
  })();
  
  const bannerDiagnostics = {
    timestamp: new Date().toISOString(),
    bannerApiUrl: `${backendUrl}/api/admin/banner`,
    checks: {}
  };

  // Check 1: Banner API without auth
  try {
    console.log('[1/4] Testing banner API without authentication...');
    const res = await fetch(`${backendUrl}/api/admin/banner`, {
      headers: { 'Content-Type': 'application/json' }
    });
    bannerDiagnostics.checks.bannerApiNoAuth = { 
      status: res.status, 
      statusText: res.statusText,
      ok: res.ok
    };
    const data = await res.json();
    bannerDiagnostics.checks.bannerApiNoAuth.bannerCount = data.banners?.length || 0;
    bannerDiagnostics.checks.bannerApiNoAuth.firstBannerTitle = data.banners?.[0]?.title || 'N/A';
    console.log(`✓ Banner API (no auth): ${res.status}`, `Found ${data.banners?.length || 0} banners`);
  } catch (err) {
    bannerDiagnostics.checks.bannerApiNoAuth = { error: err.message };
    console.error('✗ Banner API error (no auth):', err.message);
  }

  // Check 2: Banner API with auth
  try {
    const adminToken = localStorage.getItem('adminToken');
    console.log('[2/4] Testing banner API with authentication...');
    const res = await fetch(`${backendUrl}/api/admin/banner`, {
      headers: { 
        'Content-Type': 'application/json',
        ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
      }
    });
    bannerDiagnostics.checks.bannerApiWithAuth = { 
      status: res.status, 
      statusText: res.statusText,
      ok: res.ok,
      hasToken: !!adminToken
    };
    const data = await res.json();
    bannerDiagnostics.checks.bannerApiWithAuth.bannerCount = data.banners?.length || 0;
    console.log(`✓ Banner API (with auth): ${res.status}`, `Found ${data.banners?.length || 0} banners`);
  } catch (err) {
    bannerDiagnostics.checks.bannerApiWithAuth = { error: err.message };
    console.error('✗ Banner API error (with auth):', err.message);
  }

  // Check 3: Check banner admin script
  console.log('[3/4] Checking banner admin functions...');
  bannerDiagnostics.checks.functionsAvailable = {
    loadBannerAdmin: typeof loadBannerAdmin === 'function',
    submitBanner: typeof submitBanner === 'function',
    deleteBanner: typeof deleteBanner === 'function',
    updateBanner: typeof updateBanner === 'function',
    bannerAdminState: typeof bannerAdminState !== 'undefined'
  };
  console.log('✓ Functions available:', bannerDiagnostics.checks.functionsAvailable);

  // Check 4: Check DOM elements
  console.log('[4/4] Checking DOM elements...');
  bannerDiagnostics.checks.domElements = {
    bannerForm: !!document.getElementById('bannerForm'),
    bannerTableBody: !!document.getElementById('bannerTableBody'),
    bannerCount: !!document.getElementById('bannerCount'),
    bannerImage: !!document.getElementById('bannerImage'),
    bannerTitle: !!document.getElementById('bannerTitle')
  };
  console.log('✓ DOM Elements:', bannerDiagnostics.checks.domElements);

  console.log('\n=== BANNER DIAGNOSTICS SUMMARY ===');
  console.log(JSON.stringify(bannerDiagnostics, null, 2));

  return bannerDiagnostics;
}

// Make it accessible from console
window.checkBannerSystem = checkBannerSystem;

console.log('Diagnostics loaded. Run:');
console.log('  - checkBackendConnectivity() for general backend checks');
console.log('  - checkBannerSystem() for banner-specific diagnostics');

