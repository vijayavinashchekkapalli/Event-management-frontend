# Banner Slider

Reusable React banner slider components for the hackathon app.

## Files

- `BannerSlider.jsx` - responsive autoplay carousel using Swiper.js
- `bannerApi.js` - axios client for the public banner endpoint
- `bannerSlider.css` - presentation styles
- `index.js` - barrel export

## Install in your React app

```bash
npm install swiper axios
```

## Usage

```jsx
import React from 'react';
import { BannerSlider } from './banner';

export default function HomePage() {
  return (
    <BannerSlider
      fallbackHeight={260}
    />
  );
}
```

## API contract

- Public endpoint: `GET /api/banner`
- Admin endpoint group: `GET /api/admin/banner`, `POST /api/admin/banner`, `PUT /api/admin/banner/:id`, `DELETE /api/admin/banner/:id`

## Notes

- Autoplay delay is 3 seconds.
- Banners are looped and lazy-loaded.
- Clicking a banner opens its redirect link if one exists.
- The component only renders active banners returned by the backend.
