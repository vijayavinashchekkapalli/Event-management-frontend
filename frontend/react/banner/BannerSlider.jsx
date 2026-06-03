import React, { useEffect, useMemo, useState } from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { fetchActiveBanners } from './bannerApi';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './bannerSlider.css';

export default function BannerSlider({ fallbackHeight = 260 }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadBanners() {
      try {
        setLoading(true);
        const data = await fetchActiveBanners();
        if (mounted) setBanners(data.slice(0, 8));
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load banners');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBanners();

    return () => {
      mounted = false;
    };
  }, []);

  const hasBanners = useMemo(() => banners.length > 0, [banners]);

  if (loading) {
    return <div className="banner-skeleton" style={{ minHeight: fallbackHeight }} />;
  }

  if (error) {
    return <div className="banner-empty">{error}</div>;
  }

  if (!hasBanners) {
    return <div className="banner-empty">No banners available right now.</div>;
  }

  return (
    <section className="banner-slider" aria-label="Promotional banners">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop
        navigation
        pagination={{ clickable: true }}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1.05 },
          900: { slidesPerView: 1.2 },
          1200: { slidesPerView: 1.4 }
        }}
      >
        {banners.map((banner) => {
          const content = (
            <div className="banner-slide">
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Banner image'}
                loading="lazy"
                className="banner-slide__image"
              />
              {banner.title ? <div className="banner-slide__caption">{banner.title}</div> : null}
            </div>
          );

          return (
            <SwiperSlide key={banner._id}>
              {banner.link ? (
                <a href={banner.link} className="banner-slide__link" target={banner.link.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
                  {content}
                </a>
              ) : (
                content
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
