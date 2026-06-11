const BANNER_PUBLIC_API = (() => {
  if (typeof window !== 'undefined' && window.API_BASE_OVERRIDE) return `${window.API_BASE_OVERRIDE}/api/banner`;
  let base = 'http://localhost:5001';
  try {
    const viteApiUrl = Function('return (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : "";')();
    if (viteApiUrl) base = String(viteApiUrl).replace(/\/$/, '');
  } catch (error) {
    // ignore when import.meta is unavailable in non-module scripts
  }
  return `${base}/api/banner`;
})();
let bannerSliderCache = null;
let bannerSliderLoading = false;

function createBannerSlider(targetId = 'homepageBanner') {
  const root = document.getElementById(targetId);
  if (!root) return;

  // Prevent duplicate API calls
  if (bannerSliderLoading) {
    console.log('[banner-slider.js] Banner fetch already in progress');
    return;
  }

  // If already loaded, reuse cached content
  if (bannerSliderCache) {
    console.log('[banner-slider.js] Using cached banners');
    renderBannerSlider(root, bannerSliderCache);
    return;
  }

  root.innerHTML = '<div class="banner-loading-state">Loading banners...</div>';
  bannerSliderLoading = true;

  console.log('[banner-slider.js] Fetching banners from:', BANNER_PUBLIC_API);
  
  fetch(BANNER_PUBLIC_API, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000) // 15 second timeout
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((body) => {
      bannerSliderLoading = false;
      const banners = Array.isArray(body.banners) ? body.banners.slice(0, 8) : [];
      
      if (!banners.length) {
        root.innerHTML = '<div class="banner-empty-state">No banners available right now.</div>';
        return;
      }

      // Cache the banners
      bannerSliderCache = banners;
      renderBannerSlider(root, banners);
    })
    .catch((error) => {
      bannerSliderLoading = false;
      console.error('[banner-slider.js] Error loading banners:', error.message);
      root.innerHTML = '<div class="banner-empty-state">Failed to load banners. Please refresh.</div>';
    });
}

function renderBannerSlider(root, banners) {
  let activeIndex = 0;
  let timer = null;

  root.innerHTML = `
    <div class="banner-strip">
      <div class="banner-track"></div>
    </div>
    <div class="banner-dots"></div>
  `;

  const track = root.querySelector('.banner-track');
  const dots = root.querySelector('.banner-dots');

  track.innerHTML = banners.map((banner) => {
    const link = banner.link || '#';
    const openTarget = banner.link && banner.link.startsWith('http') ? '_blank' : '_self';
    const title = banner.title || '';
    return `
      <div class="banner-slide">
        ${banner.link ? `<a href="${link}" target="${openTarget}" rel="noreferrer">` : '<div>'}
          <img class="banner-slide__image" src="${banner.imageUrl}" alt="${title || 'Banner'}" loading="lazy" />
          ${title ? `<div class="banner-overlay">${title}</div>` : ''}
        ${banner.link ? '</a>' : '</div>'}
      </div>
    `;
  }).join('');

  dots.innerHTML = banners.map((_, index) => `<button class="banner-dot ${index === 0 ? 'active' : ''}" type="button" aria-label="Go to banner ${index + 1}"></button>`).join('');

  const render = () => {
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    Array.from(dots.children).forEach((dot, index) => {
      dot.classList.toggle('active', index === activeIndex);
    });
  };

  const next = () => {
    activeIndex = (activeIndex + 1) % banners.length;
    render();
  };

  dots.querySelectorAll('.banner-dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
      activeIndex = index;
      render();
      restartAutoplay();
    });
  });

  const restartAutoplay = () => {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(next, 3000);
  };

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    if (timer) window.clearInterval(timer);
  };

  window.addEventListener('beforeunload', cleanup);

  render();
  restartAutoplay();
}

window.createBannerSlider = createBannerSlider;
window.addEventListener('DOMContentLoaded', () => {
  // Only call once
  if (!window.bannerSliderInitialized) {
    window.bannerSliderInitialized = true;
    createBannerSlider();
  }
});
