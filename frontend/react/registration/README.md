# Registration Stepper

This folder contains a production-ready 4-step registration flow for a React app.

## Components

- `RegistrationStepper.jsx` - main controller and API integration
- `TeamDetails.jsx` - step 1, team details
- `Payment.jsx` - step 2, QR / UPI / transaction ID
- `WhatsAppJoin.jsx` - step 3, WhatsApp confirmation
- `Success.jsx` - step 4, final submit and success state
- `api.js` - axios client
- `registrationStepper.css` - responsive styling and slide animation

## Install dependency

If your React app does not already have axios:

```bash
npm install axios
```

## Usage example

```jsx
import React from 'react';
import RegistrationStepper from './registration/RegistrationStepper';

export default function RegisterPage() {
  return (
    <RegistrationStepper
      registerEndpoint="/api/register"
      qrCodeSrc="/assets/images/upi-qr.png"
      upiId="startinno@upi"
      whatsappInviteLink="https://chat.whatsapp.com/your-group-link"
    />
  );
}
```

## Notes

- The flow is strict: users can only advance after the current step validates.
- Form progress is persisted in `localStorage` to avoid refresh loss.
- Step 4 is the locked final submit screen.
- If your backend still uses a different route, update `registerEndpoint` to match it.
